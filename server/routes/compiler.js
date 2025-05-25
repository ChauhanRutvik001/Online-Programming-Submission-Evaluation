
/**
 * CODE COMPILATION AND EXECUTION ROUTES
 * 
 * This file contains routes for code compilation and execution using Judge0 API.
 * Routes handle code submission, testing against problem test cases, and submission creation.
 * 
 * MIDDLEWARE:
 * - isAuthorized: Required for all routes (user must be logged in)
 * 
 * BASE PATH: /api/v1/compiler
 * 
 * FEATURES:
 * - Rate limiting per user (20 requests per minute)
 * - Queue management for concurrent submissions
 * - Judge0 API integration with RapidAPI
 * - Base64 encoding/decoding for code and test data
 * - Comprehensive error handling with retry logic
 * - Test case execution and result comparison
 * - Automatic submission creation for full test runs
 */

import express from "express";
import axios from "axios";
import problem from "../models/problem.js";
import submission from "../models/submission.js";
import { isAuthorized } from "../middlewares/auth.js";
// We'll dynamically import batch model when needed to avoid circular dependencies

const router = express.Router();

// Update Judge0 API base URL and token to use RapidAPI
const JUDGE0_BASE_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_HOST = "judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = "dbe32c7301msha8dfc9660bdf2bfp1bf391jsn29d2b4dbdae2";

const getLanguageId = (language) => {
  const languageMap = {
    python: 71,
    cpp: 54,
    java: 62,
    javascript: 63,
  };
  return languageMap[language] || null;
};

const decodeBase64 = (base64Str) => {
  if (!base64Str) return "";
  const buffer = Buffer.from(base64Str, "base64");
  return buffer.toString("utf-8");
};

const encodeToBase64 = (str) => {
  return Buffer.from(str, "utf-8").toString("base64");
};

const normalizeOutput = (output) => {
  if (!output || typeof output !== "string") {
    return ""; // Return an empty string if output is not valid
  }
  return output
    .replace(/\r\n/g, "\n") // Normalize line breaks first
    .trim(); // Trim the output
};

const logServerInstance = (response, requestType) => {
  const instance = response.headers["x-server-instance"];
  console.log(`${requestType} handled by instance:`, instance);
  console.log("Response status:", response.status);
};

// Add a simple request counter for basic load monitoring
let requestCounter = 0;

// Add queue monitoring
const queueStatus = {
  pending: 0,
  processing: 0,
};

// Add rate limiting configuration
const userSubmissionLimits = {
  windowMs: 60000, // 1 minute
  maxRequests: 20, // max requests per minute per user
};
const userSubmissionCounts = new Map();

// Add this function to manage rate limiting
const checkRateLimit = (userId) => {
  const now = Date.now();
  const userCount = userSubmissionCounts.get(userId) || {
    count: 0,
    timestamp: now,
  };

  if (now - userCount.timestamp > userSubmissionLimits.windowMs) {
    // Reset if window has passed
    userCount.count = 1;
    userCount.timestamp = now;
  } else if (userCount.count >= userSubmissionLimits.maxRequests) { // Fixed typo: maxRequits -> maxRequests
    return false; // Rate limit exceeded
  } else {
    userCount.count++;
  }

  userSubmissionCounts.set(userId, userCount);
  return true;
};

/**
 * POST /compiler/run-code
 * Execute code against problem test cases using Judge0 API
 * 
 * FEATURES:
 * - Rate limiting: 20 requests per minute per user
 * - Queue management for concurrent submissions
 * - Support for multiple programming languages (Python, C++, Java, JavaScript)
 * - Test case execution with hidden/visible test case filtering
 * - Full submission creation when allTestCases=true
 * - Comprehensive error handling and retry logic
 * - Performance metrics tracking (time, memory usage)
 * 
 * USED BY FRONTEND COMPONENTS:
 * - CodeEditor/CodeEditor.jsx (line 95) - Main code execution for testing
 * - CodeEditor/CodeEditor.jsx (line 142) - Commented alternative execution
 * - CodeEditor/CodeEditor.jsx (line 249) - Code submission for full evaluation
 * 
 * REQUEST BODY:
 * - code: Source code to execute
 * - language: Programming language (python, cpp, java, javascript)
 * - allTestCases: Boolean - if true, runs all test cases and creates submission
 * - problemId: ID of the problem containing test cases
 * 
 * RESPONSE:
 * - testResults: Array of test case results with pass/fail status
 * - overallTime: Total execution time in milliseconds
 * - averageMemory: Average memory usage in MB
 * - totalMarks: Total marks obtained from passed test cases
 * - submissionStatus: "completed" or "rejected"
 * - submissionId: ID of created submission (when allTestCases=true)
 */
router.post("/run-code", isAuthorized, async (req, res) => {
  const { code, language, allTestCases, problemId } = req.body;
  const userId = req.user?.id;

  // Check rate limit
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      message: "Too many submissions. Please wait before trying again.",
    });
  }
  
  // Check due date if this is a submission (allTestCases true)
  if (allTestCases && problemId) {
    try {
      const problemData = await problem.findById(problemId);
      if (problemData && problemData.dueDate) {
        const now = new Date();
        const dueDate = new Date(problemData.dueDate);
        
        if (now > dueDate) {
          return res.status(403).json({
            success: false,
            message: "Submission deadline has passed. You can no longer submit solutions for this problem.",
          });
        }
      }
    } catch (err) {
      console.error("Error checking problem due date:", err);
      // Continue execution even if there's an error checking the due date
    }
  }

  // Increment queue counter
  queueStatus.pending++;
  requestCounter = (requestCounter + 1) % Number.MAX_SAFE_INTEGER;

  try {
    console.log(req.body);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    if (!code || !language || !problemId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid input. Missing required fields.",
      });
    }

    const languageId = getLanguageId(language);
    if (!languageId) {
      return res.status(400).json({
        success: false,
        message: "Unsupported programming language.",
      });
    }

    const problemData = await problem.findById(problemId).select("testCases");

    if (
      !problemData ||
      !problemData.testCases ||
      problemData.testCases.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "No test cases found for the given problem ID.",
      });
    }

    let selectedTestCases;

    if (!allTestCases) {
      selectedTestCases = problemData.testCases.filter(
        (testCase) => !testCase.is_hidden
      );
    } else {
      selectedTestCases = problemData.testCases; // Run all test cases during submission
    }

    if (selectedTestCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No visible test cases available for execution.",
      });
    }

    // Ensure source code is properly encoded before submission
    const submissions = selectedTestCases.map((testCase) => ({
      source_code: encodeToBase64(code), // Encode source code to base64
      language_id: languageId,
      stdin: encodeToBase64(testCase.inputs || ""), // Encode stdin to base64
      expected_output: encodeToBase64(testCase.outputs || ""), // Encode expected output to base64
      cpu_time_limit: testCase.cpu_time_limit || 2, // Default to 2 seconds if not provided
      memory_limit: testCase.memory_limit * 1024 || 128 * 1024, // Default to 128 MB if not provided
    }));

    // Add request tracking
    console.log(`Processing request #${requestCounter} for user ${userId}`);
    queueStatus.pending--;
    queueStatus.processing++;

    // Update headers in API calls to use RapidAPI
    const submitToJudge0 = async (submission, retryCount = 3) => {
      for (let i = 0; i < retryCount; i++) {
        try {
          const response = await axios.post(
            `${JUDGE0_BASE_URL}/submissions?base64_encoded=true&wait=false&fields=*`,
            submission,
            {
              headers: {
                "Content-Type": "application/json",
                "x-rapidapi-host": JUDGE0_API_HOST,
                "x-rapidapi-key": JUDGE0_API_KEY,
                "X-Request-ID": `${userId}-${requestCounter}-${i}`,
              },
              timeout: 10000, // 10 second timeout
            }
          );

          logServerInstance(response, "Submission");
          return response;
        } catch (error) {
          console.error(`Submission attempt ${i + 1} failed:`, error.message);
          if (i === retryCount - 1) throw error;
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
      }
    };

    // Modify your results fetching to include better error handling
    const fetchResults = async (token) => {
      let result = null;
      let retries = 0;
      const maxRetries = 5;
      const maxWaitTime = 30000; // 30 seconds maximum wait time
      const startTime = Date.now();

      while (!result || result.status.id <= 2) {
        if (Date.now() - startTime > maxWaitTime) {
          throw new Error("Execution time exceeded maximum wait time");
        }

        try {
          const response = await axios.get(
            `${JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=true&fields=*`,
            {
              headers: {
                "x-rapidapi-host": JUDGE0_API_HOST,
                "x-rapidapi-key": JUDGE0_API_KEY,
                "X-Request-ID": `${userId}-${requestCounter}-result-${retries}`,
              },
            }
          );

          result = response.data;
          logServerInstance(response, "Status Check");

          if (result.status.id <= 2 && retries < maxRetries) {
            retries++;
            await new Promise((resolve) => setTimeout(resolve, 1000 * retries)); // Exponential backoff
            continue;
          }

          break;
        } catch (error) {
          console.error(`Result fetch attempt ${retries + 1} failed:`, error.message);
          if (retries >= maxRetries) throw error;
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
        }
      }

      return {
        ...result,
        compilationError: result.compile_output
          ? decodeBase64(result.compile_output)
          : null,
        standardError: result.stderr ? decodeBase64(result.stderr) : null,
        error: result.status.id === 5 ? "Time Limit Exceeded" : null,
      };
    };

    // Send code to Judge0 API
    const submissionResponses = await Promise.all(
      submissions.map((submission) => submitToJudge0(submission))
    );

    const tokens = submissionResponses.map((response) => response.data.token);

    // Fetch execution results
    const results = await Promise.all(tokens.map(fetchResults));

    // Process test results
    const testResults = results.map((result, index) => {
      const decodedOutput = decodeBase64(result.stdout?.trim() || "");
      const normalizedOutput = normalizeOutput(decodedOutput);
      const expectedOutput = normalizeOutput(
        selectedTestCases[index]?.outputs || ""
      );

      return {
        input: selectedTestCases[index]?.inputs || "",
        expectedOutput: selectedTestCases[index]?.outputs || "",
        output: decodedOutput,
        error: result.error || result.compilationError || result.standardError,
        passed: normalizedOutput === expectedOutput && !result.error,
        time: result.time,
        memory: result.memory,
      };
    });

    console.log("Test Results:", testResults);

    // Compute performance metrics
    const overallTime =
      testResults.reduce((sum, test) => sum + parseFloat(test.time || 0), 0) *
      1000; // Convert to ms
    const averageMemory =
      testResults.length > 0
        ? testResults.reduce(
            (sum, test) => sum + parseInt(test.memory || 0),
            0
          ) / testResults.length
        : 0;

    const numberOfTestCase = testResults.length;
    const numberOfTestCasePass = testResults.filter((test) => test.passed)
      .length;

    // Calculate marks for each test case
    const testCaseResults = testResults.map((test, index) => ({
      input: test.input,
      expectedOutput: test.expectedOutput,
      output: test.output,
      error: test.error,
      passed: test.passed,
      time: test.time,
      memory: test.memory,
      is_hidden: selectedTestCases[index]?.is_hidden || false,
      marks:
        test.passed && selectedTestCases[index]?.marks
          ? selectedTestCases[index].marks
          : 0,
    }));

    const totalMarks = testCaseResults.reduce(
      (sum, test) => sum + test.marks,
      0
    );
    const submissionStatus =
      numberOfTestCase === numberOfTestCasePass ? "completed" : "rejected";

    console.log("Submission Metrics:");
    console.log("Total Test Cases:", numberOfTestCase);
    console.log("Passed Test Cases:", numberOfTestCasePass);
    console.log("Total Marks Obtained:", totalMarks);
    console.log("Submission Status:", submissionStatus);    // Save the submission only if all test cases were run
    let savedSubmission = null;
    if (allTestCases) {
      try {
        // Find the problem to check if it exists and get assigned batches
        const problemData = await problem.findById(problemId);
        if (!problemData) {
          throw new Error("Problem not found");
        }
        
        // Find the batch this student belongs to that's assigned to this problem
        const Batch = await import("../models/batch.js").then(m => m.default);
        const batches = await Batch.find({
          students: userId,
          _id: { $in: problemData.assignedBatches }
        });
        
        const submissionPayload = {
          user_id: userId,
          problem_id: problemId,
          batch_id: batches.length > 0 ? batches[0]._id : null, // Use first matching batch if found
          code,
          language,
          status: submissionStatus,
          execution_time: overallTime.toFixed(2),
          memory_usage: (averageMemory / 1024).toFixed(2), // Convert to MB
          numberOfTestCase,
          numberOfTestCasePass,
          totalMarks,
          testCaseResults, // Store full test cases data in DB
        };

        const submissionResponse = await submission.create(submissionPayload);
        savedSubmission = submissionResponse;
      } catch (error) {
        console.error("Error creating submission with batch_id:", error);
        // Create submission without batch_id as fallback
        const submissionPayload = {
          user_id: userId,
          problem_id: problemId,
          code,
          language,
          status: submissionStatus,
          execution_time: overallTime.toFixed(2),
          memory_usage: (averageMemory / 1024).toFixed(2), // Convert to MB
          numberOfTestCase,
          numberOfTestCasePass,
          totalMarks,
          testCaseResults, // Store full test cases data in DB
        };

        const submissionResponse = await submission.create(submissionPayload);
        savedSubmission = submissionResponse;
      }
    }

    // Mask test case details except for the first one in the response
    res.json({
      success: true,
      testResults: testResults.map((test, index) => ({
        input: selectedTestCases[index].is_hidden ? "******" : test.input,
        expectedOutput: selectedTestCases[index].is_hidden
          ? "******"
          : test.expectedOutput,
        output: selectedTestCases[index].is_hidden ? "******" : test.output,
        error: test.error,
        passed: test.passed,
        time: test.time,
        memory: test.memory,
        marks: test.marks,
      })),
      overallTime: overallTime.toFixed(2),
      averageMemory: (averageMemory / 1024).toFixed(2), // Convert to MB
      allPassed: testResults.every((test) => test.passed),
      savedSubmission: savedSubmission
        ? {
            ...savedSubmission._doc,
            testCaseResults: savedSubmission.testCaseResults.map(
              (test, index) => ({
                input: test.is_hidden ? "******" : test.input,
                expectedOutput: test.is_hidden ? "******" : test.expectedOutput,
                output: test.is_hidden ? "******" : test.output,
                error: test.error,
                passed: test.passed,
                time: test.time,
                memory: test.memory,
                marks: test.marks,
              })
            ),
          }
        : null,
      queueStatus,
    });

    // Update queue status after processing
    queueStatus.processing--;
  } catch (error) {
    // Update queue status on error
    queueStatus.processing--;

    console.error("Error during execution:", error);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "An error occurred while processing the code.",
      error: error.message || error,
      queueStatus,
    });
  }
});

/**
 * GET /compiler/queue-status
 * Get current queue status and active user count
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Available for monitoring compilation queue status
 * - Can be used for displaying system load to users
 * 
 * RESPONSE:
 * - queueStatus: Object with pending and processing counts
 * - activeUsers: Number of users currently using the system
 */
router.get("/queue-status", isAuthorized, (req, res) => {
  res.json({
    success: true,
    queueStatus,
    activeUsers: userSubmissionCounts.size,
  });
});

export default router;
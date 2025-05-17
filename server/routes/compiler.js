import express from "express";
import axios from "axios";
import problem from "../models/problem.js";
import submission from "../models/submission.js";
import { isAuthorized } from "../middlewares/auth.js";
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

const router = express.Router();

// CONFIGURATION SECTION
const JUDGE0_BASE_URL = "http://localhost:2358"; // Your Judge0 instance URL
const JUDGE0_TOKEN = "CHAUHANRUTVIK22IT015"; // Your token
const MAX_CONCURRENT_SUBMISSIONS = 5; // Increased from 5 to 10
const MAX_BATCH_SIZE = 4; // Optimal batch size for concurrent processing
const POLLING_INTERVAL = 300; // ms between result polling attempts
const POLLING_TIMEOUT = 15000; // Maximum time to wait for results (15 seconds)

// PERFORMANCE OPTIMIZATIONS
// 1. Use connection pooling for HTTP requests
const judge0Api = axios.create({
  baseURL: JUDGE0_BASE_URL,
  timeout: 5000, // Reduced timeout for faster failure detection
  headers: {
    Authorization: `Bearer ${JUDGE0_TOKEN}`,
    "Content-Type": "application/json"
  },
  // Enable HTTP keepAlive for connection reuse
  httpAgent: new HttpAgent({ keepAlive: true }),
  httpsAgent: new HttpsAgent({ keepAlive: true }),
  maxContentLength: 1024 * 1024 * 10 // 10 MB
});

// Statistics tracking
const stats = {
  totalRequests: 0,
  activeRequests: 0,
  completedRequests: 0,
  failedRequests: 0,
  batchesSubmitted: 0,
  totalTestCasesProcessed: 0,
  successfulTestCases: 0,
  failedTestCases: 0,
  avgResponseTime: 0,
  // Add performance metrics
  responseTimeHistory: [],
  peakConcurrentRequests: 0
};

// Language mapping
const getLanguageId = (language) => {
  const languageMap = {
    python: 71,
    cpp: 54,
    java: 62,
    javascript: 63,
  };
  return languageMap[language] || null;
};

// Helper functions
const decodeBase64 = (base64Str) => {
  if (!base64Str) return "";
  try {
    const buffer = Buffer.from(base64Str, "base64");
    return buffer.toString("utf-8");
  } catch (error) {
    console.error("Base64 decode error:", error);
    return "";
  }
};

const normalizeOutput = (output) => {
  if (!output || typeof output !== "string") {
    return "";
  }
  return output.replace(/\s+/g, " ").trim();
};

// OPTIMIZATION: Improved response interceptor with smarter retry logic
judge0Api.interceptors.response.use(
  response => response,
  async error => {
    if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
      const config = error.config;
      
      // Limit retry attempts
      if (!config || config._retryCount >= 2) {
        return Promise.reject(error);
      }
      
      config._retryCount = config._retryCount || 0;
      config._retryCount += 1;
      
      // Exponential backoff with jitter for better distribution
      const retryDelay = Math.min(
        1000 * (1.5 ** config._retryCount), 
        3000
      ) + Math.floor(Math.random() * 300);
      
      console.log(`Retrying request after ${retryDelay}ms (attempt ${config._retryCount})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      return judge0Api(config);
    }
    return Promise.reject(error);
  }
);

// OPTIMIZATION: Improved parallel submission queue with better scheduling
class ParallelSubmissionQueue {
  constructor(maxConcurrent = 10) {
    this.queue = [];
    this.processing = 0;
    this.maxConcurrent = maxConcurrent;
    this.completedTasks = 0;
    this.failedTasks = 0;
    this.totalProcessed = 0;
    this.taskTimeouts = new Map(); // Track timeouts for each task
  }

  getStats() {
    return {
      queueSize: this.queue.length,
      activeProcessing: this.processing,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      totalProcessed: this.totalProcessed,
      maxConcurrent: this.maxConcurrent
    };
  }

  add(task, priority = 0, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const taskId = Date.now() + Math.random().toString(36).substring(2, 9);
      
      const queueItem = {
        id: taskId,
        task,
        priority,
        addedAt: Date.now(),
        resolve,
        reject
      };
      
      // Add task to queue based on priority
      if (priority > 0) {
        const index = this.queue.findIndex(item => item.priority < priority);
        if (index !== -1) {
          this.queue.splice(index, 0, queueItem);
        } else {
          this.queue.push(queueItem);
        }
      } else {
        this.queue.push(queueItem);
      }
      
      // Set task timeout
      const timeoutId = setTimeout(() => {
        // Remove from queue if still waiting
        const queueIndex = this.queue.findIndex(item => item.id === taskId);
        if (queueIndex !== -1) {
          this.queue.splice(queueIndex, 1);
          reject(new Error(`Task timed out in queue after ${timeout}ms`));
        }
        // If already processing, it will be handled by the task's own timeout
      }, timeout);
      
      this.taskTimeouts.set(taskId, timeoutId);
      
      // Update stats
      stats.peakConcurrentRequests = Math.max(
        stats.peakConcurrentRequests, 
        this.processing + this.queue.length
      );
      
      console.log(`Queue stats: ${this.queue.length} waiting, ${this.processing} processing, ${this.completedTasks} completed, ${this.failedTasks} failed`);
      
      // Process next items from queue
      this.processNext();
    });
  }

  async processNext() {
    // If we're already at max capacity or queue is empty, do nothing
    if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    // Process multiple items in parallel up to max concurrent limit
    const available = Math.min(
      this.maxConcurrent - this.processing,
      this.queue.length
    );
    
    for (let i = 0; i < available; i++) {
      this.processSingleTask();
    }
  }
  
  async processSingleTask() {
    // Get the next task and remove it from the queue
    const { id, task, resolve, reject, addedAt } = this.queue.shift();
    this.processing++;
    
    // Clear the timeout
    if (this.taskTimeouts.has(id)) {
      clearTimeout(this.taskTimeouts.get(id));
      this.taskTimeouts.delete(id);
    }
    
    // Calculate queue waiting time
    const queueTime = Date.now() - addedAt;
    
    // Log processing status
    console.log(`Starting task ${id}. Queue wait: ${queueTime}ms. Active tasks: ${this.processing}/${this.maxConcurrent}, Queue size: ${this.queue.length}`);

    try {
      const result = await task();
      this.completedTasks++;
      this.totalProcessed++;
      resolve(result);
    } catch (error) {
      this.failedTasks++;
      this.totalProcessed++;
      reject(error);
    } finally {
      this.processing--;
      
      // Log completion
      console.log(`Task ${id} completed. Active tasks: ${this.processing}/${this.maxConcurrent}, Queue size: ${this.queue.length}`);
      
      // Try to process more items from the queue
      this.processNext();
    }
  }
}

// Create the queue with increased concurrent tasks
const submissionQueue = new ParallelSubmissionQueue(MAX_CONCURRENT_SUBMISSIONS);

// OPTIMIZATION: Add route to get current stats with performance metrics
router.get("/stats", (req, res) => {
  const queueStats = submissionQueue.getStats();
  
  // Calculate average response time from history
  const avgTime = stats.responseTimeHistory.length > 0 
    ? stats.responseTimeHistory.reduce((sum, time) => sum + time, 0) / stats.responseTimeHistory.length 
    : 0;
  
  res.json({
    success: true,
    stats: {
      ...stats,
      avgResponseTime: avgTime.toFixed(2) + "ms",
      queue: queueStats,
      lastResponseTimes: stats.responseTimeHistory.slice(-10)
    }
  });
});

// OPTIMIZATION: Improved batch submission with concurrent processing
const batchSubmissions = async (submissions) => {
  if (submissions.length === 0) return [];
  
  // Optimize batch size for network efficiency
  const batchSize = Math.min(MAX_BATCH_SIZE, submissions.length);
  const results = [];
  
  // Track submissions for metrics
  stats.batchesSubmitted++;
  
  // Process in parallel batches for better throughput
  const batches = [];
  for (let i = 0; i < submissions.length; i += batchSize) {
    batches.push(submissions.slice(i, i + batchSize));
  }
  
  console.log(`Processing ${submissions.length} test cases in ${batches.length} batches of up to ${batchSize}`);
  
  // Process batches concurrently with Promise.all
  const batchPromises = batches.map(async (batch, batchIndex) => {
    console.log(`Submitting batch ${batchIndex + 1}/${batches.length}, size: ${batch.length}`);
    
    try {
      // Submit all test cases in the batch concurrently
      const responses = await Promise.all(
        batch.map(submission => judge0Api.post('/submissions', submission))
      );
      
      // Extract tokens
      return responses.map(response => response.data.token);
    } catch (error) {
      console.error(`Batch ${batchIndex + 1} submission error:`, error.message);
      // Return empty array for failed batch
      return [];
    }
  });
  
  // Wait for all batches to complete
  const batchResults = await Promise.all(batchPromises);
  
  // Flatten results
  return batchResults.flat();
};

// OPTIMIZATION: Improved result fetching with batch polling
const fetchResults = async (tokens) => {
  if (!tokens || tokens.length === 0) return [];
  
  console.log(`Fetching results for ${tokens.length} tokens`);
  
  // Use token batching for efficient polling
  const batchSize = 10; // Max tokens to fetch at once
  const results = new Map();
  const tokensToFetch = [...tokens];
  let startTime = Date.now();
  
  // Initialize results map with placeholders
  tokens.forEach(token => {
    results.set(token, null);
  });
  
  // Poll until all results are ready or timeout
  while (tokensToFetch.length > 0 && Date.now() - startTime < POLLING_TIMEOUT) {
    // Get next batch of tokens to poll
    const currentBatch = tokensToFetch.splice(0, batchSize);
    
    try {
      // OPTIMIZATION: Use batch endpoint for faster result fetching
      const response = await judge0Api.get(
        `/submissions/batch?tokens=${currentBatch.join(",")}&base64_encoded=true&fields=token,status,stdout,stderr,compile_output,time,memory`
      );
      
      // Process each result
      if (response.data && response.data.submissions) {
        for (const result of response.data.submissions) {
          // If result is complete, store it
          if (result.status.id > 2) {
            results.set(result.token, {
              ...result,
              compilationError: result.compile_output
                ? decodeBase64(result.compile_output)
                : null,
              standardError: result.stderr ? decodeBase64(result.stderr) : null,
              error: result.status.id === 5 ? "Time Limit Exceeded" : null,
            });
          } else {
            // If still processing, add back to queue
            tokensToFetch.push(result.token);
          }
        }
      }
    } catch (error) {
      console.error("Batch result polling error:", error.message);
      // Return tokens to the queue on error
      tokensToFetch.push(...currentBatch);
    }
    
    // If we still have tokens to check, wait before next poll
    if (tokensToFetch.length > 0) {
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
  }
  
  // Handle any remaining tokens that timed out
  const timedOutTokens = tokensToFetch.length;
  if (timedOutTokens > 0) {
    console.warn(`${timedOutTokens} submissions timed out waiting for results`);
    
    // Add error results for timed out tokens
    tokensToFetch.forEach(token => {
      results.set(token, {
        token,
        error: "Timed out waiting for execution results",
        status: { id: 7, description: "Timed Out" },
      });
    });
  }
  
  // Convert results map to array in original token order
  return tokens.map(token => results.get(token));
};

// OPTIMIZATION: Main route with improved performance
router.post("/run-code", async (req, res) => {
  const { code, language, allTestCases, problemId } = req.body;
  console.log("Received submission request:", { language, problemId });
  
  // Start timer for this request
  const requestStartTime = Date.now();
  
  // Update request stats
  stats.totalRequests++;
  stats.activeRequests++;
  
  // Validate input
  if (!code || !language || !problemId) {
    stats.activeRequests--;
    stats.failedRequests++;
    return res.status(400).json({
      success: false,
      message: "Invalid input. Missing required fields.",
    });
  }

  const languageId = getLanguageId(language);
  if (!languageId) {
    stats.activeRequests--;
    stats.failedRequests++;
    return res.status(400).json({
      success: false,
      message: "Unsupported programming language.",
    });
  }

  // Add this submission to our parallel queue with priority based on test case volume
  // Higher priority (1) for smaller test case sets to process quick jobs first
  submissionQueue.add(async () => {
    try {
      // OPTIMIZATION: Use lean() for faster mongoose queries
      const problemData = await problem.findById(problemId)
        .select("testCases")
        .lean();

      if (
        !problemData ||
        !problemData.testCases ||
        problemData.testCases.length === 0
      ) {
        stats.activeRequests--;
        stats.failedRequests++;
        return res.status(404).json({
          success: false,
          message: "No test cases found for the given problem ID.",
        });
      }

      // Select test cases based on request
      let selectedTestCases;
      if (!allTestCases) {
        selectedTestCases = problemData.testCases.filter(
          (testCase) => !testCase.is_hidden
        );
      } else {
        selectedTestCases = problemData.testCases;
      }

      if (selectedTestCases.length === 0) {
        stats.activeRequests--;
        stats.failedRequests++;
        return res.status(400).json({
          success: false,
          message: "No visible test cases available for execution.",
        });
      }

      // OPTIMIZATION: Better memory limit handling
      // Prepare submissions with optimized resource limits
      const submissions = selectedTestCases.map((testCase) => ({
        source_code: code,
        language_id: languageId,
        stdin: testCase.inputs || "",
        expected_output: testCase.outputs || "",
        cpu_time_limit: testCase.cpu_time_limit || 2,
        memory_limit: testCase.memory_limit * 1024 || 128 * 1024,
        // Add wall time limit for better timeout handling
        wall_time_limit: (testCase.cpu_time_limit || 2) * 3,
        // Add compiler options for optimized compilation
        compiler_options: language === 'cpp' ? '-O2' : '',
      }));

      // OPTIMIZATION: Use batch submission and concurrent result fetching
      console.log(`Sending ${submissions.length} test cases to Judge0`);
      const submissionStartTime = Date.now();
      const tokens = await batchSubmissions(submissions);
      const submissionEndTime = Date.now();
      
      console.log(`Submissions sent in ${submissionEndTime - submissionStartTime}ms`);
      
      if (tokens.length === 0) {
        stats.activeRequests--;
        stats.failedRequests++;
        return res.status(500).json({
          success: false,
          message: "Failed to submit code to the judge service.",
        });
      }

      console.log(`Received ${tokens.length} tokens from Judge0`);

      // OPTIMIZATION: Improved result fetching with batch polling
      const fetchStartTime = Date.now();
      const results = await fetchResults(tokens);
      const fetchEndTime = Date.now();
      
      console.log(`Results fetched in ${fetchEndTime - fetchStartTime}ms`);

      // Process test results
      const testResults = results.map((result, index) => {
        if (result) {
          const decodedOutput = result.stdout 
            ? decodeBase64(result.stdout)
            : "";
          
          const normalizedOutput = normalizeOutput(decodedOutput);
          const expectedOutput = normalizeOutput(
            selectedTestCases[index]?.outputs || ""
          );
          
          const passed = normalizedOutput === expectedOutput && !result.error;
          
          // Update test case stats
          stats.totalTestCasesProcessed++;
          if (passed) {
            stats.successfulTestCases++;
          } else {
            stats.failedTestCases++;
          }
          
          return {
            input: selectedTestCases[index]?.inputs || "",
            expectedOutput: selectedTestCases[index]?.outputs || "",
            output: decodedOutput,
            error: result.error || 
                  result.compilationError || 
                  result.standardError,
            passed,
            time: result.time || 0,
            memory: result.memory || 0,
          };
        } else {
          stats.totalTestCasesProcessed++;
          stats.failedTestCases++;
          
          return {
            input: selectedTestCases[index]?.inputs || "",
            expectedOutput: selectedTestCases[index]?.outputs || "",
            output: null,
            error: "Failed to get execution results",
            passed: false,
            time: 0,
            memory: 0,
          };
        }
      });

      // Calculate metrics
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
      const numberOfTestCasePass = testResults.filter((test) => test.passed).length;

      // OPTIMIZATION: Create test case results map with pre-allocated memory
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

      // Save the submission only if all test cases were run
      let savedSubmission = null;
      if (allTestCases) {
        const submissionPayload = {
          problem_id: problemId,
          code,
          language,
          status: submissionStatus,
          execution_time: overallTime.toFixed(2),
          memory_usage: (averageMemory / 1024).toFixed(2), // Convert to MB
          numberOfTestCase,
          numberOfTestCasePass,
          totalMarks,
          testCaseResults,
        };

        try {
          // OPTIMIZATION: Use lean() for faster writes
          const submissionResponse = await submission.create(submissionPayload);
          savedSubmission = submissionResponse;
        } catch (dbError) {
          console.error("Error saving submission to database:", dbError);
          // Continue even if DB save fails
        }
      }

      // Update request stats before sending response
      stats.activeRequests--;
      stats.completedRequests++;
      
      // Calculate and log request duration
      const requestDuration = Date.now() - requestStartTime;
      
      // Update response time history (keep last 100 entries)
      stats.responseTimeHistory.push(requestDuration);
      if (stats.responseTimeHistory.length > 100) {
        stats.responseTimeHistory.shift();
      }
      
      console.log(`Request completed in ${requestDuration}ms. Stats: Active: ${stats.activeRequests}, Completed: ${stats.completedRequests}, Total: ${stats.totalRequests}`);

      // OPTIMIZATION: More efficient response formatting
      // Return response data with appropriate masking
      return res.json({
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
        processedIn: requestDuration,
      });
    } catch (error) {
      // Update error stats
      stats.activeRequests--;
      stats.failedRequests++;
      
      console.error("Error during execution:", error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || "An error occurred while processing the code.",
      });
    }
  }, allTestCases ? 0 : 1, 30000) // Higher priority for non-allTestCases submissions
  .catch(error => {
    // Update error stats
    stats.activeRequests--;
    stats.failedRequests++;
    
    console.error("Queue processing error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "An error occurred during queue processing.",
    });
  });
});

export default router;
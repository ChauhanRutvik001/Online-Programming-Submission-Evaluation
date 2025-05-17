import Submission from "../models/submission.js";
import user from "../models/user.js";

// Route to get submissions for a specific user and problem
export const getUserSubmissions = async (req, res) => {
  const { problem_id } = req.query;
  if (!problem_id) {
    return res.status(400).json({ message: "Problem ID is required." });
  }

  const user_id = req.user?.id;
  if (!user_id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  console.log(
    "Fetching submissions for user:",
    user_id,
    "and problem:",
    problem_id
  );

  try {
    const submissions = await Submission.find({ user_id, problem_id })
      .populate("user_id", "name")
      .populate("problem_id", "title");

    if (!submissions.length) {
      return res.status(404).json({
        message: "No submissions found for the given user and problem.",
      });
    }

    const filteredSubmissions = submissions.map((submission) => ({
      _id: submission._id,
      status: submission.status,
      language: submission.language,
      memory_usage: submission.memory_usage,
      execution_time: submission.execution_time,
      createdAt: submission.createdAt,
    }));

    res.status(200).json({
      message: "Submissions fetched successfully.",
      data: filteredSubmissions,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
};

// Route to get all submissions
export const getAllSubmissionsForProblem = async (req, res) => {
  const { problem_id } = req.query;
  console.log("Route to get all submissions for specific problem by admin");

  try {
    // Fetch all submissions for the given problem_id
    const submissions = await Submission.find(
      { problem_id },
      {
        language: 1,
        status: 1,
        numberOfTestCase: 1,
        numberOfTestCasePass: 1,
        _id: 1,
        createdAt: 1,
        totalMarks: 1,
      }
    ).populate({
      path: "user_id",
      select: "id username batch branch semester _id role",
      match: { role: "student" }, // Only include users with role 'student'
    });

    // Filter out submissions where user_id is null (non-students)
    const filteredSubmissions = submissions.filter(
      (submission) => submission.user_id
    );

    if (filteredSubmissions.length === 0) {
      return res
        .status(404)
        .json({ message: "No submissions found for the given problem ID." });
    }

    // Create a map to store the highest marks submission for each student
    const highestMarksSubmissions = {};

    // Loop through filtered submissions and select the highest marks submission for each user
    filteredSubmissions.forEach((submission) => {
      const userId = submission.user_id._id.toString(); // Convert user_id to string to use as key in map
      if (
        !highestMarksSubmissions[userId] ||
        submission.totalMarks > highestMarksSubmissions[userId].totalMarks
      ) {
        highestMarksSubmissions[userId] = submission;
      }
    });

    // Get the values from the highestMarksSubmissions map (these are the highest marks submissions for each student)
    const highestMarksSubmissionsArray = Object.values(highestMarksSubmissions);

    res.status(200).json({
      message: "Submissions retrieved successfully",
      submissions: highestMarksSubmissionsArray,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Route to get all submissions for specific user
export const getAllSubmissionsForUser = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const user_id = req.user?.id;
  if (!user_id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  try {
    const submissions = await Submission.find({ user_id }) // Filter by user_id
      .populate("problem_id", "title") // Populate problem details: title
      .sort({ createdAt: -1 }) // Sort by creation time, descending
      .skip((page - 1) * limit) // Skip records for pagination
      .limit(parseInt(limit)) // Limit the number of records
      .select({
        language: 1,
        status: 1,
        numberOfTestCase: 1,
        numberOfTestCasePass: 1,
        _id: 1,
        createdAt: 1,
        totalMarks: 1,
      }); // Include only these fields in the final output

    const totalSubmissions = await Submission.countDocuments({ user_id }); // Count total submissions

    res.status(200).json({
      message: "Submissions retrieved successfully",
      submissions,
      totalSubmissions,
      totalPages: Math.ceil(totalSubmissions / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while fetching submissions." });
  }
};

export const getSubmissionById = async (req, res) => {
  const { id } = req.params;

  // Ensure req.user is properly populated
  if (!req.user) {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  const { isAdmin, id: userId } = req.user; // Extract role and user ID

  try {
    const submission = await Submission.findById(id)
      .populate("problem_id", "title")
      .populate("user_id", "role"); // Populate user role

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Role-based access control:

    // If user is a student, they can only view their own submissions
    if (
      isAdmin === "student" &&
      submission.user_id._id.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({
          message:
            "Unauthorized: Students can only view their own submissions.",
        });
    }

    // If user is a faculty, they can view student submissions but not admin submissions
    if (isAdmin === "faculty" && submission.user_id.role === "admin") {
      return res
        .status(403)
        .json({
          message: "Unauthorized: Faculty cannot view admin submissions.",
        });
    }

    // If user is a student, mask test case results except the first one
    // if (isAdmin === "student") {
    //   submission.testCaseResults = submission.testCaseResults.map(
    //     (testCase, index) =>
    //       index === 0
    //         ? testCase
    //         : {
    //             ...testCase,
    //             input: "****",
    //             output: "****",
    //             expectedOutput: "****",
    //           }
    //   );
    // }

    if (isAdmin === "student") {
      submission.testCaseResults = submission.testCaseResults.map((testCase) =>
        !testCase.is_hidden
          ? testCase
          : {
              ...testCase,
              input: "****",
              output: "****",
              expectedOutput: "****",
            }
      );
    }
    

    // Admin can see all submissions, so no restrictions here

    res.json(submission);
  } catch (err) {
    console.error("Error fetching submission:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Route to create a new submission
// export const createSubmission = async (req, res) => {
//   try {
//     // Destructure the body to extract relevant fields
//     const {
//       user_id,
//       problem_id,
//       code,
//       language,
//       status,
//       execution_time,
//       memory_usage,
//       testCaseResults,
//       numberOfTestCase,
//       numberOfTestCasePass,
//       totalMarks,
//     } = req.body;

//     console.log(req.body);
//     console.log("hello22");
//     // Validate testCaseResults
//     if (!testCaseResults || !Array.isArray(testCaseResults)) {
//       return res.status(400).json({
//         message: "Test case results are required and must be an array.",
//       });
//     }

//     console.log("hello1");
//     console.log(testCaseResults);

//     // Deep validation for testCaseResults array
//     if (
//       !testCaseResults.every(
//         (tc) =>
//           tc.input &&
//           tc.output &&
//           tc.expectedOutput !== undefined &&
//           typeof tc.passed === "boolean"
//       )
//     ) {
//       return res.status(400).json({
//         message:
//           "Each test case result must include inputs, outputs, expectedOutputs, and passed.",
//       });
//     }

//     console.log("hello2");

//     // Create a new submission
//     const submission = new Submission({
//       user_id,
//       problem_id,
//       code,
//       language,
//       status: status || STATUS.PENDING, // Default to PENDING if not provided
//       execution_time: execution_time || 0, // Default to 0
//       memory_usage: memory_usage || 0, // Default to 0
//       testCaseResults,
//       numberOfTestCase,
//       numberOfTestCasePass,
//       totalMarks,
//     });

//     // Save the submission to the database
//     console.log("Submission to Save:", submission);
//     await submission.save();

//     // Respond with success
//     res.status(201).json({
//       message: "Submission created successfully",
//       submission, // Return the full submission object
//     });
//   } catch (error) {
//     console.error("Error creating submission:", error);
//     res.status(400).json({
//       message:
//         error.message ||
//         "An unexpected error occurred during submission creation.",
//     });
//   }
// };

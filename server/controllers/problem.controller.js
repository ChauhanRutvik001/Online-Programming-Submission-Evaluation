import Problem from "../models/problem.js";
import Code from "../models/Code.js";
import Submission from "../models/submission.js";
import user from "../models/user.js";
import Batch from "../models/batch.js";
import mongoose from "mongoose";

// Get recent due problems for a student (top 5 soonest due, with batchId)
export const getRecentDueProblems = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find all batches the student is in
    const batches = await Batch.find({ students: studentId, isActive: true });

    // Collect all assigned problems and their batch context
    let problemsWithBatch = [];
    for (const batch of batches) {
      // Get all assigned problems for this batch
      const problems = await Problem.find({ _id: { $in: batch.assignedProblems } })
        .select("_id title difficulty createdAt batchDueDates");

      // For each problem, extract the due date for this batch
      problems.forEach(problem => {
        const entry = (problem.batchDueDates || []).find(
          (b) => b.batch?.toString() === batch._id.toString()
        );
        if (entry && entry.dueDate) {
          problemsWithBatch.push({
            _id: problem._id,
            title: problem.title,
            difficulty: problem.difficulty,
            createdAt: problem.createdAt,
            dueDate: entry.dueDate,
            batchId: batch._id, // include batchId for frontend navigation
          });
        }
      });
    }

    // Filter to only upcoming due dates
    const now = new Date();
    problemsWithBatch = problemsWithBatch
      .filter(p => p.dueDate && new Date(p.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5); // Top 5 soonest due

    return res.status(200).json({
      success: true,
      problems: problemsWithBatch,
    });
  } catch (error) {
    console.error("Error fetching recent due problems:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent due problems",
      error: error.message,
    });
  }
};

// Create a new problem
export const createProblem = async (req, res) => {
  const {
    title,
    description,
    difficulty,
    inputFormat,
    outputFormat,
    sampleIO,
    testCases = [],
    constraints,
    tags,
    totalMarks,
  } = req.body;

  console.log("req.body ---> ", req.body);

  if (!req.user) {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  console.log("req.user", req.user);
  const createdBy = req.user?.id;

  if (!Array.isArray(testCases)) {
    return res.status(400).json({ message: "Invalid testCases format" });
  }

  // Validate each test case
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];

    if (testCase.cpu_time_limit < 1 || testCase.cpu_time_limit > 15) {
      return res.status(400).json({
        message: `Test Case ${
          i + 1
        }: CPU time limit must be between 1 and 15 seconds.`,
      });
    }

    if (testCase.memory_limit < 1 || testCase.memory_limit > 256) {
      return res.status(400).json({
        message: `Test Case ${
          i + 1
        }: Memory limit must be between 1 and 256 MB.`,
      });
    }
  }

  try {
    const problem = new Problem({
      title,
      description,
      difficulty,
      inputFormat,
      outputFormat,
      sampleIO: sampleIO.map((sample) => ({
        input: sample.input,
        output: sample.output,
      })),
      testCases: testCases.map((testCase) => ({
        inputs: testCase.inputs,
        outputs: testCase.outputs,
        marks: testCase.marks ?? 0,
        cpu_time_limit: testCase.cpu_time_limit,
        memory_limit: testCase.memory_limit,
        is_hidden: testCase.is_hidden ?? false,
      })),
      constraints,
      tags,
      totalMarks,
      createdBy,
    });    const createdProblem = await problem.save();
    
    // If the problem is created successfully, we can send the notification
    // But at this point, it's not assigned to any batches yet
    
    res.status(201).json(createdProblem);
  } catch (error) {
    console.error("Error creating problem:", error);
    res.status(400).json({ message: error.message });
  }
};

// Backend code (Express.js route handler)
export const getProblems = async (req, res) => {
  try {
    let problems;
    const { isAdmin, id: userId } = req.user;

    if (isAdmin === "faculty" || isAdmin === "admin") {
      problems = await Problem.find({}).sort({ createdAt: -1 });
    } else if (isAdmin === "faculty") {
      problems = await Problem.find({ createdBy: userId }).sort({
        createdAt: -1,
      });    } else if (isAdmin === "student") {
      // Find batches this student belongs to
      const batches = await Batch.find({ students: userId });
      const batchIds = batches.map(batch => batch._id);
      
      // Find problems that are assigned to any of these batches
      problems = await Problem.find({ assignedBatches: { $in: batchIds } }).sort({
        createdAt: -1,
      });
    } else {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json({
      problems: problems.map(({ _id, title, difficulty, createdAt }) => ({
        _id,
        title,
        difficulty,
        createdAt,
      })),
      totalProblems: problems.length,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching problems:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const assignProblemToStudents = async (req, res) => {
  const { id } = req.params;
  const { studentIds } = req.body; // Array of student IDs

  try {
    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const userId = req.user.id;
    const userRole = req.user.isAdmin; // Assuming role is stored in req.user.role

    if (
      problem.createdBy.toString() !== userId.toString() &&
      userRole !== "admin"
    ) {
      return res.status(403).json({
        message: "Unauthorized to assignProblemToStudents this problem",
      });
    }

    problem.assignedStudents.push(...studentIds);
    await problem.save();

    res
      .status(200)
      .json({ message: "Students assigned successfully", problem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unassignStudents = async (req, res) => {
  const { id } = req.params; // Problem ID
  const { studentIds } = req.body; // Array of student IDs to unassign

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ message: "No student IDs provided." });
  }

  try {
    // Fetch the problem by ID
    const problem = await Problem.findById(id);

    if (!problem) {
      console.error(`Problem with ID ${id} not found.`);
      return res.status(404).json({ message: "Problem not found" });
    }

    const userId = req.user.id;
    const userRole = req.user.isAdmin; // Assuming role is stored in req.user.role

    if (
      problem.createdBy.toString() !== userId.toString() &&
      userRole !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to get Students this problem" });
    }

    // Filter out the students to be unassigned
    const updatedAssignedStudents = problem.assignedStudents.filter(
      (studentId) => !studentIds.includes(studentId.toString())
    );

    // Update the problem with the new list of assigned students
    problem.assignedStudents = updatedAssignedStudents;
    await problem.save();

    console.log(`Unassigned Students: ${studentIds}`);

    // Return success response
    res.status(200).json({
      message: "Students unassigned successfully",
    });
  } catch (error) {
    console.error(`Error unassigning students: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const getProblemWithStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch, semester, batch } = req.query;
    console.log(req.query);

    if (!id) {
      return res.status(400).json({ error: "Contest ID is required." });
    }

    const problem = await Problem.findById(id);

    if (!problem) {
      console.error(`Problem with ID ${id} not found.`);
      return res.status(404).json({ message: "Problem not found" });
    }

    const userId = req.user.id;
    const userRole = req.user.isAdmin; // Assuming role is stored in req.user.role

    if (
      problem.createdBy.toString() !== userId.toString() &&
      userRole !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to get Students this problem" });
    }

    const filter = {
      _id: { $in: problem.assignedStudents },
      role: "student", // Exclude assigned students
    };

    if (branch && branch !== "ALL") {
      filter.branch = branch;
    }
    if (semester && semester !== "ALL") {
      filter.semester = semester;
    }
    if (batch && batch !== "ALL") {
      filter.batch = batch;
    }

    const assignedStudents = await user
      .find(filter)
      .select("username semester batch branch _id id");

    res.status(200).json({
      message: "Problem and assigned students fetched successfully",
      assignedStudents: assignedStudents,
    });
  } catch (error) {
    console.error(`Error fetching problem and students: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const getProblemWithUnassignedStudents = async (req, res) => {
  try {
    const { id } = req.params; // Problem ID
    const { branch, semester, batch } = req.query;
    console.log(req.query);

    if (!id) {
      return res.status(400).json({ error: "Contest ID is required." });
    }

    // Fetch the problem by ID
    const problem = await Problem.findById(id);

    if (!problem) {
      console.error(`Problem with ID ${id} not found.`);
      return res.status(404).json({ message: "Problem not found" });
    }

    const filter = {
      _id: { $nin: problem.assignedStudents },
      role: "student", // Exclude assigned students
    };

    if (branch && branch !== "ALL") {
      filter.branch = branch;
    }
    if (semester && semester !== "ALL") {
      filter.semester = semester;
    }
    if (batch && batch !== "ALL") {
      filter.batch = batch;
    }

    const unassignedStudents = await user
      .find(filter)
      .select("username semester batch branch _id id");

    // Return the problem and unassigned student data
    res.status(200).json({
      message: "Problem and unassigned students fetched successfully",
      unassignedStudents: unassignedStudents,
    });
  } catch (error) {
    console.error(
      `Error fetching problem and unassigned students: ${error.message}`
    );
    res.status(500).json({ message: error.message });
  }
};

export const getStudents = async (req, res) => {
  try {
    // Fetching all students
    const students = await user
      .find({ role: "student" })
      .select("username semester batch branch id _id")
      .sort({ id: 1 });

    // Calculate total number of students
    const totalStudents = students.length;

    // Aggregate data for branch-wise count
    const branchWiseCount = await user.aggregate([
      { $match: { role: "student" } },
      { $group: { _id: "$branch", count: { $sum: 1 } } },
    ]);

    // Aggregate data for semester, branch, and batch-wise count
    const semesterBranchBatchWiseCount = await user.aggregate([
      { $match: { role: "student" } },
      {
        $group: {
          _id: { semester: "$semester", branch: "$branch", batch: "$batch" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.semester": 1, "_id.branch": 1, "_id.batch": 1 } }, // Sort by semester, branch, and batch
    ]);

    // Prepare a structured response to include semester, branch, and batch-wise breakdowns
    const semesterBranchBatchWiseCountResult = semesterBranchBatchWiseCount.reduce(
      (acc, { _id, count }) => {
        const { semester, branch, batch } = _id;
        if (!acc[semester]) {
          acc[semester] = {}; // Initialize object for each semester
        }
        if (!acc[semester][branch]) {
          acc[semester][branch] = {}; // Initialize object for each branch within the semester
        }
        if (!acc[semester][branch][batch]) {
          acc[semester][branch][batch] = 0; // Initialize count for each batch within the branch and semester
        }
        acc[semester][branch][batch] += count; // Aggregate the count for each batch in each branch and semester
        return acc;
      },
      {}
    );

    // Send the students data along with total and counts
    console.log(
      "semesterBranchBatchWiseCountResult",
      semesterBranchBatchWiseCountResult
    );
    console.log("branchWiseCount", branchWiseCount);
    console.log("students", totalStudents);
    res.status(200).json({
      totalStudents,
      branchWiseCount,
      semesterBranchBatchWiseCount: semesterBranchBatchWiseCountResult,
      students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      message: "Server error while fetching students",
      error: error.message,
    });
  }
};

// Get problem by ID
export const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("welcome");
    const problem = await Problem.findById(id).select(
      "-createdAt -updatedAt -testCases"
    );

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Ensure req.user is properly populated
    if (!req.user) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const { id: userId, isAdmin } = req.user;
    console.log("req.user", req.user);

    // Admins have unrestricted access
    if (isAdmin === "faculty" || isAdmin === "admin") {
      return res.json(problem);
    }

    // Faculty can access only the problems they created
    if (isAdmin === "faculty") {
      if (problem.createdBy.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({ message: "You are not allowed to access this problem" });
      }
      return res.json(problem);
    }    // Students can only access problems assigned to batches they belong to
    if (isAdmin === "student") {
      // Find the batches this student belongs to
      const batches = await Batch.find({ students: userId });
      const batchIds = batches.map(batch => batch._id.toString());
      
      // Check if any of these batches are assigned to the problem
      const isAssigned = problem.assignedBatches.some(
        batchId => batchIds.includes(batchId.toString())
      );
      
      if (!isAssigned) {
        return res
          .status(403)
          .json({ message: "You are not allowed to access this problem" });
      }
      
      return res.json(problem);
    }

    // Default deny for other roles
    return res
      .status(403)
      .json({ message: "You are not allowed to access this problem" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProblemByIdForUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findById(id).select(
      "-createdAt -updatedAt -assignedStudents"
    );

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Ensure req.user is properly populated
    if (!req.user) {
      return res.status(403).json({ message: "Unauthorized access2" });
    }

    return res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const userId = req.user.id;
    const userRole = req.user.isAdmin; // Assuming admin role is stored in req.user.isAdmin

    if (
      problem.createdBy.toString() !== userId.toString() &&
      userRole !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this problem" });
    }

    const { sampleIO, testCases, ...otherUpdates } = req.body;

    // Validate test cases
    if (Array.isArray(testCases)) {
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];

        if (testCase.cpu_time_limit < 1 || testCase.cpu_time_limit > 15) {
          return res.status(400).json({
            message: `Test Case ${
              i + 1
            }: CPU time limit must be between 1 and 15 seconds.`,
          });
        }

        if (testCase.memory_limit < 1 || testCase.memory_limit > 256) {
          return res.status(400).json({
            message: `Test Case ${
              i + 1
            }: Memory limit must be between 1 and 256 MB.`,
          });
        }
      }

      problem.testCases = testCases.map((testCase) => ({
        inputs: testCase.inputs,
        outputs: testCase.outputs,
        marks: testCase.marks || 0,
        cpu_time_limit: testCase.cpu_time_limit,
        memory_limit: testCase.memory_limit,
        is_hidden: testCase.is_hidden ?? false,
      }));
    } else if (testCases !== undefined) {
      return res.status(400).json({ message: "Invalid testCases format" });
    }

    if (sampleIO) {
      problem.sampleIO = sampleIO.map((sample) => ({
        input: sample.input,
        output: sample.output,
      }));
    }

    // Assign other updates directly to the problem object
    Object.assign(problem, otherUpdates);

    // Save the updated problem to the database
    const updatedProblem = await problem.save();

    res.json(updatedProblem);
  } catch (error) {
    console.error("Update Problem Error:", error);
    res.status(500).json({
      message: "Failed to update the problem. Please try again later.",
    });
  }
};

// Delete problem
export const deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const userId = req.user.id;
    const userRole = req.user.isAdmin; // Assuming role is stored in req.user.role

    if (
      problem.createdBy.toString() !== userId.toString() &&
      userRole !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this problem" });
    }

    // Delete the problem
    await Problem.deleteOne({ _id: req.params.id });

    // Delete all related codes
    await Code.deleteMany({ problemId: req.params.id });    // Delete all related submissions
    await Submission.deleteMany({ problem_id: req.params.id });

    res.json({ message: "Problem and all related data removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign problem to batches
export const assignProblemToBatches = async (req, res) => {
  const { id } = req.params; // Problem ID
  const { batchDueDates } = req.body; // Array of { batchId, dueDate }

  if (!Array.isArray(batchDueDates) || batchDueDates.length === 0) {
    return res.status(400).json({ message: "No batch due dates provided." });
  }

  try {
    // Find the problem
    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Check authorization - only faculty or admin can assign
    const userId = req.user.id;
    const userRole = req.user.isAdmin;
    console.log("userRole", userRole);
    if (userRole !== "admin" && userRole !== "faculty") {
      return res.status(403).json({ message: "Unauthorized to assign this problem to batches" });
    }

    // Extract batchIds for permission check
    const batchIds = batchDueDates.map(b => b.batchId);

    // Verify all batches exist and are accessible to this faculty
    const batches = await Batch.find({
      _id: { $in: batchIds },
      $or: [
        { faculty: userId },
        { createdBy: userId }
      ]
    });

    const foundBatchIds = batches.map(b => b._id.toString());
    const missingBatchIds = batchIds.filter(id => !foundBatchIds.includes(id));
    if (missingBatchIds.length > 0) {
      return res.status(400).json({
        message: "Some batches don't exist or you don't have permission to assign to them.",
        missingBatchIds
      }); 
    }

    // Add batches to assignedBatches if not already there, and update batchDueDates
    for (const { batchId, dueDate } of batchDueDates) {
      // Add to assignedBatches if not present
      if (!problem.assignedBatches.map(b => b.toString()).includes(batchId)) {
        problem.assignedBatches.push(batchId);
      }

      // Update or add due date for this batch
      const idx = problem.batchDueDates.findIndex(b => b.batch.toString() === batchId);
      if (idx > -1) {
        problem.batchDueDates[idx].dueDate = new Date(dueDate);
      } else {
        problem.batchDueDates.push({ batch: batchId, dueDate: new Date(dueDate) });
      }

      // Update the batch to include this problem in its assignedProblems array
      await Batch.findByIdAndUpdate(
        batchId,
        { $addToSet: { assignedProblems: id } },
        { new: true }
      );
    }

    await problem.save(); // Save the problem with the updated batch assignments and due dates

    // Send notifications to students in the batches
    try {
      const { notificationService } = await import("../app.js");
      if (notificationService) {
        for (const batch of batches) {
          // Find the due date for this batch
          const dueDateObj = problem.batchDueDates.find(b => b.batch.toString() === batch._id.toString());
          // Send notification to each student in the batch
          for (const studentId of batch.students) {
            await notificationService.createNotification(
              studentId.toString(),
              "New Problem Assigned",
              `A new problem "${problem.title}" has been assigned to your batch ${batch.name}.`,
              "problem",
              {
                problemId: problem._id.toString(),
                problemTitle: problem.title,
                batchId: batch._id.toString(),
                batchName: batch.name,
                dueDate: dueDateObj ? dueDateObj.dueDate : null
              }
            );
          }

          // Send notification to the faculty of the batch
          await notificationService.createNotification(
            batch.faculty.toString(),
            "Problem Assigned to Your Batch",
            `Problem "${problem.title}" has been assigned to your batch ${batch.name}.`,
            "problem",
            {
              problemId: problem._id.toString(),
              problemTitle: problem.title,
              batchId: batch._id.toString(),
              batchName: batch.name,
              dueDate: dueDateObj ? dueDateObj.dueDate : null
            }
          );
        }
      }
    } catch (notifError) {
      console.error("Failed to send problem assignment notifications:", notifError);
    }

    const totalStudentCount = batches.reduce((count, batch) => count + batch.students.length, 0);

    res.status(200).json({
      message: `Problem assigned to ${batches.length} batches with access for ${totalStudentCount} students.`,
      problem
    });
  } catch (error) {
    console.error("Error assigning problem to batches:", error);
    res.status(500).json({ message: error.message });
  }
};

// Unassign problem from batches
export const unassignBatches = async (req, res) => {
  const { id } = req.params; // Problem ID
  const { batchIds } = req.body; // Array of batch IDs to unassign

  if (!Array.isArray(batchIds) || batchIds.length === 0) {
    return res.status(400).json({ message: "No batch IDs provided." });
  }

  try {
    // Find the problem
    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Check authorization - only the creator or admin can unassign
    const userId = req.user.id;
    const userRole = req.user.isAdmin;

    if (problem.createdBy.toString() !== userId.toString() && userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized to unassign batches from this problem" });
    }    // Get all batches to be unassigned
    const batchesToUnassign = await Batch.find({ _id: { $in: batchIds } });
    
    // Remove the batches from assignedBatches
    problem.assignedBatches = problem.assignedBatches.filter(
      batchId => !batchIds.includes(batchId.toString())
    );
    
    // Remove this problem from assignedProblems in each batch
    for (const batchId of batchIds) {
      await Batch.findByIdAndUpdate(
        batchId,
        { $pull: { assignedProblems: id } }
      );
    }
    
    await problem.save();

    res.status(200).json({
      message: `${batchIds.length} batches unassigned from problem successfully`,
      problem
    });
  } catch (error) {
    console.error("Error unassigning batches from problem:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get problems by batch for students
export const getProblemsByBatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { batchId } = req.params;

    // Find the batch and verify the student is in it
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    if (!batch.students.includes(userId)) {
      return res.status(403).json({ message: "You are not a member of this batch" });
    }    // Find all problems assigned to this batch using the assignedProblems field in the batch
    const fullBatch = await Batch.findById(batchId).populate({
      path: 'assignedProblems',
      select: '_id title difficulty createdAt dueDate createdBy',
      populate: {
        path: 'createdBy',
        select: 'username firstName lastName'
      }
    });
    
    const problems = fullBatch.assignedProblems || [];

    res.json({
      problems,
      totalProblems: problems.length,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching batch problems:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all batches assigned to a problem
export const getProblemBatches = async (req, res) => {
  const { id } = req.params; // Problem ID
  
  try {
    const problem = await Problem.findById(id).populate({
      path: 'assignedBatches',
      select: 'name description students subject',
      populate: {
        path: 'students',
        select: 'username firstName lastName id email',
        model: 'User'
      }
    });
    
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }
    
    const userId = req.user.id;
    const userRole = req.user.isAdmin;
    
    if (problem.createdBy.toString() !== userId.toString() && userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized to view batches for this problem" });
    }
    
    res.status(200).json({
      batches: problem.assignedBatches,
      success: true
    });
    
  } catch (error) {
    console.error("Error fetching problem batches:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update just the due date of a problem
export const updateProblemDueDate = async (req, res) => {
  try {
    const problemId = req.params.id;
    const { dueDate } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Check if user has permission to update problem
    const userId = req.user.id;
    const userRole = req.user.isAdmin;

    if (problem.createdBy.toString() !== userId.toString() && userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized to edit this problem" });
    }

    // Update due date
    if (dueDate) {
      problem.dueDate = new Date(dueDate);
      const updatedProblem = await problem.save();
      return res.json(updatedProblem);
    } else {
      return res.status(400).json({ message: "Due date is required" });
    }
  } catch (error) {
    console.error("Error updating problem due date:", error);
    res.status(500).json({ message: "Failed to update the problem due date" });
  }
};

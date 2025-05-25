import User from '../models/user.js';
import bcrypt from 'bcrypt';
import Code from '../models/Code.js';
import Submission from '../models/submission.js';
import Batch from '../models/batch.js';
import Problem from '../models/problem.js';
import Contest from '../models/contest.js';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

const facultyController = {
    getStudents: async (req, res) => {
      const { facultyId, page = 1, limit = 10 } = req.body;
    
      if (!facultyId) {
        return res.status(400).json({ success: false, message: "Faculty ID is required." });
      }
    
      try {
        const skip = (page - 1) * limit; // Calculate the number of documents to skip
    
        const students = await User.find({ facultyId, role: "student", isApproved: true })
          .select("username batch branch semester id createdAt")
          .sort({ id : 1 }) 
          .skip(skip)
          .limit(limit);
    
        // Get total count of approved students for this faculty
        const totalStudents = await User.countDocuments({ facultyId, role: "student", isApproved: true });
    
        // Calculate total pages and return data
        const totalPages = Math.ceil(totalStudents / limit);
    
        res.status(200).json({
          success: true,
          message: "Students fetched successfully.",
          students,
          totalPages, // Include totalPages
          currentPage: page,
          totalStudents
        });
      } catch (error) {
        console.error("Error in fetching students by faculty ID:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
      }
    },

    expireSession: async (req, res) => {
      const { userId } = req.body;
    
      console.log("User ID received:", userId);
    
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required." });
      }
    
      try {
        // Find the user by ID and clear their sessionId
        const user = await User.findOneAndUpdate(
          { _id: userId },
          { sessionId: null },
          { new: true }
        );

        console.log("User found:", user);
    
        if (!user) {
          return res.status(404).json({ success: false, message: "User not found or already logged out." });
        }
    
        res.status(200).json({
          success: true,
          message: "Session expired successfully. User has been logged out.",
        });
      } catch (error) {
        console.error("Error expiring session:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
      }
    },
        removeUser: async (req, res) => {
      const { userId } = req.params;
    
      console.log("User ID received:", userId);
    
      if (!userId) {
        return res.status(400).json({ success: false, message: "Missing User ID." });
      }
    
      const session = await mongoose.startSession();
    
      try {
        await session.withTransaction(async () => {
          // Check if the user exists
          const user = await User.findById(userId).session(session);
          if (!user) {
            throw new Error("User not found.");
          }
    
          console.log("User found:", user);
          const userName = user.id;

          // Only allow removal of students by faculty
          if (user.role !== "student") {
            throw new Error("Faculty can only remove students.");
          }

          // 1. Remove profile picture from GridFS if exists
          if (user.profile?.avatar) {
            try {
              const bucket = new GridFSBucket(mongoose.connection.db, {
                bucketName: "uploads",
              });
              await bucket.delete(new mongoose.Types.ObjectId(user.profile.avatar));
            } catch (gridfsError) {
              console.warn(`Failed to delete profile picture for user ${userId}:`, gridfsError.message);
              // Continue with deletion even if profile picture deletion fails
            }
          }

          // 2. Remove student from all batches' students array
          await Batch.updateMany(
            { students: userId },
            { $pull: { students: userId } },
            { session }
          );

          // 3. Remove student from contests' assignedStudents array
          await Contest.updateMany(
            { assignedStudents: userId },
            { $pull: { assignedStudents: userId } },
            { session }
          );

          // 4. Remove student from problems' assignedStudents array
          await Problem.updateMany(
            { assignedStudents: userId },
            { $pull: { assignedStudents: userId } },
            { session }
          );

          // 5. Remove all submissions related to the user
          await Submission.deleteMany({ user_id: userId }, { session });

          // 6. Remove all codes related to the user
          await Code.deleteMany({ userId: userId }, { session });

          // 7. Finally, remove the user
          await User.deleteOne({ _id: userId }, { session });
        });

        return res.status(200).json({
          success: true,
          message: `Student and all related data have been successfully removed.`,
        });
      } catch (error) {
        console.error("Error in removing user:", error.message);
        return res.status(500).json({
          success: false,
          message: error.message || "Internal server error.",
        });      } finally {
        await session.endSession();
      }
    },
    
    // Batch related functions for faculty
    getMyBatches: async (req, res) => {
      try {
        const facultyId = req.user.id;
        const {
          page = 1,
          limit = 10,
          search = '',
          sortBy = 'createdAt',
          sortOrder = 'desc',
        } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        // Build query
        const query = { faculty: facultyId, isActive: true };
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } },
          ];
        }
        // Build sort
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        // Query batches
        const batches = await Batch.find(query)
          .populate('students', 'username id batch semester branch')
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit));
        const totalBatches = await Batch.countDocuments(query);
        const totalPages = Math.ceil(totalBatches / limit);
        return res.status(200).json({
          success: true,
          batches,
          totalBatches,
          totalPages,
          currentPage: parseInt(page),
        });
      } catch (error) {
        console.error("Error fetching faculty batches:", error);
        return res.status(500).json({
          success: false, 
          message: "An error occurred while fetching batches"
        });
      }
    },
      getBatchDetails: async (req, res) => {
      try {
        const { batchId } = req.params;
        const facultyId = req.user.id;
        
        // Find the batch and ensure it belongs to this faculty
        const batch = await Batch.findOne({ _id: batchId, faculty: facultyId })
          .populate('students', 'username id batch semester branch email')
          .populate('faculty', 'username email id')
          .populate({
            path: 'assignedProblems',
            select: 'title difficulty createdAt dueDate', 
            populate: {
              path: 'createdBy',
              select: 'username'
            }
          });
          
        if (!batch) {
          return res.status(404).json({
            success: false,
            message: "Batch not found or you don't have access to it"
          });
        }
          return res.status(200).json({
          success: true,
          batch
        });
      } catch (error) {
        console.error("Error fetching batch details:", error);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching batch details",
          error: error.message
        });
      }
    },

    // Get batch progress analytics for faculty
    getBatchProgress: async (req, res) => {
      try {
        const { batchId } = req.params;
        const facultyId = req.user.id;

        // First verify the faculty has access to this batch
        const batch = await Batch.findOne({
          _id: batchId,
          faculty: facultyId,
          isActive: true
        }).populate('students', 'username id email branch semester batch');

        if (!batch) {
          return res.status(404).json({
            success: false,
            message: "Batch not found or you don't have access to it"
          });
        }

        // Get all problems assigned to this batch
        const problems = await Problem.find({
          _id: { $in: batch.assignedProblems }
        }).select('_id title difficulty createdAt dueDate');

        // Get all student IDs in this batch
        const batchStudentIds = batch.students.map(student => student._id);

        // Get all submissions for batch students on batch problems
        const submissions = await Submission.find({
          user_id: { $in: batchStudentIds },
          problem_id: { $in: batch.assignedProblems }
        }).populate('user_id', 'username id').populate('problem_id', 'title difficulty');

        // Calculate progress statistics
        const progressStats = {
          totalStudents: batch.students.length,
          totalProblems: problems.length,
          submissionStats: {},
          problemStats: {},
          studentStats: {},
          overallProgress: {}
        };

        // Calculate per-problem statistics
        problems.forEach(problem => {
          const problemSubmissions = submissions.filter(sub => 
            sub.problem_id._id.toString() === problem._id.toString()
          );

          // Get highest marks per student for this problem
          const studentBestSubmissions = {};
          problemSubmissions.forEach(sub => {
            const studentId = sub.user_id._id.toString();
            if (!studentBestSubmissions[studentId] || 
                sub.totalMarks > studentBestSubmissions[studentId].totalMarks) {
              studentBestSubmissions[studentId] = sub;
            }
          });

          const bestSubmissions = Object.values(studentBestSubmissions);
          const studentsAttempted = bestSubmissions.length;
          const studentsCompleted = bestSubmissions.filter(sub => 
            sub.numberOfTestCasePass === sub.numberOfTestCase && sub.numberOfTestCase > 0
          ).length;
          const studentsPartial = bestSubmissions.filter(sub => 
            sub.numberOfTestCasePass > 0 && sub.numberOfTestCasePass < sub.numberOfTestCase
          ).length;

          progressStats.problemStats[problem._id] = {
            title: problem.title,
            difficulty: problem.difficulty,
            studentsAttempted,
            studentsCompleted,
            studentsPartial,
            completionRate: studentsAttempted > 0 ? (studentsCompleted / studentsAttempted * 100).toFixed(1) : 0,
            attemptRate: (studentsAttempted / progressStats.totalStudents * 100).toFixed(1),
            averageScore: bestSubmissions.length > 0 ? 
              (bestSubmissions.reduce((sum, sub) => {
                const score = sub.numberOfTestCase > 0 ? 
                  (sub.numberOfTestCasePass / sub.numberOfTestCase) * 100 : 0;
                return sum + score;
              }, 0) / bestSubmissions.length).toFixed(1) : 0
          };
        });

        // Calculate per-student statistics
        batch.students.forEach(student => {
          const studentSubmissions = submissions.filter(sub => 
            sub.user_id._id.toString() === student._id.toString()
          );

          // Get best submission per problem for this student
          const problemsAttempted = new Set();
          const problemsCompleted = new Set();
          let totalScore = 0;
          let problemsWithScores = 0;

          const studentBestByProblem = {};
          studentSubmissions.forEach(sub => {
            const problemId = sub.problem_id._id.toString();
            if (!studentBestByProblem[problemId] || 
                sub.totalMarks > studentBestByProblem[problemId].totalMarks) {
              studentBestByProblem[problemId] = sub;
            }
          });

          Object.values(studentBestByProblem).forEach(sub => {
            problemsAttempted.add(sub.problem_id._id.toString());
            if (sub.numberOfTestCasePass === sub.numberOfTestCase && sub.numberOfTestCase > 0) {
              problemsCompleted.add(sub.problem_id._id.toString());
            }
            if (sub.numberOfTestCase > 0) {
              totalScore += (sub.numberOfTestCasePass / sub.numberOfTestCase) * 100;
              problemsWithScores++;
            }
          });          progressStats.studentStats[student._id] = {
            _id: student._id,
            username: student.username,
            email: student.email,
            id: student.id,
            branch: student.branch,
            semester: student.semester,
            batch: student.batch,
            problemsAttempted: problemsAttempted.size,
            problemsCompleted: problemsCompleted.size,
            completionRate: problemsAttempted.size > 0 ? 
              (problemsCompleted.size / problemsAttempted.size * 100).toFixed(1) : 0,
            averageScore: problemsWithScores > 0 ? (totalScore / problemsWithScores).toFixed(1) : 0,
            progressPercentage: (problemsAttempted.size / progressStats.totalProblems * 100).toFixed(1)
          };
        });

        // Calculate overall batch statistics
        const allStudentStats = Object.values(progressStats.studentStats);
        progressStats.overallProgress = {
          averageCompletionRate: allStudentStats.length > 0 ? 
            (allStudentStats.reduce((sum, stat) => sum + parseFloat(stat.completionRate), 0) / allStudentStats.length).toFixed(1) : 0,
          averageScore: allStudentStats.length > 0 ? 
            (allStudentStats.reduce((sum, stat) => sum + parseFloat(stat.averageScore), 0) / allStudentStats.length).toFixed(1) : 0,
          studentsActive: allStudentStats.filter(stat => stat.problemsAttempted > 0).length,
          totalSubmissions: submissions.length,
          averageAttemptsPerStudent: (submissions.length / progressStats.totalStudents).toFixed(1)
        };

        return res.status(200).json({
          success: true,
          batch: {
            _id: batch._id,
            name: batch.name,
            subject: batch.subject,
            branch: batch.branch,
            semester: batch.semester
          },
          progressStats,
          problems
        });
      } catch (error) {
        console.error("Error fetching batch progress:", error);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching batch progress",
          error: error.message
        });
      }
    }
};

export default facultyController;
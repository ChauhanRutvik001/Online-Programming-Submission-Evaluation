import User from '../models/user.js';
import Batch from '../models/batch.js';
import Contest from '../models/contest.js';
import Submission from '../models/submission.js';

const adminBatchController = {
    getDashboardStats: async (req, res) => {
      try {
        // Get count of students, faculty, batches, and contests
        const [studentCount, facultyCount, batchCount, contestCount, contests] = await Promise.all([
          User.countDocuments({ role: 'student' }),
          User.countDocuments({ role: 'faculty' }),
          Batch.countDocuments(),
          Contest.countDocuments(),
          Contest.find().sort({ createdAt: -1 }).limit(10).populate('created_by', 'username')
        ]);
        
        // Get recent activity (submissions, new users, contest creations)
        const [recentSubmissions, recentUsers, recentBatches] = await Promise.all([
          Submission.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('user_id', 'username')
            .lean(),
            
          User.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .select('username role createdAt')
            .lean(),
            
          Batch.find()
            .sort({ createdAt: -1 })
            .limit(2)
            .populate('faculty', 'username')
            .lean()
        ]);
        
        // Format recent activity
        const recentActivity = [
          ...recentSubmissions.map(sub => ({
            id: sub._id,
            userType: 'student',
            name: sub.user_id ? sub.user_id.username : 'Unknown Student',
            action: 'submitted solution',
            timestamp: sub.createdAt
          })),
          ...recentUsers.map(user => ({
            id: user._id,
            userType: user.role,
            name: user.username,
            action: 'registered',
            timestamp: user.createdAt
          })),
          ...recentBatches.map(batch => ({
            id: batch._id,
            userType: 'batch',
            name: batch.name,
            action: 'batch created',
            timestamp: batch.createdAt
          })),
          ...contests.map(contest => ({
            id: contest._id,
            userType: 'faculty',
            name: contest.created_by ? contest.created_by.username : 'Unknown Faculty',
            action: 'created contest',
            timestamp: contest.createdAt
          }))
        ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
        
        return res.status(200).json({
          success: true,
          studentCount,
          facultyCount,
          batchCount,
          contestCount,
          recentActivity
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching dashboard statistics'
        });
      }
    },
    createBatch: async (req, res) => {
      try {
        const { name, description, facultyId, students, subject, semester, branch } = req.body;
        
        // Validate required fields
        if (!name || !facultyId) {
          return res.status(400).json({
            success: false,
            message: "Batch name and faculty ID are required"
          });
        }
        
        // Check if faculty exists and is a faculty
        const faculty = await User.findById(facultyId);
        if (!faculty || faculty.role !== 'faculty') {
          return res.status(404).json({
            success: false,
            message: "Faculty not found or user is not a faculty"
          });
        }
        
        // Create new batch
        const newBatch = new Batch({
          name,
          description: description || "",
          faculty: facultyId,
          students: students || [],
          subject,
          semester,
          branch,
          createdBy: req.user.id,
        });
        
        await newBatch.save();
        
        return res.status(201).json({
          success: true,
          message: "Batch created successfully",
          batch: newBatch
        });
      } catch (error) {
        console.error("Error creating batch:", error);
        return res.status(500).json({
          success: false,
          message: "An error occurred while creating the batch",
          error: error.message
        });
      }
    },
    getAllBatches: async (req, res) => {
      try {
        const { page = 1, limit = 10, facultyId } = req.body;
        const skip = (page - 1) * limit;
        
        // Build query - filter by faculty if provided
        const query = facultyId ? { faculty: facultyId } : {};
        
        // Get batches with pagination
        const batches = await Batch.find(query)
          .populate('faculty', 'username email id')
          .populate('students', 'username id batch semester branch')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
          
        const totalBatches = await Batch.countDocuments(query);
        const totalPages = Math.ceil(totalBatches / limit);
        
        return res.status(200).json({
          success: true,
          batches,
          totalPages,
          currentPage: page,
          totalBatches
        });
      } catch (error) {
        console.error("Error fetching batches:", error);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching batches",
          error: error.message
        });
      }
    }, 
    getBatchById: async (req, res) => {
      try {
        const { batchId } = req.params;
        
        if (!batchId) {
          return res.status(400).json({
            success: false,
            message: "Batch ID is required"
          });
        }
        
        const batch = await Batch.findById(batchId)
          .populate('faculty', 'username email id')
          .populate('students', 'username id batch semester branch');
          
        if (!batch) {
          return res.status(404).json({
            success: false,
            message: "Batch not found"
          });
        }
        
        return res.status(200).json({
          success: true,
          batch
        });
      } catch (error) {
        console.error("Error fetching batch:", error);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching the batch",
          error: error.message
        });
      }
    }, 
    updateBatch: async (req, res) => {
      try {
        const { batchId } = req.params;
        const { name, description, facultyId, subject, branch } = req.body;
        
        if (!batchId) {
          return res.status(400).json({
            success: false,
            message: "Batch ID is required"
          });
        }
        
        // Find batch
        const batch = await Batch.findById(batchId);
        if (!batch) {
          return res.status(404).json({
            success: false,
            message: "Batch not found"
          });
        }
        
        // Update fields
        if (name) batch.name = name;
        if (description !== undefined) batch.description = description;
        if (facultyId) {
          // Verify faculty exists
          const faculty = await User.findById(facultyId);
          if (!faculty || faculty.role !== 'faculty') {
            return res.status(404).json({
              success: false,
              message: "Faculty not found or user is not a faculty"
            });
          }
          batch.faculty = facultyId;
        }
        if (subject) batch.subject = subject;
        if (branch) batch.branch = branch;
        
        await batch.save();
        
        return res.status(200).json({
          success: true,
          message: "Batch updated successfully",
          batch
        });
      } catch (error) {
        console.error("Error updating batch:", error);
        return res.status(500).json({
          success: false,
          message: "An error occurred while updating the batch",
          error: error.message
        });
      }
    },
    deleteBatch: async (req, res) => {
      try {
        const { batchId } = req.params;
        
        if (!batchId) {
          return res.status(400).json({
            success: false,
            message: "Batch ID is required"
          });
        }
        
        // Find and delete batch
        const batch = await Batch.findById(batchId);
        if (!batch) {
          return res.status(404).json({
            success: false,
            message: "Batch not found"
          });
        }
        
        await Batch.deleteOne({ _id: batchId });
        
        return res.status(200).json({
          success: true,
          message: "Batch deleted successfully"
        });
      } catch (error) {
        console.error("Error deleting batch:", error);
        return res.status(500).json({
          success: false,
          message: "An error occurred while deleting the batch",
          error: error.message
        });
      }
    },
    addStudentsToBatch: async (req, res) => {
      try {
        const { batchId } = req.params;
        const { studentIds } = req.body;
        
        if (!batchId) {
          return res.status(400).json({
            success: false,
            message: "Batch ID is required"
          });
        }
        
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Student IDs are required and must be an array"
          });
        }
        
        // Find batch
        const batch = await Batch.findById(batchId);
        if (!batch) {
          return res.status(404).json({
            success: false,
            message: "Batch not found"
          });
        }
        
        // Verify all students exist
        const students = await User.find({
          _id: { $in: studentIds },
          role: 'student'
        });
        
        if (students.length !== studentIds.length) {
          return res.status(400).json({
            success: false,
            message: "One or more student IDs are invalid"
          });
        }
        
        // Add students to batch
        const currentStudentIds = batch.students.map(id => id.toString());
        const newStudentIds = studentIds.filter(id => !currentStudentIds.includes(id));
        
        batch.students = [...batch.students, ...newStudentIds];
        await batch.save();
        
        return res.status(200).json({
          success: true,
          message: "Students added to batch successfully",
          batch
        });
      } catch (error) {
        console.error("Error adding students to batch:", error);
        return res.status(500).json({
          success: false,
          message: "An error occurred while adding students to the batch",
          error: error.message
        });
      }
    }, 
    removeStudentsFromBatch: async (req, res) => {
      try {
        const { batchId } = req.params;
        const { studentIds } = req.body;
        
        if (!batchId) {
          return res.status(400).json({
            success: false,
            message: "Batch ID is required"
          });
        }
        
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Student IDs are required and must be an array"
          });
        }
        
        // Find batch
        const batch = await Batch.findById(batchId);
        if (!batch) {
          return res.status(404).json({
            success: false,
            message: "Batch not found"
          });
        }
        
        // Remove students from batch
        batch.students = batch.students.filter(id => !studentIds.includes(id.toString()));
        await batch.save();
        
        return res.status(200).json({
          success: true,
          message: "Students removed from batch successfully",
          batch
        });
      } catch (error) {
        console.error("Error removing students from batch:", error);
        return res.status(500).json({
          success: false,
          message: "An error occurred while removing students from the batch",
          error: error.message
        });
      }
    },
    getBatchesByFaculty: async (req, res) => {
      try {
        const { facultyId } = req.params;
        
        if (!facultyId) {
          return res.status(400).json({
            success: false,
            message: "Faculty ID is required"
          });
        }
        
        // Verify faculty exists
        const faculty = await User.findById(facultyId);
        if (!faculty || faculty.role !== 'faculty') {
          return res.status(404).json({
            success: false,
            message: "Faculty not found or user is not a faculty"
          });
        }
        
        // Get batches for faculty
        const batches = await Batch.find({ faculty: facultyId })
          .populate('students', 'username id batch semester branch')
          .sort({ createdAt: -1 });
          
        return res.status(200).json({
          success: true,
          batches
        });
      } catch (error) {
        console.error("Error fetching batches by faculty:", error);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching batches",
          error: error.message
        });
      }
    },
};

export default adminBatchController;

import User from '../models/user.js';
import bcrypt from 'bcrypt';
import Code from '../models/Code.js';
import Submission from '../models/submission.js';
import Batch from '../models/batch.js';

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
    
      try {
        // Check if the user exists
        const user = await User.findById(userId); // Assuming `userId` is an ObjectId
        if (!user) {
          return res
            .status(404)
            .json({ success: false, message: "User not found." });
        }
    
        console.log("User found:", user);
        const userName = user.id;
    
        // Remove the user
        await User.deleteOne({ _id: userId }); // Assuming `_id` is the field for user ID
    
        // Remove all submissions related to the user
        await Submission.deleteMany({ user_id: userId });
    
        // Remove all codes related to the user
        await Code.deleteMany({ userId: userId });
    
        return res.status(200).json({
          success: true,
          message: `User with ID ${userName} and all related data have been successfully removed.`,
        });
      } catch (error) {
        console.error("Error in removing user:", error.message);
        return res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      }    }
    ,
    // Batch related functions for faculty
    getMyBatches: async (req, res) => {
      try {
        const facultyId = req.user.id;
        
        // Find all batches where this faculty is assigned
        const batches = await Batch.find({ faculty: facultyId, isActive: true })
          .populate('students', 'username id batch semester branch')
          .sort({ createdAt: -1 });
        
        return res.status(200).json({
          success: true,
          batches,
          count: batches.length
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
          .populate('faculty', 'username email id');
          
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
    }
};

export default facultyController;
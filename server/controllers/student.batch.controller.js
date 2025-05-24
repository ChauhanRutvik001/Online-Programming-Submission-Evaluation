import Batch from '../models/batch.js';
import Problem from '../models/problem.js';

const studentBatchController = {
  // Get all batches that a student is part of (with server-side search & pagination)
  getMyBatches: async (req, res) => {
    try {
      const studentId = req.user.id;
      const {
        search = '',
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      // Build query
      const query = {
        students: studentId,
        isActive: true,
      };
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
        .populate('faculty', 'username email id')
        .populate('students', 'username id')
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
      console.error("Error fetching student batches:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching batches"
      });
    }
  },
  
  // Get specific batch details 
  getBatchDetails: async (req, res) => {
    try {
      const { batchId } = req.params;
      const studentId = req.user.id;
      
      // Find the batch and ensure the student is part of it
      const batch = await Batch.findOne({ 
        _id: batchId, 
        students: studentId,
        isActive: true 
      })
        .populate('faculty', 'username email id')
        .populate('students', 'username id email branch semester batch')
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

  // Get problems for a batch with search and pagination
  getBatchProblems: async (req, res) => {
    try {
      const { batchId } = req.params;
      const studentId = req.user.id;
      const {
        search = '',
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // First verify the student has access to this batch
      const batch = await Batch.findOne({
        _id: batchId,
        students: studentId,
        isActive: true
      });

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found or you don't have access to it"
        });
      }

      // Build query for problems
      const query = {
        _id: { $in: batch.assignedProblems }
      };

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { difficulty: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Get problems with pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [problems, totalProblems] = await Promise.all([
        Problem.find(query)
          .select('_id title difficulty createdAt dueDate')
          .populate('createdBy', 'username')
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit)),
        Problem.countDocuments(query)
      ]);

      return res.status(200).json({
        success: true,
        problems,
        totalProblems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProblems / parseInt(limit))
      });
    } catch (error) {
      console.error("Error fetching batch problems:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching problems",
        error: error.message
      });
    }
  }
};

export default studentBatchController;

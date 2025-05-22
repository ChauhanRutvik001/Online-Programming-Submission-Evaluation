import Batch from '../models/batch.js';

const studentBatchController = {
  // Get all batches that a student is part of
  getMyBatches: async (req, res) => {
    try {
      const studentId = req.user.id;
      
      // Find all batches where this student is a member
      const batches = await Batch.find({ 
        students: studentId,
        isActive: true 
      })
        .populate('faculty', 'username email id')
        .sort({ createdAt: -1 });
      
      return res.status(200).json({
        success: true,
        batches,
        count: batches.length
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
        .populate('students', 'username id');
        
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

export default studentBatchController;

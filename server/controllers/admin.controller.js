import User from '../models/user.js';
import bcrypt from 'bcrypt';

const adminController = {
    // for the sending all the pending request to the perticuler admin for the validation
    getPendingRequest: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;

            if (page <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Page number must be greater than 0."
                });
            }

            const [pendingUsers, totalUsers] = await Promise.all([
                User.find({ isApproved: false, role: 'faculty' })
                    .select("_id email mobileNo username branch semester batch subject")
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: 1 }),

                User.countDocuments({ isApproved: false, role: 'faculty' })
            ]);

            if (pendingUsers.length === 0) {
                return res.status(200).json({
                    success: false,
                    message: "No pending users found"
                });
            }

            res.status(200).json({
                success: true,
                data: pendingUsers,
                total: totalUsers,
                totalPages: Math.ceil(totalUsers / limit),
                currentPage: page,
            });
        } catch (error) {
            console.error("Error fetching pending users:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to retrieve pending requests"
            });
        }
    },

    acceptRequest: async (req, res, next) => {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ success: false, message: "User ID is required" });
            }

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            if (user.isApproved) {
                return res.status(400).json({ success: false, message: "User is already approved" });
            }

            if (user.role === 'faculty') {
                const emailPrefix = user.email.split('@')[0];
                user.password = emailPrefix;
            }

            user.isApproved = true;

            await user.save();

            res.status(200).json({
                success: true,
                message: "User request accepted and approved",
                data: {
                    username: user.username,
                    email: user.email,
                    branch: user.branch,
                    semester: user.semester,
                    batch: user.batch,
                },
            });
        } catch (error) {
            console.error("Error accepting user request:", error);
            res.status(500).json({
                success: false,
                message: "An internal server error occurred",
                error: error.message,
            });
        }
    },

    // decline request by admin
    declineRequest: async (req, res, next) => {
        try {
            const { userId } = req.body;

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            await User.findByIdAndDelete(userId);

            res.status(200).json({
                success: true,
                message: "User request declined and user removed successfully"
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Accept all requests by admin
    acceptAllRequests: async (req, res, next) => {
        console.log("This is api hit")
        try {
            const pendingUsers = await User.find({ isApproved: false, role: 'faculty' });

            if (pendingUsers.length === 0) {
                return res.status(404).json({ success: false, message: "No pending faculty users to approve" });
            }

            const bulkOps = [];
            let approvedCount = 0;

            for (let user of pendingUsers) {
                if (user.isApproved) {
                    continue;
                }

                const emailPrefix = user.email.split('@')[0];
                const generatedPassword = await bcrypt.hash(emailPrefix, 10);

                bulkOps.push({
                    updateOne: {
                        filter: { _id: user._id },
                        update: {
                            $set: {
                                password: generatedPassword,
                                isApproved: true,
                            },
                        },
                    },
                });

                approvedCount++;
            }

            console.log(bulkOps);

            if (bulkOps.length > 0) {
                await User.bulkWrite(bulkOps);
            }

            res.status(200).json({
                success: true,
                message: `${approvedCount} faculty users have been approved`,
            });
        } catch (error) {
            console.error("Error approving faculty users:", error);
            res.status(500).json({
                success: false,
                message: "An internal server error occurred",
                error: error.message,
            });
        }
    },

    // for declining all the users by admin
    declineAllRequests: async (req, res, next) => {
        try {
            const deletedUsers = await User.deleteMany({ isApproved: false, role: 'faculty' });

            if (deletedUsers.deletedCount === 0) {
                return res.status(404).json({ success: false, message: "No pending users to decline" });
            }

            res.status(200).json({
                success: true,
                message: `${deletedUsers.deletedCount} users have been declined and removed successfully`
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getFaculty :  async (req, res) => {
      const { page = 1, limit = 10 } = req.body;
      console.log(req.body)
    
      
    
      try {
        const skip = (page - 1) * limit;
    
        // Fetch approved facultys with pagination, sorted by the latest created first
        const facultys = await User.find({role: "faculty", isApproved: true })
          .select("username branch email subject createdAt id")
          .sort({ createdAt: -1 }) // Sort by createdAt in descending order (latest first)
          .skip(skip)
          .limit(limit);
    
        const totalStudents = await User.countDocuments({ role: "faculty", isApproved: true });
    
        const totalPages = Math.ceil(totalStudents / limit);
    
        res.status(200).json({
          success: true,
          message: "Faculty fetched successfully.",
          facultys,
          totalPages, // Include totalPages
          currentPage: page,
          totalStudents
        });
      } catch (error) {
        console.error("Error in fetching faculty by admin ID:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
      }
    },

    deleteFaculty : async (req, res) => {
        try {
            const { facultyId } = req.body;
        
            if (!facultyId) {
            return res.status(400).json({ success: false, message: "Faculty ID is required" });
            }
        
            const faculty = await User.findById(facultyId);
        
            if (!faculty) {
            return res.status(404).json({ success: false, message: "Faculty not found" });
            }
        
            await User.findByIdAndDelete(facultyId);
        
            res.status(200).json({
            success: true,
            message: "Faculty deleted successfully"
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default adminController;
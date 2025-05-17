import User from '../models/user.js';
import bcrypt from 'bcrypt';
import Code from '../models/Code.js';
import Submission from '../models/submission.js';

const facultyController = {

    getPendingRequest: async (req, res, next) => {
        try {
            const facultyId = req.query.facultyId;
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;

            if (!facultyId) {
                return res.status(400).json({
                    success: false,
                    message: "Faculty ID is required"
                });
            }

            if (page <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Page number must be greater than 0."
                });
            }

            const [pendingUsers, totalUsers] = await Promise.all([
                User.find({
                    isApproved: false,
                    role: 'student',
                    facultyId: facultyId
                })
                    .select("_id id username mobileNo email branch semester batch")
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: 1 }),

                User.countDocuments({
                    isApproved: false,
                    role: 'student',
                    facultyId: facultyId
                })
            ]);

            if (pendingUsers.length === 0) {
                return res.status(200).json({
                    success: false,
                    message: "No pending users found for this faculty"
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

    // Accept request by faculty
    acceptRequest: async (req, res, next) => {
        try {
            const { userId, facultyId } = req.body;

            if (!userId || !facultyId) {
                return res.status(400).json({ success: false, message: "User ID and Faculty ID are required" });
            }

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            if (user.isApproved) {
                return res.status(400).json({ success: false, message: "User is already approved" });
            }

            if (user.facultyId.toString() !== facultyId) {
                return res.status(400).json({ success: false, message: "This student is not associated with the given faculty" });
            }

            const emailDomain = "@charusat.edu.in";
            const generatedEmail = `${user.id.toLowerCase()}${emailDomain}`;
            const generatedPassword = user.id;

            user.isApproved = true;
            user.email = generatedEmail;
            user.password = generatedPassword;

            user.facultyId = facultyId;

            await user.save();

            res.status(200).json({
                success: true,
                message: "User request accepted and approved",
                data: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    branch: user.branch,
                    semester: user.semester,
                    batch: user.batch,
                },
            });
        } catch (error) {
            console.error("Error accepting user request:", error);
            res.status(500).json({ success: false, message: "An internal server error occurred", error: error.message });
        }
    },

    // decline request by admin
    declineRequest: async (req, res, next) => {
        try {
            const { userId, facultyId } = req.body;

            if (!userId || !facultyId) {
                return res.status(400).json({ success: false, message: "User ID and Faculty ID are required" });
            }

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            if (user.facultyId.toString() !== facultyId) {
                return res.status(400).json({ success: false, message: "This student is not associated with the given faculty" });
            }

            await User.findByIdAndDelete(userId);

            res.status(200).json({
                success: true,
                message: "User request declined and user removed successfully"
            });
        } catch (error) {
            console.error("Error declining user request:", error);
            res.status(500).json({
                success: false,
                message: error.message || "An internal server error occurred"
            });
        }
    },

    // Accept all requests by admin
    acceptAllRequests: async (req, res, next) => {
        try {
            const { facultyId } = req.body;

            if (!facultyId) {
                return res.status(400).json({ success: false, message: "Faculty ID is required" });
            }

            const pendingUsers = await User.find({ isApproved: false, role: 'student', facultyId: facultyId });
            console.log(pendingUsers);

            if (pendingUsers.length === 0) {
                return res.status(404).json({ success: false, message: "No pending users to approve for this faculty" });
            }

            const bulkOps = [];
            let approvedCount = 0;

            for (let user of pendingUsers) {
                if (user.isApproved) {
                    continue;
                }

                console.log(user);

                const emailDomain = "@charusat.edu.in";
                const generatedEmail = `${user.id.toLowerCase()}${emailDomain}`;
                const generatedPassword = await bcrypt.hash(user.id, 10);

                bulkOps.push({
                    updateOne: {
                        filter: { _id: user._id },
                        update: {
                            $set: {
                                email: generatedEmail,
                                password: generatedPassword,
                                isApproved: true,
                                facultyId: facultyId,
                            },
                        },
                    },
                });

                approvedCount++;
            }

            if (bulkOps.length > 0) {
                await User.bulkWrite(bulkOps);
            }

            res.status(200).json({
                success: true,
                message: `${approvedCount} users have been approved.`,
            });
        } catch (error) {
            console.error("Error approving users:", error);
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
            const { facultyId } = req.body;

            if (!facultyId) {
                return res.status(400).json({ success: false, message: "Faculty ID is required" });
            }

            const deletedUsers = await User.deleteMany({ isApproved: false, role: 'student', facultyId });

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

    BulkRequests : async (req, res) => {
      const { students, facultyId } = req.body;
    
      if (!facultyId) {
        return res.status(400).json({ message: "Faculty ID is required." });
      }
    
      if (!students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ message: "Invalid or missing students data." });
      }
    
      try {
        // Validate faculty ID
        const faculty = await User.findById(facultyId);
        if (!faculty || faculty.role !== "faculty") {
          return res.status(404).json({ message: "Faculty not found or invalid." });
        }
    
        const results = { success: [], errors: [] };
    
        // Bulk register students
        for (const student of students) {
          const { username, id, batch, semester } = student;
        
          if (!username || !id || !batch || !semester) {
            console.log("hello")
            results.errors.push({ id, message: "Incomplete student data." });
            continue;
          }
        
          // Determine the branch based on the 'id'
          let branchCode;
          console.log(id);
          if (id.includes("it")) {
            branchCode = "it";
          } else if (id.includes("ce")) {
            branchCode = "ce";
          } else if (id.includes("cse")) {
            branchCode = "cse";
          } else {
            branchCode = "unknown"; // Handle cases where the branch is not identified
          }
    
          if(branchCode === "unknown") {
            results.errors.push({ id, message: "ID number is not correct" });
          }
        
          // Generate the branch code based on the identified branch
          const branch = `cspit-${branchCode}`;
          console.log("Branch code:", branch);
        
          const role = "student";
          const password = id; // Default password is student ID
          const emailDomain = "@charusat.edu.in";
          const email = `${id.toLowerCase()}${emailDomain}`;
        
          try {
            const existingUser = await User.findOne({ id });
            if (existingUser) {
              results.errors.push({ id, message: "User already exists." });
              continue;
            }
        
            const newUser = new User({
              username,
              id,
              email,
              batch,
              semester,
              password,
              role,
              isApproved: true,
              facultyId,
              branch, // Add the branch code to the user object
            });
    
            console.log("New user:", newUser);
        
            await newUser.save();
            results.success.push({ id, message: "User registered successfully." });
          } catch (error) {
            console.error("Error registering user:", error);
            results.errors.push({ id, message: "Error registering user." });
          }
        }
        
    
        res.json({ message: "Bulk registration completed.", results });
      } catch (error) {
        console.error("Error in bulk registration:", error);
        res.status(500).json({ message: "Internal server error." });
      }
    },


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
      }
    }
};

export default facultyController;
import User from '../models/user.js';
import bcrypt from 'bcrypt';
import Submission from '../models/submission.js';
import Code from '../models/Code.js';
import Contest from '../models/contest.js';

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
    },    // Accept all requests by admin
    acceptAllRequests: async (req, res, next) => {
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
    },    getFaculty: async (req, res) => {
      const { page = 1, limit = 10 } = req.body;
    
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
    },    deleteFaculty: async (req, res) => {
        try {
            const { facultyId } = req.body;
        
            if (!facultyId) {
            return res.status(400).json({ success: false, message: "Faculty ID is required" });
            }
        
            const faculty = await User.findById(facultyId);
        
            if (!faculty) {
            return res.status(404).json({ success: false, message: "Faculty not found" });            }
        
            await User.findByIdAndDelete(facultyId);
        
            res.status(200).json({
            success: true,
            message: "Faculty deleted successfully"
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
      // New controller to create faculty account directly by admin
    createFaculty: async (req, res) => {
        try {
            const { username, email } = req.body;
            const branch = 'cspit-it'; // Default branch is always cspit-it
            
            // Validate required fields
            if (!username || !email) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Username and email are required" 
                });
            }
            
            // Check if email matches expected format (@charusat.ac.in)
            if (!email.endsWith('@charusat.ac.in')) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Email must end with @charusat.ac.in" 
                });
            }
            
            // Check if user with this email already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: "User with this email already exists" 
                });
            }
            
            // Extract ID from email (part before @)
            const id = email.split('@')[0];
            
            // Create new faculty user (subject is optional)
            const newFaculty = new User({
                username,
                id,
                email,
                branch,
                password: id, // Set password to be the same as ID
                role: 'faculty',
                isApproved: true, // Auto-approve since admin is creating
                firstTimeLogin: true // User should change password on first login
            });
            
            // Save the new faculty
            await newFaculty.save();
            
            res.status(201).json({
                success: true,
                message: "Faculty created successfully",
                data: {
                    username: newFaculty.username,
                    email: newFaculty.email,
                    id: newFaculty.id,
                    branch: newFaculty.branch
                }
            });
            
        } catch (error) {
            console.error("Error creating faculty account:", error);
            res.status(500).json({
                success: false,
                message: "An internal server error occurred",
                error: error.message
            });
        }
    },
    
    // Bulk faculty creation from Excel file
    bulkCreateFaculty: async (req, res) => {
        try {
            const { facultyList } = req.body;
            
            if (!facultyList || !Array.isArray(facultyList) || facultyList.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or empty faculty list"
                });
            }
            
            const results = { success: [], errors: [] };
            
            for (const faculty of facultyList) {
                const { username, email } = faculty;
                const branch = 'cspit-it'; // Default branch is always cspit-it
                
                // Validate required fields
                if (!username || !email) {
                    results.errors.push({
                        email: email || "unknown",
                        message: "Username and email are required"
                    });
                    continue;
                }
                
                // Check if email matches expected format (@charusat.ac.in)
                if (!email.endsWith('@charusat.ac.in')) {
                    results.errors.push({
                        email,
                        message: "Email must end with @charusat.ac.in"
                    });
                    continue;
                }
                
                try {
                    // Check if user with this email already exists
                    const existingUser = await User.findOne({ email });
                    if (existingUser) {
                        results.errors.push({
                            email,
                            message: "User with this email already exists"
                        });
                        continue;
                    }
                    
                    // Extract ID from email (part before @)
                    const id = email.split('@')[0];
                    
                    // Create new faculty user
                    const newFaculty = new User({
                        username,
                        id,
                        email,
                        branch,
                        password: id, // Set password to be the same as ID
                        role: 'faculty',
                        isApproved: true, // Auto-approve since admin is creating
                        firstTimeLogin: true // User should change password on first login
                    });
                      // Save the new faculty
                    await newFaculty.save();
                    
                    results.success.push({
                        email,
                        id,
                        username
                    });
                } catch (error) {
                    console.error("Error creating faculty:", error);
                    results.errors.push({
                        email,
                        message: "Error creating faculty: " + error.message
                    });
                }
            }
            
            res.status(200).json({
                success: true,
                message: "Bulk faculty creation completed",
                results
            });
            
        } catch (error) {
            console.error("Error in bulk faculty creation:", error);
            res.status(500).json({
                success: false,
                message: "An internal server error occurred",
                error: error.message
            });
        }
    },    BulkStudentRequests : async (req, res) => {
      const { students } = req.body;
    
      if (!students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ message: "Invalid or missing students data." });
      }
    
      try {
        const results = { success: [], errors: [] };
        
        // Valid batch and semester values for validation
        const validBatches = ['a1', 'b1', 'c1', 'd1', 'a2', 'b2', 'c2', 'd2'];
        const validSemesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
        // Bulk register students
        for (const student of students) {
          const { username, id, batch, semester } = student;
        
          if (!username || !id || !batch || !semester) {
            results.errors.push({ id: id || "unknown", message: "Incomplete student data." });
            continue;
          }
          
          // Validate batch
          if (!validBatches.includes(batch.toLowerCase())) {
            results.errors.push({ id, message: `Invalid batch "${batch}". Must be one of: ${validBatches.join(', ')}` });
            continue;
          }
          
          // Validate semester
          if (!validSemesters.includes(String(semester))) {
            results.errors.push({ id, message: "Invalid semester. Must be between 1-8" });
            continue;
          }
          // Determine the branch based on the 'id'
          let branchCode;
          
          if (id.toLowerCase().includes("it")) {
            branchCode = "it";
          } else if (id.toLowerCase().includes("ce")) {
            branchCode = "ce";
          } else if (id.toLowerCase().includes("cse")) {
            branchCode = "cse";
          } else {
            branchCode = "unknown"; // Handle cases where the branch is not identified
          }
    
          if(branchCode === "unknown") {
            results.errors.push({ id, message: "ID number is not correct. It must contain 'it', 'ce', or 'cse'." });
            continue;
          }
        
          // Generate the branch code based on the identified branch
          const branch = `cspit-${branchCode}`;
          
          const role = "student";
          const password = id; // Default password is student ID
          const emailDomain = "@charusat.edu.in";
          const email = `${id.toLowerCase()}${emailDomain}`;
        
          try {
            const existingUser = await User.findOne({ id });
            if (existingUser) {
              results.errors.push({ id, message: "User already exists." });
              continue;
            }            const newUser = new User({
              username,
              id,
              email,
              batch,
              semester,
              password,
              role,
              isApproved: true,
              branch, // Add the branch code to the user object
            });
        
            await newUser.save();
            results.success.push({ id, message: "User registered successfully." });
          } catch (error) {
            console.error("Error registering user:", error);
            results.errors.push({ id, message: "Error registering user." });
          }
        }
        
    
        res.json({ 
          success: true, 
          message: "Bulk registration completed.", 
          results 
        });
      } catch (error) {
        console.error("Error in bulk registration:", error);
        res.status(500).json({ 
          success: false, 
          message: "Internal server error." 
        });
      }
    },
    
    getStudents: async (req, res) => {
      const { page = 1, limit = 10 } = req.body;
      
      try {
        const skip = (page - 1) * limit;
    
        const students = await User.find({ role: "student", isApproved: true })
          .select("username batch branch semester id createdAt facultyId")
          .populate('facultyId', 'username email')
          .sort({ id : 1 }) 
          .skip(skip)
          .limit(limit);
    
        // Get total count of approved students
        const totalStudents = await User.countDocuments({ role: "student", isApproved: true });
    
        // Calculate total pages and return data
        const totalPages = Math.ceil(totalStudents / limit);
    
        res.status(200).json({
          success: true,
          message: "Students fetched successfully.",
          students,
          totalPages,
          currentPage: page,
          totalStudents
        });
      } catch (error) {
        console.error("Error in fetching students:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
      }
    },
    
    removeStudent: async (req, res) => {
      const { userId } = req.params;
    
      if (!userId) {
        return res.status(400).json({ success: false, message: "Missing User ID." });
      }
    
      try {
        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
          return res
            .status(404)
            .json({ success: false, message: "User not found." });
        }
    
        const userName = user.id;
    
        // Remove the user
        await User.deleteOne({ _id: userId });
    
        // Remove all submissions related to the user
        await Submission.deleteMany({ user_id: userId });
    
        // Remove all codes related to the user
        await Code.deleteMany({ userId: userId });
    
        return res.status(200).json({
          success: true,
          message: `Student with ID ${userName} and all related data have been successfully removed.`,
        });
      } catch (error) {
        console.error("Error in removing student:", error.message);
        return res.status(500).json({
          success: false,
          message: "Internal server error.",        });
      }
    },
    
    // Get dashboard statistics for the admin dashboard
    getDashboardStats: async (req, res) => {
      try {
        // Get count of students, faculty, batches, and contests
        const [studentCount, facultyCount, contests] = await Promise.all([
          User.countDocuments({ role: 'student' }),
          User.countDocuments({ role: 'faculty' }),
          Contest.find().sort({ createdAt: -1 }).limit(10).populate('created_by', 'username')
        ]);
        
        // Get unique batches by aggregating student data
        const uniqueBatches = await User.aggregate([
          { $match: { role: 'student', batch: { $exists: true, $ne: '' } } },
          { $group: { _id: '$batch' } },
          { $count: 'count' }
        ]);
        
        const batchCount = uniqueBatches.length > 0 ? uniqueBatches[0].count : 0;
        const contestCount = await Contest.countDocuments();
        
        // Get recent activity (submissions, new users, contest creations)
        const recentSubmissions = await Submission.find()
          .sort({ createdAt: -1 })
          .limit(3)
          .populate('userId', 'username')
          .lean();
          
        const recentUsers = await User.find()
          .sort({ createdAt: -1 })
          .limit(3)
          .select('username role createdAt')
          .lean();
          
        const recentContests = await Contest.find()
          .sort({ createdAt: -1 })
          .limit(2)
          .populate('created_by', 'username')
          .lean();
        
        // Format recent activity
        const recentActivity = [
          ...recentSubmissions.map(sub => ({
            id: sub._id,
            userType: 'student',
            name: sub.userId ? sub.userId.username : 'Unknown Student',
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
          ...recentContests.map(contest => ({
            id: contest._id,
            userType: 'faculty',
            name: contest.created_by ? contest.created_by.username : 'Unknown Faculty',
            action: 'created contest',
            timestamp: contest.createdAt
          }))
        ]
        // Sort by timestamp (most recent first)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        // Limit to 5 most recent activities
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
    }
};

export default adminController;
import User from '../models/user.js';
import Submission from '../models/submission.js';
import Code from '../models/Code.js';

const adminFacultyController = {
    getFaculty: async (req, res) => {
      const { page = 1, limit = 10 } = req.body;
    
      try {
        const skip = (page - 1) * limit;
    
        // Fetch approved facultys with pagination, sorted by the latest created first
        const facultys = await User.find({role: "faculty", isApproved: true })
          .select("username branch email subject createdAt id")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
    
        const totalStudents = await User.countDocuments({ role: "faculty", isApproved: true });
    
        const totalPages = Math.ceil(totalStudents / limit);
    
        res.status(200).json({
          success: true,
          message: "Faculty fetched successfully.",
          facultys,
          totalPages,
          currentPage: page,
          totalStudents
        });
      } catch (error) {
        console.error("Error in fetching faculty by admin ID:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
      }
    },    
    deleteFaculty: async (req, res) => {
        try {
            const { facultyId } = req.body;
        
            if (!facultyId) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Faculty ID is required." 
                });
            }
        
            const faculty = await User.findById(facultyId);
        
            if (!faculty) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Faculty not found." 
                });
            }
        
            await User.findByIdAndDelete(facultyId);
        
            res.status(200).json({
                success: true,
                message: "Faculty deleted successfully"
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    createFaculty: async (req, res) => {
        try {
            const { username, email } = req.body;
            const branch = 'cspit-it';            
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
                    message: "Email must be a valid Charusat email address ending with @charusat.ac.in"
                });
            }
            
            // Check if user with this email already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "A user with this email already exists"
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
                password: id,
                role: 'faculty',
                isApproved: true,
                firstTimeLogin: true
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
    bulkCreateFaculty: async (req, res) => {
        try {
            const { facultyList } = req.body;
            
            if (!facultyList || !Array.isArray(facultyList) || facultyList.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Faculty list is required and must be an array"
                });
            }
            
            const results = { success: [], errors: [] };
            
            for (const faculty of facultyList) {
                // Process each faculty in the list
                try {
                    // Validate data
                    if (!faculty.username || !faculty.email) {
                        results.errors.push({
                            data: faculty,
                            error: "Username and email are required"
                        });
                        continue;
                    }
                    
                    // Other validation/processing logic
                    
                    // Create faculty logic
                    const response = await adminFacultyController.createFaculty({
                        body: faculty
                    }, {
                        status: function(code) {
                            return {
                                json: function(data) {
                                    if (code === 201) {
                                        results.success.push({
                                            data: faculty,
                                            message: "Successfully created"
                                        });
                                    } else {
                                        results.errors.push({
                                            data: faculty,
                                            error: data.message
                                        });
                                    }
                                }
                            };
                        }
                    });
                } catch (error) {
                    results.errors.push({
                        data: faculty,
                        error: error.message
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
    },      BulkStudentRequests: async (req, res) => {
      const { students } = req.body;
    
      if (!students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid or missing students data." 
        });
      }
    
      try {
        const results = { success: [], errors: [] };
        
        // Valid batch and semester values for validation
        const validBatches = ['a1', 'b1', 'c1', 'd1', 'a2', 'b2', 'c2', 'd2'];
        const validSemesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
        // Bulk register students
        for (const student of students) {
          try {
            // Validate required fields
            if (!student.id || !student.username || !student.batch || !student.semester) {
              results.errors.push({
                data: student,
                error: "ID, username, batch, and semester are required"
              });
              continue;
            }
            
            // Validate batch format
            if (!validBatches.includes(student.batch.toLowerCase())) {
              results.errors.push({
                data: student,
                error: `Invalid batch format. Must be one of: ${validBatches.join(", ")}`
              });
              continue;
            }
            
            // Validate semester
            const semesterNum = parseInt(student.semester);
            if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
              results.errors.push({
                data: student,
                error: "Invalid semester. Must be between 1-8"
              });
              continue;
            }
            
            // Check if student ID already exists
            const existingStudent = await User.findOne({ id: student.id });
            if (existingStudent) {
              results.errors.push({
                data: student,
                error: "A student with this ID already exists"
              });
              continue;
            }
            
            // Create email using ID
            const email = `${student.id}@charusat.edu.in`;
            
            // Create new student user
            const newStudent = new User({
              username: student.username,
              id: student.id.toLowerCase(),
              email,
              batch: student.batch.toLowerCase(),
              semester: semesterNum,
              password: student.id.toLowerCase(),
              role: 'student',
              isApproved: true,
              firstTimeLogin: true
            });
            
            // Save the new student
            await newStudent.save();
            
            results.success.push({
              data: student,
              message: "Successfully registered"
            });
          } catch (error) {
            results.errors.push({
              data: student,
              error: error.message || "An error occurred while processing this student"
            });
          }
        }
    
        res.status(200).json({ 
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
    },    getStudents: async (req, res) => {
      const { 
        page = 1, 
        limit = 10, 
        search = "", 
        sortBy = "id", 
        sortOrder = "asc",
        batch = "",
        semester = "",
        branch = "" 
      } = req.body;
      
      try {
        const skip = (page - 1) * limit;
        
        // Build query filters
        const filters = { role: "student", isApproved: true };
        
        // Apply search filter if provided
        if (search) {
          filters.$or = [
            { username: { $regex: search, $options: "i" } },
            { id: { $regex: search, $options: "i" } }
          ];
        }
        
        // Apply additional filters if provided
        if (batch) filters.batch = batch;
        if (semester) filters.semester = parseInt(semester);
        if (branch) filters.branch = branch;
        
        // Determine sort direction
        const sortDirection = sortOrder === "desc" ? -1 : 1;
        
        // Build sort object
        const sortOptions = {};
        sortOptions[sortBy] = sortDirection;
    
        const students = await User.find(filters)
          .select("username batch branch semester id createdAt facultyId")
          .populate('facultyId', 'username email')
          .sort(sortOptions) 
          .skip(skip)
          .limit(parseInt(limit));
    
        // Get total count of filtered students
        const totalStudents = await User.countDocuments(filters);
    
        // Calculate total pages and return data
        const totalPages = Math.ceil(totalStudents / limit);
        
        // Get unique batches and semesters for filter options
        const [uniqueBatches, uniqueSemesters, uniqueBranches] = await Promise.all([
          User.distinct('batch', { role: "student", isApproved: true }),
          User.distinct('semester', { role: "student", isApproved: true }),
          User.distinct('branch', { role: "student", isApproved: true })
        ]);
    
        res.status(200).json({
          success: true,
          message: "Students fetched successfully.",
          students,
          totalPages,
          currentPage: parseInt(page),
          totalStudents,
          filters: {
            batches: uniqueBatches.filter(Boolean).sort(),
            semesters: uniqueSemesters.filter(Boolean).sort((a, b) => a - b),
            branches: uniqueBranches.filter(Boolean).sort()
          }
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
          return res.status(404).json({ success: false, message: "User not found." });
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
          message: "Internal server error."
        });
      }
    },    registerStudent: async (req, res) => {
      try {
        const { id, username, batch, semester } = req.body;
        
        // Validate required fields
        if (!id || !username || !batch || !semester) {
          return res.status(400).json({
            success: false,
            message: "ID, username, batch, and semester are required"
          });
        }
        
        // Check if student ID already exists
        const existingStudent = await User.findOne({ id });
        if (existingStudent) {
          return res.status(400).json({
            success: false,
            message: "A student with this ID already exists"
          });
        }
        
        // Validate batch format (assuming a1, b2, c1, etc. format)
        const validBatches = ['a1', 'b1', 'c1', 'd1', 'a2', 'b2', 'c2', 'd2'];
        if (!validBatches.includes(batch.toLowerCase())) {
          return res.status(400).json({
            success: false,
            message: "Invalid batch format. Must be one of: " + validBatches.join(", ")
          });
        }
        
        // Validate semester (1-8)
        const semesterNum = parseInt(semester);
        if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
          return res.status(400).json({
            success: false,
            message: "Invalid semester. Must be between 1-8"
          });
        }
        
        // Create email using ID
        const email = `${id}@charusat.edu.in`;
        
        // Create new student user
        const newStudent = new User({
          username,
          id: id.toLowerCase(),
          email,
          batch: batch.toLowerCase(),
          semester: semesterNum,
          password: id.toLowerCase(), // Default password is the same as ID
          role: 'student',
          isApproved: true, // Auto-approve since admin is creating
          firstTimeLogin: true // Student should change password on first login
        });
        
        // Save the new student
        await newStudent.save();
        
        res.status(201).json({
          success: true,
          message: "Student registered successfully",
          data: {
            username: newStudent.username,
            id: newStudent.id,
            batch: newStudent.batch,
            semester: newStudent.semester
          }
        });
        
      } catch (error) {
        console.error("Error registering student:", error);
        res.status(500).json({
          success: false,
          message: "An internal server error occurred",
          error: error.message
        });
      }
    },
};

export default adminFacultyController;

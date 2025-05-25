import express from "express";
import { isAuthorized, isAdmin } from '../middlewares/auth.js';
import adminController from '../controllers/admin.controller.js';

const router = express.Router();

router.use(isAuthorized);

// Dashboard endpoints
router.post("/getFaculty", isAdmin, adminController.getFaculty); // Used by: Admin/ManageUser.jsx (line 82) - for faculty management
router.post("/getStudents", isAdmin, adminController.getStudents); // Used by: Admin/ManageUser.jsx (line 93) - for student management

// User management endpoints
router.post("/deleteFaculty", isAdmin, adminController.deleteFaculty); // Used by: Admin/ManageUser.jsx (for deleting faculty)
router.post("/removeStudent", isAdmin, adminController.removeStudent); // Used by: Admin/ManageUser.jsx (for removing students)

// Metadata endpoints for dropdowns
router.get("/branches", isAdmin, adminController.getAllBranches); // Used for branch dropdown options (not directly visible in current components)
router.get("/batches", isAdmin, adminController.getAllBatche); // Used for batch dropdown options (not directly visible in current components)

// User editing endpoints
router.post("/editFaculty/:userID", isAdmin, adminController.editfaculty); // Used for faculty editing (not directly visible in current components)
router.post("/editStudent/:userID", isAdmin, adminController.editstudent); // Used for student editing (not directly visible in current components)

export default router;
import express from "express";
import { isAuthorized, isAdmin } from '../middlewares/auth.js';
import adminFacultyController from '../controllers/admin.faculty.controller.js';

const router = express.Router();

router.use(isAuthorized);

// Faculty management endpoints
router.route("/get-faculty-by-admin").post(isAdmin, adminFacultyController.getFaculty);
router.route("/deleteFaculty").delete(isAdmin, adminFacultyController.deleteFaculty);
router.route("/create-faculty").post(isAdmin, adminFacultyController.createFaculty);
router.route("/bulk-create-faculty").post(isAdmin, adminFacultyController.bulkCreateFaculty);

// Student management endpoints
router.route("/bulk-student-register").post(isAdmin, adminFacultyController.BulkStudentRequests);
router.route("/student-register").post(isAdmin, adminFacultyController.registerStudent);
router.route("/get-students").post(isAdmin, adminFacultyController.getStudents);
router.route("/remove-student/:userId").delete(isAdmin, adminFacultyController.removeStudent);

export default router;

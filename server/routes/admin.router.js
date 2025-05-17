import express from "express";
import { isAuthorized, isAdmin } from '../middlewares/auth.js';
import adminController from '../controllers/admin.controller.js';

const router = express.Router();

router.use(isAuthorized);

// Faculty management endpoints
router.route("/get-pending-users").get(isAdmin, adminController.getPendingRequest);
router.route("/accept-request").post(isAdmin, adminController.acceptRequest);
router.route("/accept-all-requests").post(isAdmin, adminController.acceptAllRequests);
router.route("/decline-request").post(isAdmin, adminController.declineRequest);
router.route("/decline-all-requests").post(isAdmin, adminController.declineAllRequests);
router.route("/get-faculty-by-admin").post(isAdmin, adminController.getFaculty);
router.route("/deleteFaculty").delete(isAdmin, adminController.deleteFaculty);
router.route("/create-faculty").post(isAdmin, adminController.createFaculty);
router.route("/bulk-create-faculty").post(isAdmin, adminController.bulkCreateFaculty);

// Student management endpoints
router.route("/bulk-student-register").post(isAdmin, adminController.BulkStudentRequests);
router.route("/get-students").post(isAdmin, adminController.getStudents);
router.route("/remove-student/:userId").delete(isAdmin, adminController.removeStudent);

// Dashboard endpoints
router.route("/dashboard-stats").get(isAdmin, adminController.getDashboardStats);

export default router;
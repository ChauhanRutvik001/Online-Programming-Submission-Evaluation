import express from "express";
import { isAuthorized, isAdmin } from '../middlewares/auth.js';
import adminController from '../controllers/admin.controller.js';

const router = express.Router();

router.use(isAuthorized);

// Faculty management endpoints
router.route("/get-faculty-by-admin").post(isAdmin, adminController.getFaculty);
router.route("/deleteFaculty").delete(isAdmin, adminController.deleteFaculty);
router.route("/create-faculty").post(isAdmin, adminController.createFaculty);
router.route("/bulk-create-faculty").post(isAdmin, adminController.bulkCreateFaculty);

// Student management endpoints
router.route("/bulk-student-register").post(isAdmin, adminController.BulkStudentRequests);
router.route("/student-register").post(isAdmin, adminController.registerStudent);
router.route("/get-students").post(isAdmin, adminController.getStudents);
router.route("/remove-student/:userId").delete(isAdmin, adminController.removeStudent);

// Batch management endpoints
router.route("/batches").post(isAdmin, adminController.createBatch);
router.route("/batches").get(isAdmin, adminController.getAllBatches);
router.route("/batches/:batchId").get(isAdmin, adminController.getBatchById);
router.route("/batches/:batchId").put(isAdmin, adminController.updateBatch);
router.route("/batches/:batchId").delete(isAdmin, adminController.deleteBatch);
router.route("/batches/:batchId/students").post(isAdmin, adminController.addStudentsToBatch);
router.route("/batches/:batchId/students").delete(isAdmin, adminController.removeStudentsFromBatch);
router.route("/faculty/:facultyId/batches").get(isAdmin, adminController.getBatchesByFaculty);

// Dashboard endpoints
router.route("/dashboard-stats").get(isAdmin, adminController.getDashboardStats);

export default router;
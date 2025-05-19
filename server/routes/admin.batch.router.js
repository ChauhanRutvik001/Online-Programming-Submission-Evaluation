import express from "express";
import { isAuthorized, isAdmin } from '../middlewares/auth.js';
import adminBatchController from '../controllers/admin.batch.controller.js';
import adminController from '../controllers/admin.controller.js';

const router = express.Router();

router.use(isAuthorized);

// Batch management endpoints
router.route("/batches").post(isAdmin, adminBatchController.createBatch);
router.route("/batches").get(isAdmin, adminBatchController.getAllBatches);
router.route("/batches/:batchId").get(isAdmin, adminBatchController.getBatchById);
router.route("/batches/:batchId").put(isAdmin, adminBatchController.updateBatch);
router.route("/batches/:batchId").delete(isAdmin, adminBatchController.deleteBatch);
router.route("/batches/:batchId/students").post(isAdmin, adminBatchController.addStudentsToBatch);
router.route("/batches/:batchId/students").delete(isAdmin, adminBatchController.removeStudentsFromBatch);
router.route("/faculty/:facultyId/batches").get(isAdmin, adminBatchController.getBatchesByFaculty);

// Dashboard endpoints
router.route("/dashboard-stats").get(isAdmin, adminBatchController.getDashboardStats);
router.route("/dashboard-users").get(isAdmin, adminController.getusers);


export default router;

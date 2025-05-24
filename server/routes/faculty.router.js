import express from "express";
import { isAdmin, isAdminOrFaculty, isAuthorized, isFaculty } from "../middlewares/auth.js";
import facultyController from "../controllers/faculty.controller.js";

const router = express.Router();

router
  .route("/get-students-by-faculty")
  .post(isAuthorized,isAdminOrFaculty, facultyController.getStudents);
router
  .route("/expire-session")
  .post(isAuthorized,isAdminOrFaculty, facultyController.expireSession);
router
  .route("/remove-user/:userId")
  .delete(isAuthorized, isFaculty, facultyController.removeUser);

// Batch management endpoints for faculty
router.route("/batches")
  .get(isAuthorized, isFaculty, facultyController.getMyBatches);
router.route("/my-batches")
  .get(isAuthorized, isFaculty, facultyController.getMyBatches);
router.route("/batches/:batchId")
  .get(isAuthorized, isFaculty, facultyController.getBatchDetails);
router.route("/batches/:batchId/progress")
  .get(isAuthorized, isFaculty, facultyController.getBatchProgress);

export default router;
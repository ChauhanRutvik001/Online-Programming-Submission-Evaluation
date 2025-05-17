import express from "express";
import { isAdmin, isAdminOrFaculty, isAuthorized, isFaculty } from "../middlewares/auth.js";
import facultyController from "../controllers/faculty.controller.js";

const router = express.Router();

// Pending request routes
router
  .route("/get-pending-users")
  .get(isAuthorized, isFaculty, facultyController.getPendingRequest);
router
  .route("/accept-request")
  .post(isAuthorized, isFaculty, facultyController.acceptRequest);
router
  .route("/accept-all-requests")
  .post(isAuthorized, isFaculty, facultyController.acceptAllRequests);
router
  .route("/decline-request")
  .post(isAuthorized, isFaculty, facultyController.declineRequest);
router
  .route("/decline-all-requests")
  .post(isAuthorized, isFaculty, facultyController.declineAllRequests);
router
  .route("/bulk-register")
  .post(isAuthorized, isFaculty, facultyController.BulkRequests);
router
  .route("/get-students-by-faculty")
  .post(isAuthorized,isAdminOrFaculty, facultyController.getStudents);
router
  .route("/expire-session")
  .post(isAuthorized,isAdminOrFaculty, facultyController.expireSession);
router
  .route("/remove-user/:userId")
  .delete(isAuthorized, isFaculty, facultyController.removeUser);

export default router;
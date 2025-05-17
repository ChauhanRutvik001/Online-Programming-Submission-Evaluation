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

export default router;
import express from "express";
import {  isAdminOrFaculty, isAuthorized } from "../middlewares/auth.js";
import {
  // createSubmission,
  getUserSubmissions,
  getAllSubmissionsForProblem,
  getAllSubmissionsForAnalytics,
  getAllSubmissionsForUser,
  getSubmissionById,
} from "../controllers/submission.controller.js";

const router = express.Router();
router.use(isAuthorized);

router.get("/", getUserSubmissions);
router.get("/problem",isAdminOrFaculty, getAllSubmissionsForProblem);
router.get("/problem/analytics",isAdminOrFaculty, getAllSubmissionsForAnalytics);
router.get("/user/submissions", getAllSubmissionsForUser);
router.get("/:id", getSubmissionById);
// router.post("/", createSubmission);

export default router;



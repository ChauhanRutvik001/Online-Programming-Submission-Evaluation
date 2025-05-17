import express from "express";
import {
  createContest,
  getAllContests,
  getContestById,
  updateContest,
  deleteContest,
  assignContestToStudents,
  getAssignedStudents,
  getUnassignedStudents,
  unassignContestToStudents,
  getContestDashboard,
} from "../controllers/contestController.js";
import {
  isAuthorized,
  isAdmin,
  isAdminOrFaculty,
} from "../middlewares/auth.js";

const router = express.Router();

// Middleware to ensure the user is authenticated
router.use(isAuthorized);

// Create a new contest
router.post("/create", isAdminOrFaculty, createContest);

// Get All Contests
router.get("/", getAllContests);

// Get Contest by ID
router.get("/:id", getContestById);

// Update Contest
router.put("/:id", isAdminOrFaculty, updateContest);

// Delete Contest
router.delete("/:id", isAdminOrFaculty, deleteContest);

//assignContestToStudents
router.post(
  "/:id/assignContestToStudents",
  isAdminOrFaculty,
  assignContestToStudents
);

//assignContestToStudents list
router.get("/:id/getAssignedStudents", isAdminOrFaculty, getAssignedStudents);

//unassigned students list
router.get("/:id/unassignedStudents", isAdminOrFaculty, getUnassignedStudents);

//unassignContestToStudents
router.post(
  "/:id/unassignContestToStudents",
  isAdminOrFaculty,
  unassignContestToStudents
);

router.get(
  "/:id/dashboard",
  isAuthorized,
  isAdminOrFaculty,
  getContestDashboard
);

export default router;

import express from 'express';
import {
  createProblem,
  getProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
  assignProblemToStudents,
  getProblemWithStudents,
  getStudents,
  getProblemWithUnassignedStudents,
  unassignStudents,
  getProblemByIdForUpdate
} from '../controllers/problem.controller.js';
import { isAdminOrFaculty, isAuthorized } from '../middlewares/auth.js';

const router = express.Router();
router.use(isAuthorized);

// Admin routes
router.post('/',  isAdminOrFaculty, createProblem);
router.put('/:id',  isAdminOrFaculty, updateProblem);
router.delete('/:id',  isAdminOrFaculty, deleteProblem);
router.get('/getStudents', isAdminOrFaculty, getStudents);
router.get('/getProblemByIdForUpdate/:id', isAdminOrFaculty, getProblemByIdForUpdate); //edit problem

//assign & unassign problem to student routes for admin & faculty only
router.post('/:id/assign', isAdminOrFaculty, assignProblemToStudents); //assign problem to students
router.get('/:id/students', isAdminOrFaculty, getProblemWithStudents); //get students assigned to a problem
router.get('/:id/unassignStudent', isAdminOrFaculty, getProblemWithUnassignedStudents); //get students unassigned to a problem
router.post('/:id/unassign-students', isAdminOrFaculty, unassignStudents); //unassign students from a problem


// Public routes
router.get('/', getProblems); //get all problems make problem list
router.get('/:id', getProblemById); //get problem by id for problem show

export default router;

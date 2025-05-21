import express from "express";
import { isAuthorized, isAdmin } from '../middlewares/auth.js';
import adminController from '../controllers/admin.controller.js';

const router = express.Router();

router.use(isAuthorized);

// Dashboard endpoints
router.post("/getFaculty", isAdmin, adminController.getFaculty);
router.post("/getStudents", isAdmin, adminController.getStudents);

router.post("/deleteFaculty", isAdmin, adminController.deleteFaculty); 
router.post("/removeStudent", isAdmin, adminController.removeStudent); 

// Optionally, for dropdowns (branches, batches)
router.get("/branches", isAdmin, adminController.getAllBranches);     
router.get("/batches", isAdmin, adminController.getAllBatche);        

router.post("/editFaculty/:userID", isAdmin, adminController.editfaculty);    
router.post("/editStudent/:userID", isAdmin, adminController.editstudent);     



export default router;
import express from "express";
import { isAuthorized, isAdmin } from '../middlewares/auth.js';
import adminController from '../controllers/admin.controller.js';

const router = express.Router();

router.use(isAuthorized);

// Dashboard endpoints
router.route("/dashboard-stats").get(isAdmin, adminController.getDashboardStats);

export default router;
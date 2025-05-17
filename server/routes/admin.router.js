import express from "express";
import { isAuthorized, isAdmin } from '../middlewares/auth.js';
import adminController from '../controllers/admin.controller.js';

const router = express.Router();

router.use(isAuthorized);

// peding request will be only accesible by the admin
router.route("/get-pending-users").get(isAdmin, adminController.getPendingRequest);
router.route("/accept-request").post(isAdmin, adminController.acceptRequest);
router.route("/accept-all-requests").post(isAdmin, adminController.acceptAllRequests);
router.route("/decline-request").post(isAdmin, adminController.declineRequest);
router.route("/decline-all-requests").post(isAdmin, adminController.declineAllRequests);
router.route("/get-faculty-by-admin").post(isAdmin, adminController.getFaculty);
router.route("/deleteFaculty").delete(isAdmin, adminController.getFaculty);

export default router;
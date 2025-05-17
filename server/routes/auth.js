import express from "express";
import { login, logout, verifyEmail, getCurrentUser, changePassword, fetchSubjects } from "../controllers/auth.js";

const router = express.Router();

router.route("/login").post(login);
router.route("/verify").get(verifyEmail);
router.route("/logout").get(logout);
router.route("/get-current-user").get(getCurrentUser);
router.route("/change-password").post(changePassword);
router.route("/fetch-subjects").get(fetchSubjects);
// forget password

export default router;
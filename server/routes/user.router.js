import express from "express";
import {
  updateUser,
  uploadProfilePic,
  getProfilePic,
  removeProfilePic,
} from "../controllers/user.controller.js";
import { isAuthorized } from "../middlewares/auth.js";
import studentBatchController from "../controllers/student.batch.controller.js";

import { upload } from "../utils/multer.utils.js"

const router = express.Router();


router.put("/update",isAuthorized, updateUser);

router.post('/upload-avatar', isAuthorized, upload.single('avatar'), uploadProfilePic);

router.get('/profile/upload-avatar', isAuthorized, getProfilePic);

router.delete('/profile/remove-profile-pic', isAuthorized, removeProfilePic);

// Student batch routes
router.get('/my-batches', isAuthorized, studentBatchController.getMyBatches);
router.get('/batches/:batchId', isAuthorized, studentBatchController.getBatchDetails);
router.get('/batches/:batchId/problems', isAuthorized, studentBatchController.getBatchProblems);
router.get('/batches/:batchId/progress', isAuthorized, studentBatchController.getBatchProgress);

export default router;
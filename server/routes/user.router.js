import express from "express";
import {
  updateUser,
  uploadProfilePic,
  getProfilePic,
  removeProfilePic,
} from "../controllers/user.controller.js";
import { isAuthorized } from "../middlewares/auth.js";

import { upload } from "../utils/multer.utils.js"

const router = express.Router();


router.put("/update",isAuthorized, updateUser);

router.post('/upload-avatar', isAuthorized, upload.single('avatar'), uploadProfilePic);

router.get('/profile/upload-avatar', isAuthorized, getProfilePic);

router.delete('/profile/remove-profile-pic', isAuthorized, removeProfilePic);

export default router;
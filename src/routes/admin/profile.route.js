import express from "express";
import * as profileCtrl from "../../controllers/user/profile.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";
import upload from "../../config/multer.config.js";
import {
  setProfileImgPath,
  setProfileFilename,
} from "../../middlewares/multer.middleware.js";

const router = express.Router();

// Profile routes
router
  .route("/")
  .get(verifyToken, profileCtrl.getProfile)
  .patch(
    verifyToken,
    setProfileImgPath,
    setProfileFilename,
    upload.single("profileImg"),
    profileCtrl.updateProfile
  );

export default router;

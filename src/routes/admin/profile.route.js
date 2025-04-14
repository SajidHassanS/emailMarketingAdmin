import express from "express";
import * as profileCtrl from "../../controllers/user/profile.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";
import upload from "../../config/multer.config.js";
import { setProfileImgPath } from "../../middlewares/multer.middleware.js";

const router = express.Router();

// Profile routes
router
    .route("/")
    .get(verifyToken, profileCtrl.getProfile)
    .patch(verifyToken, setProfileImgPath, upload.single("profileImg"), profileCtrl.updateProfile);

export default router;
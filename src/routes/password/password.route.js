import express from "express";
import * as passwordCtrl from "../../controllers/password/password.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";
import upload from "../../config/multer.config.js";
import { setProfileImgPath } from "../../middlewares/multer.middleware.js";

const router = express.Router();

// Profile routes
router
    .route("/")
    // .get(verifyToken, passwordCtrl.getProfile)
    .post(verifyToken, passwordCtrl.addPassword)
    .patch(verifyToken, passwordCtrl.updatePasswords);

router
    .route("/bulk-add")
    .post(verifyToken, passwordCtrl.addBulkPasswords)

export default router;
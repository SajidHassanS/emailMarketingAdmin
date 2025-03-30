import express from "express";
import * as emailCtrl from "../../controllers/email/email.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Email routes
router.route("/").get(verifyToken, emailCtrl.getAllEmails); // Get all email

export default router;

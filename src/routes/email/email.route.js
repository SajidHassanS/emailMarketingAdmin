import express from "express";
import * as emailCtrl from "../../controllers/email/email.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Email routes
router.route("/all").get(verifyToken, emailCtrl.getAllEmails); // Get all email

router
  .route("/")
  .get(verifyToken, emailCtrl.getAllEmails) // Temporary Get all email
  .patch(verifyToken, emailCtrl.updateEmailStatus); // Update email

router
  .route("/bulk-update")
  .patch(verifyToken, emailCtrl.bulkUpdateEmailStatusByUuids); // Bulk update email's status

router.route("/stats").get(verifyToken, emailCtrl.getEmailStats); // Email stats

router
  .route("/duplicate/all")
  .get(verifyToken, emailCtrl.getAllDuplicateEmails); // Get all duplicate emails
export default router;

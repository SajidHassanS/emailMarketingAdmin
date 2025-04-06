import express from "express";
import * as systemSettingCtrl from "../../controllers/systemSetting/systemSetting.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Email routes
router
  .route("/email-reward")
  .get(verifyToken, systemSettingCtrl.getDefaultEmailReward)
  .post(verifyToken, systemSettingCtrl.setDefaultEmailReward)
  .patch(verifyToken, systemSettingCtrl.setDefaultEmailReward); // Get all email

// router
//   .route("/")
//   .get(verifyToken, systemSettingCtrl.getAllEmails) // Temporary Get all email
//   .patch(verifyToken, systemSettingCtrl.updateEmailStatus); // Update email

// router
//   .route("/bulk-update")
//   .patch(verifyToken, systemSettingCtrl.bulkUpdateEmailStatusByUuids); // Bulk update email's status

// router.route("/stats").get(verifyToken, systemSettingCtrl.getEmailStats); // Email stats

// router
//   .route("/duplicate/all")
//   .get(verifyToken, systemSettingCtrl.getAllDuplicateEmails); // Get all duplicate emails
export default router;

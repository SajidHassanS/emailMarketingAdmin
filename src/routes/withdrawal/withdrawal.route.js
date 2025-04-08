import express from "express";
import * as withdrawalCtrl from "../../controllers/withdrawal/withdrawal.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Withdrawal routes
router.route("/all").get(verifyToken, withdrawalCtrl.getAllWithdrawals); // Get all withdrawal requests

router.route("/approve").patch(verifyToken, withdrawalCtrl.approveWithdrawal); // approve pending withdrawal request

router.route("/reject").patch(verifyToken, withdrawalCtrl.rejectWithdrawal); // reject pending withdrawal request

router.route("/stats").get(verifyToken, withdrawalCtrl.getwithdrawalStats); // get withdrawal stats

// router.route("/bonus/all").get(verifyToken, withdrawalCtrl.getAllWithdrawals); // Get all bonus withdrawal requests

router.route("/bonus").patch(verifyToken, withdrawalCtrl.approveRejectBonusWithdrawal); // approve/reject pending bonus withdrawal request

// router
//   .route("/")
//   .get(verifyToken, withdrawalCtrl.getAllEmails) // Temporary Get all email
//   .patch(verifyToken, withdrawalCtrl.updateEmailStatus); // Update email

// router
//   .route("/bulk-update")
//   .patch(verifyToken, withdrawalCtrl.bulkUpdateEmailStatusByUuids); // Bulk update email's status

// router.route("/stats").get(verifyToken, withdrawalCtrl.getEmailStats); // Email stats

// router
//   .route("/duplicate/all")
//   .get(verifyToken, withdrawalCtrl.getAllDuplicateEmails); // Get all duplicate emails
export default router;

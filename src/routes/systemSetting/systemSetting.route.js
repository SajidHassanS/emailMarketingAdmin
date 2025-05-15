import express from "express";
import * as systemSettingCtrl from "../../controllers/systemSetting/systemSetting.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Email routes
router
  .route("/email-reward")
  .get(verifyToken, systemSettingCtrl.getDefaultEmailReward)
  .post(verifyToken, systemSettingCtrl.setDefaultEmailReward)
  .patch(verifyToken, systemSettingCtrl.setDefaultEmailReward);

router
  .route("/withdrawal-threshold")
  .get(verifyToken, systemSettingCtrl.getReferralWithdrawalThreshold)
  .post(verifyToken, systemSettingCtrl.setReferralWithdrawalThreshold)
  .patch(verifyToken, systemSettingCtrl.setReferralWithdrawalThreshold);

router
  .route("/signup-bonus")
  .get(verifyToken, systemSettingCtrl.getDefaultSignupBonus)
  .post(verifyToken, systemSettingCtrl.setDefaultSignupBonus)
  .patch(verifyToken, systemSettingCtrl.setDefaultSignupBonus);

router
  .route("/referral-bonus")
  .get(verifyToken, systemSettingCtrl.getDefaultReferralBonus)
  .post(verifyToken, systemSettingCtrl.setDefaultReferralBonus)
  .patch(verifyToken, systemSettingCtrl.setDefaultReferralBonus);

router
  .route("/withdrawal-threshold-per-day")
  .get(verifyToken, systemSettingCtrl.getReferralWithdrawalThresholdPerDay)
  .post(verifyToken, systemSettingCtrl.setReferralWithdrawalThresholdPerDay)
  .patch(verifyToken, systemSettingCtrl.setReferralWithdrawalThresholdPerDay);

router
  .route("/withdrawal-threshold-per-week")
  .get(verifyToken, systemSettingCtrl.getReferralWithdrawalThresholdPerWeek)
  .post(verifyToken, systemSettingCtrl.setReferralWithdrawalThresholdPerWeek)
  .patch(verifyToken, systemSettingCtrl.setReferralWithdrawalThresholdPerWeek);

export default router;

import models from "../../models/models.js";
const { SystemSetting } = models;
import { bodyReqFields } from "../../utils/requiredFields.js";
import {
  catchError,
  frontError,
  successOk,
  successOkWithData,
} from "../../utils/responses.js";

export async function getDefaultEmailReward(req, res) {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: "default_email_reward" },
    });

    const reward = setting ? parseInt(setting.value) : 20; // fallback to 20
    return successOkWithData(
      res,
      "Default email reward fetched successfully.",
      { defaultEmailReward: reward }
    );
  } catch (error) {
    console.log("Error fetching email reward: ", error);
    return catchError(res, error);
  }
}

export async function setDefaultEmailReward(req, res) {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["reward"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { reward } = req.body;

    if (isNaN(reward) || reward < 0) {
      return frontError(res, "Reward must be a valid positive number.");
    }

    // Create or update the reward
    const [setting, created] = await SystemSetting.findOrCreate({
      where: { key: "default_email_reward" },
      defaults: { value: reward.toString() },
    });

    if (!created) {
      setting.value = reward.toString();
      await setting.save();
    }

    return successOk(res, `Default email reward set to ${reward}`);
  } catch (error) {
    console.log("Error setting email reward: ", error);
    return catchError(res, error);
  }
}

export async function getReferralWithdrawalThreshold(req, res) {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: "referral_withdrawal_threshold" },
    });

    const threshold = setting ? parseInt(setting.value) : 100; // fallback to 100 if not found
    return successOkWithData(
      res,
      "Referral withdrawal threshold fetched successfully.",
      { referralWithdrawalThreshold: threshold }
    );
  } catch (error) {
    console.log("Error fetching referral withdrawal threshold: ", error);
    return catchError(res, error);
  }
}

export async function setReferralWithdrawalThreshold(req, res) {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["threshold"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { threshold } = req.body;

    if (isNaN(threshold) || threshold <= 0) {
      return frontError(res, "Threshold must be a valid positive number.");
    }

    // Create or update the threshold value
    const [setting, created] = await SystemSetting.findOrCreate({
      where: { key: "referral_withdrawal_threshold" },
      defaults: { value: threshold.toString() },
    });

    if (!created) {
      setting.value = threshold.toString();
      await setting.save();
    }

    return successOk(res, `Referral withdrawal threshold set to ${threshold}`);
  } catch (error) {
    console.log("Error setting referral withdrawal threshold: ", error);
    return catchError(res, error);
  }
}

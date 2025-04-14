import models from "../../models/models.js";
const { SystemSetting } = models;
import { bodyReqFields } from "../../utils/requiredFields.js";
import {
  catchError,
  frontError,
  notFound,
  successOk,
  successOkWithData,
} from "../../utils/responses.js";

// ========================= Get Email Reward ============================

export async function getDefaultEmailReward(req, res) {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: "default_email_reward" },
    });

    if (!setting) return notFound(res, "No email reward found.")

    const reward = parseInt(setting.value);

    if (isNaN(reward)) {
      return notFound(res, "Invalid email reward value.");
    }
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

// ========================= Add/Update Email Reward ============================

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

    return successOk(res, `Default email reward set to ${reward}.`);
  } catch (error) {
    console.log("Error setting email reward: ", error);
    return catchError(res, error);
  }
}

// ======================= Get Withdrawal Threshold ==========================

export async function getReferralWithdrawalThreshold(req, res) {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: "referral_withdrawal_threshold" },
    });

    if (!setting) return notFound(res, "No withdrawal threshold found.")

    const threshold = parseInt(setting.value);

    if (isNaN(threshold)) {
      return notFound(res, "Invalid withdrawal threshold value.");
    }

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

// ======================= Add/Update Withdrawal Threshold ==========================

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

    return successOk(res, `Referral withdrawal threshold set to ${threshold}.`);
  } catch (error) {
    console.log("Error setting referral withdrawal threshold: ", error);
    return catchError(res, error);
  }
}

// ========================= Get Signup Bonus ============================

export async function getDefaultSignupBonus(req, res) {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: "default_signup_bonus" },
    });

    if (!setting) return notFound(res, "No signup bonus found.")

    const bonus = parseInt(setting.value);

    if (isNaN(bonus)) {
      return notFound(res, "Invalid signup bonus value.");
    }

    return successOkWithData(
      res,
      "Default signup bonus fetched successfully.",
      { defaultSignupBonus: bonus }
    );
  } catch (error) {
    console.log("Error fetching signup bonus: ", error);
    return catchError(res, error);
  }
}

// ========================= Add/Update Signup Bonus ============================

export async function setDefaultSignupBonus(req, res) {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["bonus"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { bonus } = req.body;

    if (isNaN(bonus) || bonus < 0) {
      return frontError(res, "Bonus must be a valid positive number.");
    }

    const [setting, created] = await SystemSetting.findOrCreate({
      where: { key: "default_signup_bonus" },
      defaults: { value: bonus.toString() },
    });

    if (!created) {
      setting.value = bonus.toString();
      await setting.save();
    }

    return successOk(res, `Default signup bonus set to ${bonus}.`);
  } catch (error) {
    console.log("Error setting signup bonus: ", error);
    return catchError(res, error);
  }
}

// ========================= Get Referral Bonus ============================

export async function getDefaultReferralBonus(req, res) {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: "default_referral_bonus" },
    });

    if (!setting) return notFound(res, "No referral bonus found.")

    const bonus = parseInt(setting.value);

    if (isNaN(bonus)) {
      return notFound(res, "Invalid referral bonus value.");
    }

    return successOkWithData(
      res,
      "Default referral bonus fetched successfully.",
      { defaultReferralBonus: bonus }
    );
  } catch (error) {
    console.log("Error fetching referral bonus: ", error);
    return catchError(res, error);
  }
}

// ========================= Add/Update Referral Bonus ============================

export async function setDefaultReferralBonus(req, res) {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["bonus"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { bonus } = req.body;

    if (isNaN(bonus) || bonus < 0) {
      return frontError(res, "Bonus must be a valid positive number.");
    }

    const [setting, created] = await SystemSetting.findOrCreate({
      where: { key: "default_referral_bonus" },
      defaults: { value: bonus.toString() },
    });

    if (!created) {
      setting.value = bonus.toString();
      await setting.save();
    }

    return successOk(res, `Default referral bonus set to ${bonus}.`);
  } catch (error) {
    console.log("Error setting referral bonus: ", error);
    return catchError(res, error);
  }
}

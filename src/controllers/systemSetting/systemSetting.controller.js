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

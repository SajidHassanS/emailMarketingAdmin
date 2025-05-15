import { Op } from "sequelize";
import models from "../../models/models.js";
import {
  catchError,
  frontError,
  notFound,
  successOk,
  successOkWithData,
} from "../../utils/responses.js";
import { bodyReqFields, queryReqFields } from "../../utils/requiredFields.js";
const { MarqueeMessage } = models;

export const getAllMarqueeMessages = async (req, res) => {
  try {
    const messages = await MarqueeMessage.findAll({
      where: { isEnabled: true },
      order: [["order", "ASC"]],
    });

    return successOkWithData(
      res,
      "Marquee messages fetched successfully.",
      messages
    );
  } catch (err) {
    console.error("getAllMarqueeMessages error:", err);
    return catchError(res, err);
  }
};

export const createMarqueeMessage = async (req, res) => {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["message"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { message, isEnabled = true } = req.body;

    const maxOrderMessage = await MarqueeMessage.findOne({
      order: [["order", "DESC"]],
    });

    const newOrder = maxOrderMessage ? maxOrderMessage.order + 1 : 0;

    const newMessage = await MarqueeMessage.create({
      message,
      order: newOrder,
      isEnabled,
    });

    return successOkWithData(res, "Marquee message created.", newMessage);
  } catch (err) {
    console.error("createMarqueeMessage error:", err);
    return catchError(res, err);
  }
};

export const updateMarqueeMessage = async (req, res) => {
  try {
    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid } = req.query;

    const { message, isEnabled } = req.body;

    if (message === undefined && isEnabled === undefined) {
      return frontError(res, "Provide 'message' or 'isEnabled' to update.");
    }

    const found = await MarqueeMessage.findByPk(uuid);
    console.log("found", found);
    if (!found) return frontError(res, "Invalid uuid.", "uuid");

    const changes = [];

    if (message !== undefined && message !== found.message) {
      found.message = message;
      changes.push("message");
    }

    if (isEnabled !== undefined && isEnabled !== found.isEnabled) {
      found.isEnabled = isEnabled;
      changes.push(isEnabled ? "enabled" : "disabled");
    }

    if (changes.length === 0) {
      return frontError(res, "No changes detected.");
    }

    await found.save();

    let responseMessage = "";

    if (changes.includes("message") && changes.includes("enabled")) {
      responseMessage = `Marquee message updated and ${
        isEnabled ? "enabled" : "disabled"
      }.`;
    } else if (changes.includes("message")) {
      responseMessage = "Live marquee message updated.";
    } else if (changes.includes("enabled") || changes.includes("disabled")) {
      responseMessage = `Marquee message ${
        isEnabled ? "enabled" : "disabled"
      }.`;
    }

    return successOkWithData(res, responseMessage, found);
  } catch (err) {
    console.error("updateMarqueeMessage error:", err);
    return catchError(res, err);
  }
};

export const deleteMarqueeMessage = async (req, res) => {
  try {
    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid } = req.query;

    const found = await MarqueeMessage.findByPk(uuid);
    if (!found) return frontError(res, "Invalid uuid.", "uuid");

    await found.destroy();
    return successOkWithData(res, "Marquee message deleted.");
  } catch (err) {
    console.error("deleteMarqueeMessage error:", err);
    return catchError(res, err);
  }
};

export const reorderMarqueeMessages = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request data." });
    }

    const updatePromises = ids.map((id, index) =>
      MarqueeMessage.update({ order: index }, { where: { id } })
    );

    await Promise.all(updatePromises);

    return successOkWithData(res, "Marquee messages order updated.");
  } catch (err) {
    console.error("reorderMarqueeMessages error:", err);
    return catchError(res, err);
  }
};

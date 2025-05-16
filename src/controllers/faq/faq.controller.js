import models from "../../models/models.js";
import {
  catchError,
  frontError,
  successOk,
  successOkWithData,
} from "../../utils/responses.js";
import { bodyReqFields, queryReqFields } from "../../utils/requiredFields.js";
const { FAQ } = models;

export const getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.findAll({ order: [["order", "ASC"]] });
    return successOkWithData(res, "All FAQs fetched.", faqs);
  } catch (err) {
    console.error("getAllFAQs error:", err);
    return catchError(res, err);
  }
};

export const addFAQ = async (req, res) => {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["question", "answer"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { question, answer, isEnabled = true } = req.body;

    const maxOrderFAQ = await FAQ.findOne({
      order: [["order", "DESC"]],
    });

    const newOrder = maxOrderFAQ ? maxOrderFAQ.order + 1 : 0;

    await FAQ.create({ question, answer, order: newOrder, isEnabled });

    return successOk(res, "FAQ added successfully.");
  } catch (err) {
    console.error("addFAQ error:", err);
    return catchError(res, err);
  }
};

export const updateFAQ = async (req, res) => {
  try {
    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid } = req.query;
    const { question, answer, isEnabled } = req.body;

    if (
      question === undefined &&
      answer === undefined &&
      isEnabled === undefined
    ) {
      return frontError(
        res,
        "Provide 'question', 'answer', or 'isEnabled' to update."
      );
    }

    const faq = await FAQ.findByPk(uuid);
    if (!faq) return frontError(res, "Invalid uuid.", "uuid");

    const changes = [];

    if (question !== undefined && question !== faq.question) {
      faq.question = question;
      changes.push("question");
    }

    if (answer !== undefined && answer !== faq.answer) {
      faq.answer = answer;
      changes.push("answer");
    }

    if (isEnabled !== undefined && isEnabled !== faq.isEnabled) {
      faq.isEnabled = isEnabled;
      changes.push(isEnabled ? "enabled" : "disabled");
    }

    if (changes.length === 0) {
      return frontError(res, "No changes detected.");
    }

    await faq.save();

    // Build response message
    let responseMessage = "";

    if (changes.includes("question") || changes.includes("answer")) {
      if (changes.includes("enabled") || changes.includes("disabled")) {
        responseMessage = `FAQ updated and ${
          isEnabled ? "enabled" : "disabled"
        }.`;
      } else {
        responseMessage = "FAQ content updated.";
      }
    } else if (changes.includes("enabled") || changes.includes("disabled")) {
      responseMessage = `FAQ ${faq.isEnabled ? "enabled" : "disabled"}.`;
    }

    return successOkWithData(res, responseMessage, faq);
  } catch (err) {
    console.error("updateFAQ error:", err);
    return catchError(res, err);
  }
};

export const deleteFAQ = async (req, res) => {
  try {
    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid } = req.query;
    const deleted = await FAQ.destroy({ where: { uuid } });

    if (!deleted) return frontError(res, "Invalid FAQ UUID.", "uuid");

    return successOk(res, "FAQ deleted.");
  } catch (err) {
    console.error("deleteFAQ error:", err);
    return catchError(res, err);
  }
};

export const reorderFAQs = async (req, res) => {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["uuids"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { uuids } = req.body;

    if (!Array.isArray(uuids) || uuids.length === 0)
      return validationError(res, "No UUIDs provided.");

    // Validate that all provided UUIDs exist
    const foundFAQs = await FAQ.findAll({
      where: { uuid: uuids },
    });

    if (foundFAQs.length !== uuids.length) {
      return frontError(res, "Some UUIDs are invalid.", "uuids");
    }

    const updatePromises = uuids.map((uuid, index) =>
      FAQ.update({ order: index }, { where: { uuid } })
    );

    await Promise.all(updatePromises);

    return successOk(res, "FAQs reordered successfully.");
  } catch (err) {
    console.error("reorderFAQs error:", err);
    return catchError(res, err);
  }
};

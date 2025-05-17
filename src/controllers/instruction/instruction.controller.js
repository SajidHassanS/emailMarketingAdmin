import models from "../../models/models.js";
import {
  catchError,
  frontError,
  successOk,
  successOkWithData,
} from "../../utils/responses.js";
import { bodyReqFields, queryReqFields } from "../../utils/requiredFields.js";
const { Instruction } = models;

export const getAllInstructions = async (req, res) => {
  try {
    const instructions = await Instruction.findAll({ order: [["order", "ASC"]] });
    return successOkWithData(res, "All Instructions fetched.", instructions);
  } catch (err) {
    console.error("getAllInstructions error:", err);
    return catchError(res, err);
  }
};

export const addInstruction = async (req, res) => {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["title", "description"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { title, description, isEnabled = true } = req.body;

    const maxOrderInstruction = await Instruction.findOne({
      order: [["order", "DESC"]],
    });

    const newOrder = maxOrderInstruction ? maxOrderInstruction.order + 1 : 0;

    await Instruction.create({ title, description, order: newOrder, isEnabled });

    return successOk(res, "Instruction added successfully.");
  } catch (err) {
    console.error("addInstruction error:", err);
    return catchError(res, err);
  }
};

export const updateInstruction = async (req, res) => {
  try {
    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid } = req.query;
    const { title, description, isEnabled } = req.body;

    if (
      title === undefined &&
      description === undefined &&
      isEnabled === undefined
    ) {
      return frontError(
        res,
        "Provide 'title', 'description', or 'isEnabled' to update."
      );
    }

    const instruction = await Instruction.findByPk(uuid);
    if (!instruction) return frontError(res, "Invalid uuid.", "uuid");

    const changes = [];

    if (title !== undefined && title !== instruction.title) {
      instruction.title = title;
      changes.push("title");
    }

    if (description !== undefined && description !== instruction.description) {
      instruction.description = description;
      changes.push("description");
    }

    if (isEnabled !== undefined && isEnabled !== instruction.isEnabled) {
      instruction.isEnabled = isEnabled;
      changes.push(isEnabled ? "enabled" : "disabled");
    }

    if (changes.length === 0) {
      return frontError(res, "No changes detected.");
    }

    await instruction.save();

    // Build response message
    let responseMessage = "";

    if (changes.includes("title") || changes.includes("description")) {
      if (changes.includes("enabled") || changes.includes("disabled")) {
        responseMessage = `Instruction updated and ${isEnabled ? "enabled" : "disabled"
          }.`;
      } else {
        responseMessage = "Instruction content updated.";
      }
    } else if (changes.includes("enabled") || changes.includes("disabled")) {
      responseMessage = `Instruction ${instruction.isEnabled ? "enabled" : "disabled"}.`;
    }

    return successOkWithData(res, responseMessage, instruction);
  } catch (err) {
    console.error("updateInstruction error:", err);
    return catchError(res, err);
  }
};

export const deleteInstruction = async (req, res) => {
  try {
    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid } = req.query;
    const deleted = await Instruction.destroy({ where: { uuid } });

    if (!deleted) return frontError(res, "Invalid Instruction UUID.", "uuid");

    return successOk(res, "Instruction deleted.");
  } catch (err) {
    console.error("deleteInstruction error:", err);
    return catchError(res, err);
  }
};

export const reorderInstructions = async (req, res) => {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["uuids"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { uuids } = req.body;

    if (!Array.isArray(uuids) || uuids.length === 0)
      return validationError(res, "No UUIDs provided.");

    // Validate that all provided UUIDs exist
    const foundInstructions = await Instruction.findAll({
      where: { uuid: uuids },
    });

    if (foundInstructions.length !== uuids.length) {
      return frontError(res, "Some UUIDs are invalid.", "uuids");
    }

    const updatePromises = uuids.map((uuid, index) =>
      Instruction.update({ order: index }, { where: { uuid } })
    );

    await Promise.all(updatePromises);

    return successOk(res, "Instructions reordered successfully.");
  } catch (err) {
    console.error("reorderInstructions error:", err);
    return catchError(res, err);
  }
};

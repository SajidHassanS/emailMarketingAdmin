import models from "../../models/models.js";
import {
  catchError,
  frontError,
  successOk,
  successOkWithData,
  validationError,
} from "../../utils/responses.js";
import { bodyReqFields, queryReqFields } from "../../utils/requiredFields.js";

const { Domain } = models;

// GET all domains
export const getAllDomains = async (req, res) => {
  try {
    const domains = await Domain.findAll({ order: [["created_at", "DESC"]] });
    return successOkWithData(res, "All domains fetched successfully.", domains);
  } catch (err) {
    console.error("getAllDomains error:", err);
    return catchError(res, err);
  }
};

// ADD new domain
export const addDomain = async (req, res) => {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["domain"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { domain, isEnabled = true } = req.body;

    // Ensure domain starts with "@"
    if (!domain.startsWith("@")) {
      return frontError(res, "Domain must start with '@'.", "domain");
    }

    const exists = await Domain.findOne({ where: { domain } });
    if (exists) return frontError(res, "Domain already exists.", "domain");

    await Domain.create({ domain, isEnabled });

    return successOk(res, "Domain added successfully.");
  } catch (err) {
    console.error("addDomain error:", err);
    return catchError(res, err);
  }
};

// UPDATE domain
export const updateDomain = async (req, res) => {
  try {
    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid } = req.query;
    const { domain, isEnabled } = req.body;

    const existing = await Domain.findByPk(uuid);
    if (!existing) return frontError(res, "Invalid domain UUID.", "uuid");

    const changes = [];

    if (domain && domain !== existing.domain) {
      // Ensure domain starts with "@"
      if (!domain.startsWith("@")) {
        return frontError(res, "Domain must start with '@'.", "domain");
      }
      existing.domain = domain;
      changes.push("domain");
    }

    if (isEnabled !== undefined && isEnabled !== existing.isEnabled) {
      existing.isEnabled = isEnabled;
      changes.push(isEnabled ? "enabled" : "disabled");
    }

    if (changes.length === 0)
      return frontError(res, "No changes detected to update.");

    await existing.save();

    return successOkWithData(res, "Domain updated successfully.", existing);
  } catch (err) {
    console.error("updateDomain error:", err);
    return catchError(res, err);
  }
};

// DELETE domain
export const deleteDomain = async (req, res) => {
  try {
    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid } = req.query;

    const deleted = await Domain.destroy({ where: { uuid } });

    if (!deleted) return frontError(res, "Invalid domain UUID.", "uuid");

    return successOk(res, "Domain deleted successfully.");
  } catch (err) {
    console.error("deleteDomain error:", err);
    return catchError(res, err);
  }
};

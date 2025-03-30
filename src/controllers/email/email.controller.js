import { Op } from "sequelize";
import {
  catchError,
  successOkWithData,
  notFound,
} from "../../utils/responses.js";
import models from "../../models/models.js";
const { User, Email } = models;

// ========================= Get All Emails ============================

export async function getAllEmails(req, res) {
  try {
    // const userUid = req.userUid;

    const {
      status,
      startDate,
      endDate,
      orderBy = "createdAt",
      order = "DESC",
      username,
    } = req.query;

    // Build the query conditions
    const whereCondition = {};

    // Apply status filter if provided
    if (status) {
      whereCondition.status = status;
    }

    // Apply date range filter (adjusted to cover the entire day)
    if (startDate) {
      whereCondition.createdAt = {
        [Op.gte]: new Date(`${startDate}T00:00:00.000Z`), // Start of the day
      };
    }
    if (endDate) {
      whereCondition.createdAt = {
        ...(whereCondition.createdAt || {}),
        [Op.lte]: new Date(`${endDate}T23:59:59.999Z`), // End of the day
      };
    }

    // Define user filter
    const userWhereCondition = {};
    if (username) {
      userWhereCondition.username = username;
    }

    // Fetch filtered and ordered emails
    const emails = await Email.findAll({
      where: whereCondition,
      order: [[orderBy, order.toUpperCase()]], // Ensure order is uppercase (ASC/DESC)
      include: [
        {
          model: User,
          as: "user",
          attributes: ["uuid", "username"],
          where: username ? userWhereCondition : undefined, // Apply filter only if username is provided
        },
      ],
    });

    if (!emails.length) return notFound(res, "No emails found.");

    return successOkWithData(res, "Profile fetched successfully", emails);
  } catch (error) {
    console.log("===== Error ===== : ", error);

    return catchError(res, error);
  }
}

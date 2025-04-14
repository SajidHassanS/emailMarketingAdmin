import { Op } from "sequelize";
import {
  catchError,
  successOkWithData,
  notFound,
  frontError,
  successOk,
} from "../../utils/responses.js";
import models from "../../models/models.js";
const { User, Email, Notification } = models;
import { bodyReqFields, queryReqFields } from "../../utils/requiredFields.js";
import DuplicateEmail from "../../models/email/duplicateEmail.model.js";
import SystemSetting from "../../models/systemSetting/systemSetting.model.js";
import { createNotification } from "../../utils/notificationUtils.js";

// ========================= Helping Function ============================

// export async function createNotification({
//   userUuid,
//   message,
//   title = null,
//   type = "info",
//   metadata = null,
// }) {
//   try {
//     // Create the notification in the database
//     const notification = await Notification.create({
//       userUuid,
//       message,
//       title,
//       type,
//       metadata,
//     });

//     return notification;
//   } catch (error) {
//     console.error("Error creating notification:", error);
//     throw new Error("Failed to create notification");
//   }
// }

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

// ========================= Update Email Status ============================

export async function updateEmailStatus(req, res) {
  try {
    // const userUid = req.userUid;

    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const reqBodyFields = bodyReqFields(req, res, ["status"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { uuid } = req.query;
    const { status, remarks = null } = req.body;

    // Ensure valid status
    const allowedStatuses = ["good", "bad", "pending"];
    if (!allowedStatuses.includes(status)) {
      return frontError(
        res,
        "Invalid status. Allowed values are: good, bad, pending"
      );
    }

    // Find email record
    const email = await Email.findOne({ where: { uuid } });
    if (!email) return frontError(res, "Invalid email UUID");

    let amount = 0;

    // If email is marked as good, assign reward
    if (status === "good") {
      const defaultReward = await SystemSetting.findOne({
        where: { key: "default_email_reward" },
      });

      amount = defaultReward ? parseInt(defaultReward.value) : 20;
    }

    // Update values
    await Email.update({ status, remarks, amount }, { where: { uuid } });

    // Send Notification
    await createNotification({
      userUuid: email.userUuid,
      title: "Email Status Updated",
      message: `The status of your email (${email.email}) has been changed to "${status}".`,
      type: "info",
      // metadata: {
      //   emailUuid: email.uuid,
      //   newStatus: status,
      //   remarks,
      // },
    });

    return successOk(res, "Email status updated successfully");
  } catch (error) {
    console.log("===== Error ===== : ", error);

    return catchError(res, error);
  }
}

// ===================== Bulk Update Email Status ===========================

export async function bulkUpdateEmailStatusByUuids(req, res) {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["uuids", "status"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { uuids, status, remarks = null } = req.body;

    if (!Array.isArray(uuids) || uuids.length === 0) {
      return frontError(res, "'uuids' must be a non-empty array.");
    }

    const allowedStatuses = ["good", "bad", "pending"];
    if (!allowedStatuses.includes(status)) {
      return frontError(
        res,
        "Invalid status. Allowed values are: good, bad, pending"
      );
    }

    // Fetch all emails with userUuid and email for notification
    const emails = await Email.findAll({
      where: { uuid: uuids },
      attributes: ["uuid", "email", "userUuid"],
    });

    const foundUuids = emails.map((e) => e.uuid);
    const invalidUuids = uuids.filter((id) => !foundUuids.includes(id));

    if (invalidUuids.length) {
      return frontError(res, `Invalid UUID(s): ${invalidUuids.join(", ")}`);
    }

    // Fetch reward only once
    let rewardAmount = 0;
    if (status === "good") {
      const defaultReward = await SystemSetting.findOne({
        where: { key: "default_email_reward" },
      });
      rewardAmount = defaultReward ? parseInt(defaultReward.value) : 20;
    }

    // Update each email individually with reward/amount
    for (const email of emails) {
      await Email.update(
        {
          status,
          remarks,
          amount: status === "good" ? rewardAmount : 0,
        },
        { where: { uuid: email.uuid } }
      );

      // Send Notification
      await createNotification({
        userUuid: email.userUuid,
        title: "Email Status Updated",
        message: `The status of your email (${email.email}) has been updated to "${status}".`,
        type: "info",
      });
    }

    return successOk(res, "Email statuses updated successfully");
  } catch (error) {
    console.log("===== Error ===== : ", error);
    return catchError(res, error);
  }
}

// ======================== Get Email Stats =================================

export async function getEmailStats(req, res) {
  try {
    const [pendingCount, goodCount, badCount, totalCount] = await Promise.all([
      Email.count({ where: { status: "pending" } }),
      Email.count({ where: { status: "good" } }),
      Email.count({ where: { status: "bad" } }),
      Email.count(),
    ]);

    const stats = {
      total: totalCount,
      pending: pendingCount,
      good: goodCount,
      bad: badCount,
    };

    return successOkWithData(res, "Email stats fetched successfully", stats);
  } catch (error) {
    console.error("===== Error fetching email stats ===== :", error);
    return catchError(res, error);
  }
}

// ===================== Get All Dulicate Emails ========================

export async function getAllDuplicateEmails(req, res) {
  try {
    // const userUid = req.userUid;

    const duplicates = await DuplicateEmail.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Email,
          as: "originalEmail",
          attributes: ["uuid", "email", "status", "fileName", "createdAt"],
        },
        {
          model: User,
          as: "uploader",
          attributes: ["uuid", "username"], // Add more user fields if needed
        },
      ],
    });

    if (!duplicates.length)
      return notFound(res, "No duplicate emails found for this user.");

    return successOkWithData(
      res,
      "Duplicate emails fetched successfully.",
      duplicates
    );
  } catch (error) {
    console.log("===== Error fetching duplicate emails ===== :", error);
    return catchError(res, error);
  }
}

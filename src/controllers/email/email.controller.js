import { Op } from "sequelize";
import {
  catchError,
  successOkWithData,
  notFound,
  frontError,
  successOk,
  validationError,
} from "../../utils/responses.js";
import models from "../../models/models.js";
const { User, Email, Notification } = models;
import { bodyReqFields, queryReqFields } from "../../utils/requiredFields.js";
import DuplicateEmail from "../../models/email/duplicateEmail.model.js";
import SystemSetting from "../../models/systemSetting/systemSetting.model.js";
import { createNotification } from "../../utils/notificationUtils.js";
import Password from "../../models/password/password.model.js";
import Admin from "../../models/admin/admin.model.js";
import { saveMessageToDB } from "../../utils/messageUtils.js"; // Assuming this is the file where you save messages

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

// export async function updateEmailStatus(req, res) {
//   try {
//     const reqQueryFields = queryReqFields(req, res, ["uuid"]);
//     if (reqQueryFields.error) return reqQueryFields.response;

//     const reqBodyFields = bodyReqFields(req, res, ["status"]);
//     if (reqBodyFields.error) return reqBodyFields.response;

//     const { uuid } = req.query;
//     const { status, remarks = null } = req.body;

//     // Ensure valid status
//     const allowedStatuses = ["good", "bad", "pending"];
//     if (!allowedStatuses.includes(status)) {
//       return frontError(
//         res,
//         "Invalid status. Allowed values are: good, bad, pending"
//       );
//     }

//     // Find email record
//     const email = await Email.findOne({ where: { uuid } });
//     if (!email) return frontError(res, "Invalid email UUID");

//     // let amount = 0;

//     // // If email is marked as good, assign reward
//     // if (status === "good") {
//     //   const defaultReward = await SystemSetting.findOne({
//     //     where: { key: "default_email_reward" },
//     //   });

//     //   amount = defaultReward ? parseInt(defaultReward.value) : 20;
//     // }

//     // // Update values
//     // await Email.update({ status, remarks, amount }, { where: { uuid } });

//     // // Send Notification
//     // await createNotification({
//     //   userUuid: email.userUuid,
//     //   title: "Email Status Updated",
//     //   message: `The status of your email (${email.email}) has been changed to "${status}".`,
//     //   type: "info",
//     //   // metadata: {
//     //   //   emailUuid: email.uuid,
//     //   //   newStatus: status,
//     //   //   remarks,
//     //   // },
//     // });

//     // return successOk(res, "Email status updated successfully");

//     const previousStatus = email.status;
//     let amount = email.amount;

//     // Early return if no status change
//     if (previousStatus === status) {
//       return successOk(res, `Status is already '${status}'. No update needed.`);
//     }

//     // Fetch reward value
//     const rewardSetting = await SystemSetting.findOne({
//       where: { key: "default_email_reward" },
//     });
//     const reward = rewardSetting ? parseInt(rewardSetting.value) : 20;

//     const toGood = ["pending", "bad"].includes(previousStatus) && status === "good";
//     const toBadFromPending = previousStatus === "pending" && status === "bad";
//     const fromGoodToOther = previousStatus === "good" && ["bad", "pending"].includes(status);

//     if (toGood) {
//       amount = reward;
//     } else if (toBadFromPending) {
//       return successOk(res, "Email status updated successfully.");
//     } else if (fromGoodToOther) {
//       amount = email.isWithdrawn ? -reward : 0;
//     }

//     console.log("===== previousStatus ===== :", previousStatus)
//     console.log("===== status ===== :", status)
//     console.log("===== amount ===== :", amount)

//     // Update email record
//     await Email.update({ status, remarks, amount }, { where: { uuid } });

//     // Send Notification
//     await createNotification({
//       userUuid: email.userUuid,
//       title: "Email Status Updated",
//       message: `The status of your email (${email.email}) has been changed to "${status}".`,
//       type: "info",
//     });

//     return successOk(res, "Email status updated successfully");
//   } catch (error) {
//     console.log("===== Error ===== : ", error);

//     return catchError(res, error);
//   }
// }

export async function updateEmailStatus(req, res) {
  try {
    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const reqBodyFields = bodyReqFields(req, res, ["status"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { uuid } = req.query;
    const { status, remarks = null } = req.body;

    const allowedStatuses = ["good", "bad", "pending"];
    if (!allowedStatuses.includes(status)) {
      return frontError(
        res,
        "Invalid status. Allowed values are: good, bad, pending"
      );
    }

    const email = await Email.findOne({ where: { uuid } });
    if (!email) return frontError(res, "Invalid email UUID");

    const previousStatus = email.status;
    const isWithdrawn = email.isWithdrawn;
    let amount = email.amount;

    // Early return if no status change
    if (previousStatus === status) {
      return successOk(res, `Status is already '${status}'. No update needed.`);
    }

    // 🛑 NEW Critical Check: Withdrawn emails can only be marked 'bad'
    if (isWithdrawn) {
      if (status !== "bad") {
        return frontError(res, "Withdrawn email can only be marked as 'bad'.");
      }
    }

    const rewardSetting = await SystemSetting.findOne({
      where: { key: "default_email_reward" },
    });
    const reward = rewardSetting ? parseInt(rewardSetting.value) : 20;

    // Different scenarios
    const goingToGood =
      ["pending", "bad"].includes(previousStatus) && status === "good";
    const goingToBadOrPendingFromGood =
      previousStatus === "good" && ["bad", "pending"].includes(status);
    const switchingBetweenPendingBad =
      (previousStatus === "pending" && status === "bad") ||
      (previousStatus === "bad" && status === "pending");

    if (goingToGood) {
      amount = reward;
    } else if (goingToBadOrPendingFromGood) {
      amount = isWithdrawn ? -reward : 0;
    } else if (switchingBetweenPendingBad) {
      // pending <-> bad: no reward, no penalty
      amount = 0;
    }

    // Update the email
    await Email.update({ status, remarks, amount }, { where: { uuid } });

    // Create notification
    await createNotification({
      userUuid: email.userUuid,
      title: "Email Status Updated",
      message: `The status of your email (${email.email}) has been changed to "${status}".`,
      type: "info",
    });

    return successOk(res, "Email status updated successfully");
  } catch (error) {
    console.log("===== Error ===== : ", error);
    return catchError(res, error);
  }
}

// ===================== Bulk Update Email Status ===========================

export async function bulkEmailEntry(req, res) {
  try {
    // const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    // if (reqQueryFields.error) return reqQueryFields.response;

    const reqBodyFields = bodyReqFields(req, res, [
      "userUuid",
      "emails",
      "status",
    ]);
    if (reqBodyFields.error) return reqBodyFields.response;

    // const { uuid } = req.query;
    const { userUuid, emails, status, remarks } = req.body;

    const allowedStatuses = ["good", "bad", "pending"];
    if (!allowedStatuses.includes(status)) {
      return frontError(
        res,
        "Invalid status. Allowed values are: good, bad, pending"
      );
    }

    // Parse emails from string: comma or newline separated
    const emailList = emails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emailList.length === 0)
      return validationError(res, "No valid emails provided.");

    // Get user with password
    const user = await User.findByPk(userUuid, {
      attributes: ["uuid", "passwordUuid"],
      include: {
        model: Password,
        attributes: ["uuid", "password"],
      },
    });

    if (!user || !user.Password || !user.Password.password)
      return validationError(
        res,
        "User not found or user has no assigned password. Please add passwords first."
      );

    const existingEmails = await Email.findAll({
      where: { email: emailList },
      attributes: ["uuid", "email", "status"],
    });

    const existingEmailList = existingEmails.map((e) => e.email);
    const newEmails = emailList.filter(
      (email) => !existingEmailList.includes(email)
    );

    let rewardAmount = 0;

    // If the status is "good", get reward value
    if (status === "good") {
      const defaultReward = await SystemSetting.findOne({
        where: { key: "default_email_reward" },
      });
      rewardAmount = defaultReward ? parseInt(defaultReward.value) : 20;
    }

    const emailEntries = [];

    for (const email of newEmails) {
      emailEntries.push({
        email,
        password: user.Password.password,
        userUuid: userUuid,
        status: status,
        amount: status === "good" ? rewardAmount : 0,
        remarks,
      });
    }

    // Bulk insert
    if (emailEntries.length > 0) await Email.bulkCreate(emailEntries);

    // Log duplicates in DuplicateEmail table
    for (const existing of existingEmails) {
      await DuplicateEmail.create({
        emailUuid: existing.uuid,
        uploadedByUuid: userUuid,
        fileName: "manual-entry",
      });
    }

    // Admin Notification
    let systemAdmin = await Admin.findOne({
      where: { username: "systemadmin" },
    });

    if (!systemAdmin) systemAdmin = await Admin.findOne();

    // Notify user
    if (existingEmailList.length > 0) {
      const title =
        existingEmailList.length === 1
          ? "Duplicate Email Found"
          : "Duplicate Emails Found";

      let message = `${existingEmailList.length} duplicate email(s) detected.`;
      if (newEmails.length > 0) {
        message += ` The remaining ${newEmails.length} email(s) were uploaded successfully.`;
      }

      await createNotification({
        userUuid,
        title,
        message,
        type: "duplicate_email",
        metadata: { duplicateEmails: existingEmailList },
      });

      if (systemAdmin) {
        await saveMessageToDB({
          senderUuid: systemAdmin.uuid,
          senderType: "admin",
          receiverUuid: userUuid,
          receiverType: "user",
          content: `${message} ----- duplicateEmails: ${existingEmailList}`,
          isNotification: true,
        });
      }

      return validationError(res, message);
    }

    // All emails were new
    await createNotification({
      userUuid,
      title: "New Email(s) Uploaded",
      message: `${newEmails.length} new email(s) have been successfully uploaded.`,
      type: "success",
    });

    if (systemAdmin) {
      await saveMessageToDB({
        senderUuid: systemAdmin.uuid,
        senderType: "admin",
        receiverUuid: userUuid,
        receiverType: "user",
        content: `New Email(s) Uploaded ----- ${newEmails.length} new email(s) have been successfully uploaded.`,
        isNotification: true,
      });
    }

    return successOk(res, "Emails uploaded successfully.");
  } catch (error) {
    console.log("===== Error ===== :", error);
    return catchError(res, error);
  }
}

// ===================== Bulk Update Email Status ===========================

// dont remove this api.
// export async function bulkUpdateEmailStatusByUuids(req, res) {
//   try {
//     const reqBodyFields = bodyReqFields(req, res, ["uuids", "status"]);
//     if (reqBodyFields.error) return reqBodyFields.response;

//     const { uuids, status, remarks = null } = req.body;

//     if (!Array.isArray(uuids) || uuids.length === 0) {
//       return frontError(res, "'uuids' must be a non-empty array.");
//     }

//     const allowedStatuses = ["good", "bad", "pending"];
//     if (!allowedStatuses.includes(status)) {
//       return frontError(
//         res,
//         "Invalid status. Allowed values are: good, bad, pending"
//       );
//     }

//     // Fetch all emails with userUuid and email for notification
//     const emails = await Email.findAll({
//       where: { uuid: uuids },
//       attributes: ["uuid", "email", "userUuid"],
//     });

//     const foundUuids = emails.map((e) => e.uuid);
//     const invalidUuids = uuids.filter((id) => !foundUuids.includes(id));

//     if (invalidUuids.length) {
//       return frontError(res, `Invalid UUID(s): ${invalidUuids.join(", ")}`);
//     }

//     // Fetch reward only once
//     let rewardAmount = 0;
//     if (status === "good") {
//       const defaultReward = await SystemSetting.findOne({
//         where: { key: "default_email_reward" },
//       });
//       rewardAmount = defaultReward ? parseInt(defaultReward.value) : 20;
//     }

//     // Update each email individually with reward/amount
//     for (const email of emails) {
//       await Email.update(
//         {
//           status,
//           remarks,
//           amount: status === "good" ? rewardAmount : 0,
//         },
//         { where: { uuid: email.uuid } }
//       );

//       // Send Notification
//       await createNotification({
//         userUuid: email.userUuid,
//         title: "Email Status Updated",
//         message: `The status of your email (${email.email}) has been updated to "${status}".`,
//         type: "info",
//       });
//     }

//     return successOk(res, "Email statuses updated successfully");
//   } catch (error) {
//     console.log("===== Error ===== : ", error);
//     return catchError(res, error);
//   }
// }

// no negative reward
// export async function bulkUpdateEmailStatusByEmails(req, res) {
//   try {
//     const reqBodyFields = bodyReqFields(req, res, ["emails", "status"]);
//     if (reqBodyFields.error) return reqBodyFields.response;

//     let { emails, status, remarks = null } = req.body;

//     const allowedStatuses = ["good", "bad", "pending"];
//     if (!allowedStatuses.includes(status)) {
//       return frontError(
//         res,
//         "Invalid status. Allowed values are: good, bad, pending"
//       );
//     }

//     // Parse emails: allow comma or pipe separated input
//     const emailList = emails
//       .split(/[\n,]+/)
//       .map((e) => e.trim().toLowerCase())
//       .filter((e) => e.length > 0);

//     if (emailList.length === 0) {
//       return validationError(res, "No valid emails provided.");
//     }

//     // Get existing emails
//     const existingEmails = await Email.findAll({
//       where: { email: emailList },
//       attributes: ["uuid", "email", "userUuid"],
//     });

//     const foundEmails = existingEmails.map((e) => e.email);
//     const missingEmails = emailList.filter(
//       (email) => !foundEmails.includes(email)
//     );

//     if (foundEmails.length === 0) {
//       return frontError(res, "None of the provided emails exist.");
//     }

//     // Fetch reward once
//     let rewardAmount = 0;
//     if (status === "good") {
//       const defaultReward = await SystemSetting.findOne({
//         where: { key: "default_email_reward" },
//       });
//       rewardAmount = defaultReward ? parseInt(defaultReward.value) : 20;
//     }

//     for (const email of existingEmails) {
//       await Email.update(
//         {
//           status,
//           remarks,
//           amount: status === "good" ? rewardAmount : 0,
//         },
//         { where: { uuid: email.uuid } }
//       );

//       // Notify the user
//       await createNotification({
//         userUuid: email.userUuid,
//         title: "Email Status Updated",
//         message: `The status of your email (${email.email}) has been updated to "${status}".`,
//         type: "info",
//       });
//     }

//     let message = `${foundEmails.length} email(s) updated successfully.`;
//     if (missingEmails.length > 0) {
//       message += ` ${missingEmails.length} email(s) not found: ${missingEmails.join(", ")}`;
//     }

//     return successOk(res, message);
//   } catch (error) {
//     console.log("===== Error ===== :", error);
//     return catchError(res, error);
//   }
// }

// ======================== Get Email Stats =================================

export async function bulkUpdateEmailStatusByEmails(req, res) {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["emails", "status"]);
    if (reqBodyFields.error) return reqBodyFields.response;
    const { emails, status, remarks = null } = req.body;
    const allowedStatuses = ["good", "bad", "pending"];
    if (!allowedStatuses.includes(status)) {
      return frontError(
        res,
        "Invalid status. Allowed values are: good, bad, pending"
      );
    }
    // Parse emails: allow comma or newline separated input
    const emailList = emails
      .split(/[\n,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (emailList.length === 0) {
      return validationError(res, "No valid emails provided.");
    }
    // Fetch all relevant email records
    const existingEmails = await Email.findAll({
      where: { email: emailList },
      attributes: [
        "uuid",
        "email",
        "userUuid",
        "status",
        "isWithdrawn",
        "amount",
      ],
    });
    const foundEmails = existingEmails.map((e) => e.email);
    const missingEmails = emailList.filter((e) => !foundEmails.includes(e));
    if (foundEmails.length === 0) {
      return frontError(res, "None of the provided emails exist.");
    }
    // ALWAYS load the default reward, regardless of the target status
    const defaultRewardSetting = await SystemSetting.findOne({
      where: { key: "default_email_reward" },
    });
    const rewardAmount = defaultRewardSetting
      ? parseInt(defaultRewardSetting.value, 10)
      : 20;
    let updatedCount = 0;
    for (const {
      uuid,
      email,
      userUuid,
      status: prevStatus,
      isWithdrawn,
    } of existingEmails) {
      // skip if no change
      if (prevStatus === status) continue;
      // withdrawn‐only→bad rule
      if (isWithdrawn && status !== "bad") {
        return frontError(res, "Withdrawn emails can only be marked as 'bad'.");
      }
      // determine new amount
      let newAmount = 0;
      const goingToGood =
        ["pending", "bad"].includes(prevStatus) && status === "good";
      const fromGoodToBadOrPending =
        prevStatus === "good" && ["bad", "pending"].includes(status);
      const pendingBadSwitch =
        (prevStatus === "pending" && status === "bad") ||
        (prevStatus === "bad" && status === "pending");
      if (goingToGood) {
        newAmount = rewardAmount;
      } else if (fromGoodToBadOrPending) {
        newAmount = isWithdrawn ? -rewardAmount : 0;
      } else if (pendingBadSwitch) {
        newAmount = 0;
      }
      // persist update
      await Email.update(
        { status, remarks, amount: newAmount },
        { where: { uuid } }
      );
      // notify user
      await createNotification({
        userUuid,
        title: "Email Status Updated",
        message: `The status of your email (${email}) has been changed to "${status}".`,
        type: "info",
      });
      updatedCount++;
    }
    let message = `${updatedCount} email(s) updated successfully.`;
    if (missingEmails.length) {
      message += ` ${
        missingEmails.length
      } email(s) not found: ${missingEmails.join(", ")}`;
    }
    return successOk(res, message);
  } catch (error) {
    console.error("===== Error ===== :", error);
    return catchError(res, error);
  }
}

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

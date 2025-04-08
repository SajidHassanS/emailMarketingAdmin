import { Op, Sequelize } from "sequelize";
import Email from "../../models/email/email.model.js";
import models from "../../models/models.js";
import { bodyReqFields, queryReqFields } from "../../utils/requiredFields.js";
import { catchError, frontError, notFound, successOkWithData, validationError } from "../../utils/responses.js";
import { createNotification } from "../../utils/notificationUtils.js";
import Bonus from "../../models/bonus/bonus.model.js";
import BonusWithdrawal from "../../models/bonus/bonusWithdrawal.model.js";
const { User, Withdrawal, WithdrawalMethod } = models;

// All pending withdrawal requests
export async function getAllWithdrawals(req, res) {
  try {
    const { status, startDate, endDate, search } = req.query;

    const whereConditions = {};
    const userConditions = {};

    // 1. Status filter
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      whereConditions.status = status;
    }

    // 2. Date range filter
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) {
        // Convert startDate to Date and reset time to midnight (start of day)
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);  // Reset time to 00:00:00
        whereConditions.createdAt[Op.gte] = start;
      }

      if (endDate) {
        // Convert endDate to Date and reset time to 23:59:59
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);  // Set time to 23:59:59
        whereConditions.createdAt[Op.lte] = end;
      }
    }

    // 3. User search filter
    if (search) {
      userConditions[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const withdrawals = await Withdrawal.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["username", "countryCode", "phone", "userTitle"],
          where: Object.keys(userConditions).length ? userConditions : undefined,
        },
        {
          model: WithdrawalMethod,
          as: "withdrawalMethod",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!withdrawals.length)
      return notFound(res, "No withdrawals found.");

    return successOkWithData(res, "Withdrawals fetched successfully.", withdrawals);
  } catch (error) {
    console.error("Error fetching all withdrawals:", error);
    return catchError(res, error);
  }
}



export async function approveWithdrawal(req, res) {
  try {
    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid } = req.query;

    const withdrawal = await Withdrawal.findOne({ where: { uuid } });

    if (!withdrawal) {
      return frontError(res, "Withdrawal request not found.");
    }

    if (withdrawal.status !== "pending") {
      return frontError(res, "Only pending requests can be approved.");
    }

    withdrawal.status = "approved";
    await withdrawal.save();

    // ✅ Create a success notification for the user
    await createNotification({
      userUuid: withdrawal.userUuid,
      title: "Withdrawal Approved",
      message: `Your withdrawal request of ₨ ${withdrawal.amount} has been approved.`,
      type: "success",
      metadata: {
        withdrawalUuid: withdrawal.uuid,
        amount: withdrawal.amount,
      },
    });

    // 1. Check if this is the user's first approved withdrawal
    const withdrawalCount = await Withdrawal.count({
      where: { userUuid: withdrawal.userUuid, status: "approved" },
    });

    // 2. If it's the first approved withdrawal, unlock the user's signup bonus
    if (withdrawalCount === 1) {
      // 2.1 Unlock the user's signup bonus
      const bonus = await Bonus.findOne({
        where: { userUuid: withdrawal.userUuid, type: "signup" }, // Added type to query
      });

      if (bonus) {
        // 2.2 Update the user's signup bonus status to unlocked
        await bonus.update({ unlockedAfterFirstWithdrawal: true });

        // Optionally, notify the user about the bonus unlocking
        await createNotification({
          userUuid: withdrawal.userUuid,
          title: "Signup Bonus Unlocked",
          message: "Your signup bonus has been unlocked after your first withdrawal.",
          type: "success",
        });
      }

      // 2.3 Check if the user was referred by someone (i.e., if there is a referrer)
      if (bonus && bonus.refereeUuid) {
        // 2.4 If the user was referred, unlock the referrer's referral bonus
        const referrerBonus = await Bonus.findOne({
          where: {
            userUuid: bonus.refereeUuid,  // Referrer (user whose referral code was used)
            type: "referral",              // Only looking for referral bonus
          },
        });

        if (referrerBonus) {
          // 2.5 Update the referrer's referral bonus to unlocked
          await referrerBonus.update({ unlockedAfterFirstWithdrawal: true });

          // Optionally, notify the referrer about the bonus unlocking
          await createNotification({
            userUuid: bonus.refereeUuid,
            title: "Referral Bonus Unlocked",
            message: "Your referral bonus has been unlocked after your referee's first withdrawal.",
            type: "success",
          });
        }
      }
    }


    return successOkWithData(res, "Withdrawal approved successfully.", withdrawal);
  } catch (error) {
    console.error("Error approving withdrawal:", error);
    return catchError(res, error)
  }
}

export async function rejectWithdrawal(req, res) {
  try {
    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid } = req.query;

    const withdrawal = await Withdrawal.findOne({ where: { uuid } });

    if (!withdrawal) {
      return frontError(res, "Withdrawal request not found.");
    }

    if (withdrawal.status !== "pending") {
      return frontError(res, "Only pending requests can be rejected.");
    }

    withdrawal.status = "rejected";
    await withdrawal.save();

    // Rollback associated emails
    await Email.update(
      { isWithdrawn: false },
      {
        where: {
          userUuid: withdrawal.userUuid,
          isWithdrawn: true,
          status: "good",
        },
      }
    );

    // ✅ Create a success notification for the user
    await createNotification({
      userUuid: withdrawal.userUuid,
      title: "Withdrawal Rejected",
      message: `Your withdrawal request of ₨ ${withdrawal.amount} has been rejected.`,
      type: "error",
      metadata: {
        withdrawalUuid: withdrawal.uuid,
        amount: withdrawal.amount,
      },
    });

    return successOkWithData(res, "Withdrawal rejected successfully.", withdrawal);
  } catch (error) {
    console.error("Error rejecting withdrawal:", error);
    return frontError(res, "Failed to reject withdrawal.");
  }
}

export async function getwithdrawalStats(req, res) {
  try {
    // Get today's and this month's date range
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfToday = new Date(today.setHours(0, 0, 0, 0)); // Start of today at midnight

    // Get total withdrawn today
    const totalWithdrawnToday = await Withdrawal.sum("amount", {
      where: {
        status: "approved", // Only consider approved withdrawals
        createdAt: {
          [Op.gte]: startOfToday, // From the start of today
        },
      },
    });

    // Get total withdrawn this month
    const totalWithdrawnThisMonth = await Withdrawal.sum("amount", {
      where: {
        status: "approved", // Only consider approved withdrawals
        createdAt: {
          [Op.gte]: startOfMonth, // From the start of this month
        },
      },
    });

    // Get the number of pending withdrawals
    const pendingWithdrawalsCount = await Withdrawal.count({
      where: { status: "pending" },
    });

    // Get total amount withdrawn (all-time) for approved and rejected withdrawals
    const totalAmountWithdrawn = await Withdrawal.sum("amount", {
      where: {
        status: "approved" // Only consider approved withdrawals
      },
    });

    // Get top users by amount withdrawn for approved withdrawals only
    const topUsers = await Withdrawal.findAll({
      attributes: [
        "userUuid",
        [Sequelize.fn("SUM", Sequelize.col("amount")), "totalAmount"],
      ],
      group: ["userUuid", "user.uuid", "user.username", "user.phone"], // Added User's fields to GROUP BY
      order: [[Sequelize.fn("SUM", Sequelize.col("amount")), "DESC"]],
      limit: 5, // Top 5 users
      where: {
        status: "approved", // Only consider approved withdrawals for top users
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["uuid", "username", "phone"], // Ensure user fields are selected
        },
      ],
    });

    return successOkWithData(res, "Dashboard stats fetched successfully.", {
      totalWithdrawnToday,
      totalWithdrawnThisMonth,
      pendingWithdrawalsCount,
      totalAmountWithdrawn,
      topUsers,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    return catchError(res, error);
  }
}


// Admin API to approve or reject bonus withdrawal requests
export async function approveRejectBonusWithdrawal(req, res) {
  const reqBodyFields = bodyReqFields(req, res, ["withdrawalUuid", "action"]);
  if (reqBodyFields.error) return reqBodyFields.response;

  const { withdrawalUuid, action } = req.body; // action can be 'approve' or 'reject'

  // Validate action type
  if (!['approve', 'reject'].includes(action)) {
    return validationError(res, "Invalid action. It must be 'approve' or 'reject'.");
  }

  try {
    // ✅ Fetch the withdrawal request by UUID
    const withdrawalRequest = await BonusWithdrawal.findOne({
      where: {
        uuid: withdrawalUuid,
      },
    });

    if (!withdrawalRequest) {
      return validationError(res, "No withdrawal request found with the provided UUID.");
    }

    // ✅ Fetch the associated bonus for this withdrawal request
    const bonus = await Bonus.findOne({
      where: {
        uuid: withdrawalRequest.bonusUuid,
      },
    });

    if (!bonus) {
      return validationError(res, "The associated bonus for this withdrawal request is not found.");
    }

    // ✅ If the action is to approve, update the withdrawal request status
    if (action === 'approve') {
      withdrawalRequest.status = 'approved';
      await withdrawalRequest.save();

      // ✅ Notify the user about the successful approval
      await createNotification({
        userUuid: bonus.userUuid,
        title: "Bonus Withdrawal Approved",
        message: `Your ${bonus.type} bonus withdrawal request has been approved.`,
        type: "success",
      });

      return successOkWithData(res, "Bonus withdrawal request approved successfully.");
    }

    // ✅ If the action is to reject, update the withdrawal request status to rejected
    if (action === 'reject') {
      withdrawalRequest.status = 'rejected';

      // ✅ Save the rejected status to the database
      await withdrawalRequest.save();

      // ✅ Notify the user about the rejection
      await createNotification({
        userUuid: bonus.userUuid,
        title: "Bonus Withdrawal Rejected",
        message: `Your ${bonus.type} bonus withdrawal request has been rejected.`,
        type: "error",
      });

      return successOkWithData(res, "Bonus withdrawal request rejected successfully.");
    }
  } catch (error) {
    console.error("Error processing bonus withdrawal approval/rejection:", error);
    return frontError(res, "Something went wrong. Please try again later.");
  }
}

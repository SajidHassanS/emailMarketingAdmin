import { Op, Sequelize } from "sequelize";
import Email from "../../models/email/email.model.js";
import models from "../../models/models.js";
import { queryReqFields } from "../../utils/requiredFields.js";
import { catchError, frontError, notFound, successOkWithData } from "../../utils/responses.js";
import { createNotification } from "../../utils/notificationUtils.js";
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

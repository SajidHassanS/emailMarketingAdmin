import { Op, Sequelize } from "sequelize";
import Email from "../../models/email/email.model.js";
import models from "../../models/models.js";
import { bodyReqFields, queryReqFields } from "../../utils/requiredFields.js";
import {
  catchError,
  frontError,
  notFound,
  successOkWithData,
  validationError,
} from "../../utils/responses.js";
import { createNotification } from "../../utils/notificationUtils.js";
import Bonus from "../../models/withdrawal/bonus.model.js";
import BonusWithdrawal from "../../models/withdrawal/bonusWithdrawal.model.js";
const { User, Withdrawal, WithdrawalMethod } = models;

// All pending withdrawal requests
export async function getAllWithdrawals(req, res) {
  try {
    const { status, startDate, endDate, search } = req.query;

    const whereConditions = { withdrawalType: "email" };
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
        start.setHours(0, 0, 0, 0); // Reset time to 00:00:00
        whereConditions.createdAt[Op.gte] = start;
      }

      if (endDate) {
        // Convert endDate to Date and reset time to 23:59:59
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set time to 23:59:59
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
          where: Object.keys(userConditions).length
            ? userConditions
            : undefined,
        },
        {
          model: WithdrawalMethod,
          as: "withdrawalMethod",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!withdrawals.length) return notFound(res, "No withdrawals found.");

    return successOkWithData(
      res,
      "Withdrawals fetched successfully.",
      withdrawals
    );
  } catch (error) {
    console.error("Error fetching all withdrawals:", error);
    return catchError(res, error);
  }
}

export async function handleWithdrawalApproval(req, res) {
  const reqBodyFields = bodyReqFields(req, res, ["withdrawalUuid", "action"]);
  if (reqBodyFields.error) return reqBodyFields.response;

  const { withdrawalUuid, action } = req.body; // action can be 'approve' or 'reject'

  // Validate action type
  if (!["approve", "reject"].includes(action)) {
    return validationError(
      res,
      "Invalid action. It must be 'approve' or 'reject'."
    );
  }

  try {
    // Fetch the withdrawal request (either regular or bonus)
    const regularWithdrawal = await Withdrawal.findOne({
      where: { uuid: withdrawalUuid },
    });
    const bonusWithdrawal = await BonusWithdrawal.findOne({
      where: { uuid: withdrawalUuid },
    });

    let withdrawalRequest = regularWithdrawal || bonusWithdrawal;

    if (!withdrawalRequest) {
      return validationError(res, "Withdrawal request not found.");
    }

    // Fetch the associated bonus if it's a bonus withdrawal
    let bonus;
    if (bonusWithdrawal) {
      bonus = await Bonus.findOne({
        where: { uuid: withdrawalRequest.bonusUuid },
      });
      if (!bonus) {
        return validationError(
          res,
          "The associated bonus for this withdrawal request is not found."
        );
      }
    }

    // Check if the withdrawal is in 'pending' status
    if (withdrawalRequest.status !== "pending") {
      return frontError(
        res,
        "Only pending requests can be approved or rejected."
      );
    }

    if (action === "approve") {
      // Approve the withdrawal request
      withdrawalRequest.status = "approved";
      await withdrawalRequest.save();

      // Create success notification for the user
      await createNotification({
        userUuid: bonus ? bonus.userUuid : withdrawalRequest.userUuid,
        title: bonus ? "Bonus Withdrawal Approved" : "Withdrawal Approved",
        message: bonus
          ? `Your ${bonus.type} bonus withdrawal request has been approved.`
          : `Your withdrawal request has been approved.`,
        type: "success",
      });

      // Handle first approved withdrawal and bonus unlocking logic (for regular withdrawal)
      if (!bonusWithdrawal) {
        const withdrawalCount = await Withdrawal.count({
          where: { userUuid: withdrawalRequest.userUuid, status: "approved" },
        });

        if (withdrawalCount === 1) {
          const userBonus = await Bonus.findOne({
            where: { userUuid: withdrawalRequest.userUuid, type: "signup" },
          });

          if (userBonus) {
            await userBonus.update({ unlockedAfterFirstWithdrawal: true });
            await createNotification({
              userUuid: withdrawalRequest.userUuid,
              title: "Signup Bonus Unlocked",
              message:
                "Your signup bonus has been unlocked after your first withdrawal.",
              type: "success",
            });
          }
        }
      }

      // Handle referrer bonus unlocking (if any)
      if (bonus && bonus.refereeUuid) {
        const referrerBonus = await Bonus.findOne({
          where: { userUuid: bonus.refereeUuid, type: "referral" },
        });

        if (referrerBonus) {
          await referrerBonus.update({ unlockedAfterFirstWithdrawal: true });
          await createNotification({
            userUuid: bonus.refereeUuid,
            title: "Referral Bonus Unlocked",
            message:
              "Your referral bonus has been unlocked after your referee's first withdrawal.",
            type: "success",
          });
        }
      }

      return successOkWithData(
        res,
        "Withdrawal approved successfully.",
        withdrawalRequest
      );
    } else if (action === "reject") {
      // Reject the withdrawal request
      withdrawalRequest.status = "rejected";
      await withdrawalRequest.save();

      // If it's a bonus withdrawal, we don't need to rollback emails (this is specific to regular withdrawals)
      if (!bonusWithdrawal) {
        // Rollback associated emails
        await Email.update(
          { isWithdrawn: false },
          {
            where: {
              userUuid: withdrawalRequest.userUuid,
              isWithdrawn: true,
              status: "good",
            },
          }
        );
      }

      // Create error notification for the user
      await createNotification({
        userUuid: bonus ? bonus.userUuid : withdrawalRequest.userUuid,
        title: bonus ? "Bonus Withdrawal Rejected" : "Withdrawal Rejected",
        message: bonus
          ? `Your ${bonus.type} bonus withdrawal request has been rejected.`
          : `Your withdrawal request has been rejected.`,
        type: "error",
      });

      return successOkWithData(
        res,
        "Withdrawal rejected successfully.",
        withdrawalRequest
      );
    }
  } catch (error) {
    console.error("Error handling withdrawal:", error);
    return catchError(res, error);
  }
}

export async function handleWithdrawal(req, res) {
  try {
    // Validate required fields
    const reqBodyFields = bodyReqFields(req, res, ["withdrawalUuid", "action"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { withdrawalUuid, action, remarks } = req.body; // action can be 'approve' or 'reject'

    // Validate action type
    if (!["approve", "reject"].includes(action)) {
      return validationError(
        res,
        "Invalid action. It must be 'approve' or 'reject'."
      );
    }

    // Fetch the withdrawal request by UUID
    const withdrawal = await Withdrawal.findOne({
      where: { uuid: withdrawalUuid },
    });

    if (!withdrawal) {
      return frontError(res, "Withdrawal request not found.");
    }

    // Check if the withdrawal is in a 'pending' status for approval or rejection
    if (withdrawal.status !== "pending") {
      return frontError(
        res,
        "Only pending requests can be approved or rejected."
      );
    }

    if (action === "approve") {
      // Validate required fields for approval
      if (!remarks)
        return validationError(res, "'remarks' is required for approval.");
      // if (!req.file)
      //   return validationError(
      //     res,
      //     "Payment screenshot is required for approval."
      //   );

      // Approve the withdrawal request
      withdrawal.status = "approved";
      // withdrawal.paymentScreenshot = req.file.key;
      // Only set paymentScreenshot if file was uploaded
      if (req.file) {
        withdrawal.paymentScreenshot = req.file.key;
      }
      withdrawal.remarks = remarks;

      await withdrawal.save();

      // After approval, set negative withdrawn email amounts to 0
      await Email.update(
        { amount: 0 },
        {
          where: {
            userUuid: withdrawal.userUuid,
            isWithdrawn: true,
            amount: { [Op.lt]: 0 }, // only negative amounts
          },
        }
      );

      // Create success notification for the user
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

      // Handle first approved withdrawal and bonus unlocking logic
      const withdrawalCount = await Withdrawal.count({
        where: {
          userUuid: withdrawal.userUuid,
          withdrawalType: "email",
          status: "approved",
        },
      });

      console.log("===== withdrawalCount ===== : ", withdrawalCount);

      if (withdrawalCount === 1) {
        // Unlock the user's signup bonus if this is their first approved withdrawal
        const bonus = await Bonus.findOne({
          where: {
            userUuid: withdrawal.userUuid,
            unlockedAfterFirstWithdrawal: false,
          },
        });

        console.log("===== bonus ===== : ", bonus);
        if (bonus) {
          await bonus.update({ unlockedAfterFirstWithdrawal: true });

          await createNotification({
            userUuid: withdrawal.userUuid,
            title: "Signup Bonus Unlocked",
            message:
              "Your signup bonus has been unlocked after your first withdrawal.",
            type: "success",
          });
        }

        // Check if the user was referred and unlock the referrer's bonus
        if (bonus && bonus.refereeUuid) {
          const referrerBonus = await Bonus.findOne({
            where: { userUuid: bonus.refereeUuid, type: "referral" },
          });
          console.log("===== referrerBonus ===== : ", referrerBonus);

          if (referrerBonus) {
            await referrerBonus.update({ unlockedAfterFirstWithdrawal: true });

            await createNotification({
              userUuid: bonus.refereeUuid,
              title: "Referral Bonus Unlocked",
              message:
                "Your referral bonus has been unlocked after your referee's first withdrawal.",
              type: "success",
            });
          }
        }
      }

      return successOkWithData(
        res,
        "Withdrawal approved successfully.",
        withdrawal
      );
    } else if (action === "reject") {
      // Reject the withdrawal request
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

      // Create error notification for the user
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

      return successOkWithData(
        res,
        "Withdrawal rejected successfully.",
        withdrawal
      );
    }
  } catch (error) {
    console.error("Error handling withdrawal:", error);
    return catchError(res, error);
  }
}

// export async function approveWithdrawal(req, res) {
//   try {
//     const reqQueryFields = queryReqFields(req, res, ["uuid"]);
//     if (reqQueryFields.error) return reqQueryFields.response;

//     const { uuid } = req.query;

//     const withdrawal = await Withdrawal.findOne({ where: { uuid } });

//     if (!withdrawal) {
//       return frontError(res, "Withdrawal request not found.");
//     }

//     if (withdrawal.status !== "pending") {
//       return frontError(res, "Only pending requests can be approved.");
//     }

//     withdrawal.status = "approved";
//     await withdrawal.save();

//     // ✅ Create a success notification for the user
//     await createNotification({
//       userUuid: withdrawal.userUuid,
//       title: "Withdrawal Approved",
//       message: `Your withdrawal request of ₨ ${withdrawal.amount} has been approved.`,
//       type: "success",
//       metadata: {
//         withdrawalUuid: withdrawal.uuid,
//         amount: withdrawal.amount,
//       },
//     });

//     // 1. Check if this is the user's first approved withdrawal
//     const withdrawalCount = await Withdrawal.count({
//       where: { userUuid: withdrawal.userUuid, status: "approved" },
//     });

//     // 2. If it's the first approved withdrawal, unlock the user's signup bonus
//     if (withdrawalCount === 1) {
//       // 2.1 Unlock the user's signup bonus
//       const bonus = await Bonus.findOne({
//         where: { userUuid: withdrawal.userUuid, type: "signup" }, // Added type to query
//       });

//       if (bonus) {
//         // 2.2 Update the user's signup bonus status to unlocked
//         await bonus.update({ unlockedAfterFirstWithdrawal: true });

//         // Optionally, notify the user about the bonus unlocking
//         await createNotification({
//           userUuid: withdrawal.userUuid,
//           title: "Signup Bonus Unlocked",
//           message: "Your signup bonus has been unlocked after your first withdrawal.",
//           type: "success",
//         });
//       }

//       // 2.3 Check if the user was referred by someone (i.e., if there is a referrer)
//       if (bonus && bonus.refereeUuid) {
//         // 2.4 If the user was referred, unlock the referrer's referral bonus
//         const referrerBonus = await Bonus.findOne({
//           where: {
//             userUuid: bonus.refereeUuid,  // Referrer (user whose referral code was used)
//             type: "referral",              // Only looking for referral bonus
//           },
//         });

//         if (referrerBonus) {
//           // 2.5 Update the referrer's referral bonus to unlocked
//           await referrerBonus.update({ unlockedAfterFirstWithdrawal: true });

//           // Optionally, notify the referrer about the bonus unlocking
//           await createNotification({
//             userUuid: bonus.refereeUuid,
//             title: "Referral Bonus Unlocked",
//             message: "Your referral bonus has been unlocked after your referee's first withdrawal.",
//             type: "success",
//           });
//         }
//       }
//     }

//     return successOkWithData(res, "Withdrawal approved successfully.", withdrawal);
//   } catch (error) {
//     console.error("Error approving withdrawal:", error);
//     return catchError(res, error)
//   }
// }

// export async function rejectWithdrawal(req, res) {
//   try {
//     const reqQueryFields = queryReqFields(req, res, ["uuid"]);
//     if (reqQueryFields.error) return reqQueryFields.response;

//     const { uuid } = req.query;

//     const withdrawal = await Withdrawal.findOne({ where: { uuid } });

//     if (!withdrawal) {
//       return frontError(res, "Withdrawal request not found.");
//     }

//     if (withdrawal.status !== "pending") {
//       return frontError(res, "Only pending requests can be rejected.");
//     }

//     withdrawal.status = "rejected";
//     await withdrawal.save();

//     // Rollback associated emails
//     await Email.update(
//       { isWithdrawn: false },
//       {
//         where: {
//           userUuid: withdrawal.userUuid,
//           isWithdrawn: true,
//           status: "good",
//         },
//       }
//     );

//     // ✅ Create a success notification for the user
//     await createNotification({
//       userUuid: withdrawal.userUuid,
//       title: "Withdrawal Rejected",
//       message: `Your withdrawal request of ₨ ${withdrawal.amount} has been rejected.`,
//       type: "error",
//       metadata: {
//         withdrawalUuid: withdrawal.uuid,
//         amount: withdrawal.amount,
//       },
//     });

//     return successOkWithData(res, "Withdrawal rejected successfully.", withdrawal);
//   } catch (error) {
//     console.error("Error rejecting withdrawal:", error);
//     return frontError(res, "Failed to reject withdrawal.");
//   }
// }

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
        status: "approved", // Only consider approved withdrawals
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

// export async function getAllBonusWithdrawals(req, res) {
//   try {
//     const { status, startDate, endDate, search } = req.query;

//     const whereConditions = {};
//     const userConditions = {};

//     // 1. Status filter
//     if (status && ["pending", "approved", "rejected"].includes(status)) {
//       whereConditions.status = status;
//     }

//     // 2. Date range filter
//     if (startDate || endDate) {
//       whereConditions.createdAt = {};
//       if (startDate) {
//         // Convert startDate to Date and reset time to midnight (start of day)
//         const start = new Date(startDate);
//         start.setHours(0, 0, 0, 0);  // Reset time to 00:00:00
//         whereConditions.createdAt[Op.gte] = start;
//       }

//       if (endDate) {
//         // Convert endDate to Date and reset time to 23:59:59
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);  // Set time to 23:59:59
//         whereConditions.createdAt[Op.lte] = end;
//       }
//     }

//     // 3. User search filter
//     if (search) {
//       userConditions[Op.or] = [
//         { username: { [Op.iLike]: `%${search}%` } },
//         { phone: { [Op.iLike]: `%${search}%` } },
//       ];
//     }

//     const bonuswithdrawals = await BonusWithdrawal.findAll({
//       where: whereConditions,
//       include: [
//         {
//           model: Bonus, // Assuming you're including Bonus details
//           as: 'bonus',
//           attributes: ['uuid', 'amount', 'type'], // Adjust attributes as per need
//         },
//         {
//           model: User,
//           as: "user",
//           attributes: ["username", "countryCode", "phone", "userTitle"],
//           where: Object.keys(userConditions).length ? userConditions : undefined,
//         },
//         {
//           model: WithdrawalMethod,
//           as: "withdrawalMethod",
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//     });

//     if (!bonuswithdrawals.length)
//       return notFound(res, "No bonus withdrawals found.");

//     return successOkWithData(res, "Bonus withdrawals fetched successfully.", bonuswithdrawals);
//   } catch (error) {
//     console.error("Error fetching all bonus withdrawals:", error);
//     return catchError(res, error);
//   }
// }

// // Admin API to approve or reject bonus withdrawal requests
// export async function approveRejectBonusWithdrawal(req, res) {
//   const reqBodyFields = bodyReqFields(req, res, ["withdrawalUuid", "action"]);
//   if (reqBodyFields.error) return reqBodyFields.response;

//   const { withdrawalUuid, action } = req.body; // action can be 'approve' or 'reject'

//   // Validate action type
//   if (!['approve', 'reject'].includes(action)) {
//     return validationError(res, "Invalid action. It must be 'approve' or 'reject'.");
//   }

//   try {
//     // ✅ Fetch the withdrawal request by UUID
//     const withdrawalRequest = await BonusWithdrawal.findOne({
//       where: {
//         uuid: withdrawalUuid,
//       },
//     });

//     if (!withdrawalRequest) {
//       return validationError(res, "No withdrawal request found with the provided UUID.");
//     }

//     // ✅ Fetch the associated bonus for this withdrawal request
//     const bonus = await Bonus.findOne({
//       where: {
//         uuid: withdrawalRequest.bonusUuid,
//       },
//     });

//     if (!bonus) {
//       return validationError(res, "The associated bonus for this withdrawal request is not found.");
//     }

//     // ✅ If the action is to approve, update the withdrawal request status
//     if (action === 'approve') {
//       withdrawalRequest.status = 'approved';
//       await withdrawalRequest.save();

//       // ✅ Notify the user about the successful approval
//       await createNotification({
//         userUuid: bonus.userUuid,
//         title: "Bonus Withdrawal Approved",
//         message: `Your ${bonus.type} bonus withdrawal request has been approved.`,
//         type: "success",
//       });

//       return successOkWithData(res, "Bonus withdrawal request approved successfully.");
//     }

//     // ✅ If the action is to reject, update the withdrawal request status to rejected
//     if (action === 'reject') {
//       withdrawalRequest.status = 'rejected';

//       // ✅ Save the rejected status to the database
//       await withdrawalRequest.save();

//       // ✅ Notify the user about the rejection
//       await createNotification({
//         userUuid: bonus.userUuid,
//         title: "Bonus Withdrawal Rejected",
//         message: `Your ${bonus.type} bonus withdrawal request has been rejected.`,
//         type: "error",
//       });

//       return successOkWithData(res, "Bonus withdrawal request rejected successfully.");
//     }
//   } catch (error) {
//     console.error("Error processing bonus withdrawal approval/rejection:", error);
//     return frontError(res, "Something went wrong. Please try again later.");
//   }
// }

// Admin API to approve or reject bonus withdrawal requests

export async function getAllBonusWithdrawals(req, res) {
  try {
    const { status, startDate, endDate, search } = req.query;

    // 1) Base filter: only bonus withdrawals
    const where = {
      withdrawalType: { [Op.in]: ["signup-bonus", "referral-bonus"] },
    };

    // 2) status filter (single or comma-separated)
    if (status) {
      const statuses = status.split(",").map((s) => s.trim());
      const validStatuses = ["pending", "approved", "rejected"];
      if (statuses.some((s) => !validStatuses.includes(s))) {
        return frontError(
          res,
          400,
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`
        );
      }
      where.status = { [Op.in]: statuses };
    }

    // 3) date range filter on createdAt
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const from = new Date(startDate);
        if (isNaN(from)) return frontError(res, 400, "Invalid startDate");
        from.setHours(0, 0, 0, 0);
        where.createdAt[Op.gte] = from;
      }
      if (endDate) {
        const to = new Date(endDate);
        if (isNaN(to)) return frontError(res, 400, "Invalid endDate");
        to.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = to;
      }
    }

    // 4) user search filter
    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // 5) Fetch with associations
    const bonusWithdrawals = await Withdrawal.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["uuid", "username", "countryCode", "phone", "userTitle"],
          where: Object.keys(userWhere).length ? userWhere : undefined,
        },
        {
          model: WithdrawalMethod,
          as: "withdrawalMethod",
          attributes: ["uuid", "methodType", "accountNumber"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!bonusWithdrawals.length) {
      return notFound(res, "No bonus withdrawals found.");
    }

    return successOkWithData(
      res,
      "Bonus withdrawals fetched successfully.",
      bonusWithdrawals
    );
  } catch (error) {
    console.error("Error fetching all bonus withdrawals:", error);
    return catchError(res, error);
  }
}

export async function approveRejectBonusWithdrawal(req, res) {
  const reqBodyFields = bodyReqFields(req, res, ["withdrawalUuid", "action"]);
  if (reqBodyFields.error) return reqBodyFields.response;

  const { withdrawalUuid, action } = req.body; // action can be 'approve' or 'reject'

  // Validate action type
  if (!["approve", "reject"].includes(action)) {
    return validationError(
      res,
      "Invalid action. It must be 'approve' or 'reject'."
    );
  }

  try {
    // ✅ Fetch the withdrawal request by UUID
    const withdrawal = await Withdrawal.findOne({
      where: {
        uuid: withdrawalUuid,
      },
    });

    if (!withdrawal) {
      return validationError(
        res,
        "No withdrawal request found with the provided UUID."
      );
    }

    // Check if the withdrawal is in a 'pending' status for approval or rejection
    if (withdrawal.status !== "pending") {
      return frontError(
        res,
        "Only pending requests can be approved or rejected."
      );
    }

    console.log("===== withdrawal ===== : ", withdrawal);

    const bonusType = withdrawal.withdrawalType.split("-")[0];

    if (action === "approve") {
      // Approve the withdrawal request
      withdrawal.status = "approved";
      await withdrawal.save();

      await Bonus.update(
        { isWithdrawn: true },
        {
          where: {
            userUuid: withdrawal.userUuid,
            isWithdrawn: false,
            unlockedAfterFirstWithdrawal: true,
            type: bonusType,
          },
        }
      );

      await createNotification({
        userUuid: withdrawal.userUuid,
        title: "Withdrawal Approved",
        message: `Your bonus withdrawal request of ₨ ${withdrawal.amount} has been approved.`,
        type: "success",
        metadata: {
          withdrawalUuid: withdrawal.uuid,
          amount: withdrawal.amount,
        },
      });

      return successOkWithData(
        res,
        "Bonus withdrawal approved successfully.",
        withdrawal
      );
    } else if (action === "reject") {
      // Reject the withdrawal request
      withdrawal.status = "rejected";
      await withdrawal.save();

      await Bonus.update(
        { isWithdrawn: false },
        {
          where: {
            userUuid: withdrawal.userUuid,
            isWithdrawn: true,
            unlockedAfterFirstWithdrawal: true,
            type: bonusType,
          },
        }
      );

      // Create error notification for the user
      await createNotification({
        userUuid: withdrawal.userUuid,
        title: "Withdrawal Rejected",
        message: `Your bonus withdrawal request of ₨ ${withdrawal.amount} has been rejected.`,
        type: "error",
        metadata: {
          withdrawalUuid: withdrawal.uuid,
          amount: withdrawal.amount,
        },
      });

      return successOkWithData(
        res,
        "Bonus withdrawal rejected successfully.",
        withdrawal
      );
    }
  } catch (error) {
    console.error(
      "Error processing bonus withdrawal approval/rejection:",
      error
    );
    return frontError(res, "Something went wrong. Please try again later.");
  }
}

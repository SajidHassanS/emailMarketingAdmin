import models from "../../models/models.js";
import { queryReqFields } from "../../utils/requiredFields.js";
import {
  catchError,
  frontError,
  successOk,
  successOkWithData,
} from "../../utils/responses.js";
const { Notification } = models;

// ========================= Helping Function ============================

export async function createNotification({
  userUuid,
  message,
  title = null,
  type = "info",
  metadata = null,
}) {
  try {
    // Create the notification in the database
    const notification = await Notification.create({
      userUuid,
      message,
      title,
      type,
      metadata,
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
}

// ========================= Get All Notifications ============================

// export async function getAllNotifications(req, res) {
//   try {
//     const userUid = req.userUid;

//     const notifications = await Notification.findAll({
//       where: { userUuid: userUid },
//       order: [["createdAt", "DESC"]], // Optional: Sort notifications by the most recent first
//     });

//     if (!notifications.length) return notFound(res, "No notifications found.");

//     return successOkWithData(
//       res,
//       "Notifications fetched successfully",
//       notifications
//     );
//   } catch (error) {
//     return catchError(res, error);
//   }
// }

// // Fetch notifications for a specific user
// const getUserNotifications = async (userUuid) => {
//   const notifications = await Notification.findAll({
//     where: { userUuid },
//     order: [["createdAt", "DESC"]], // Optional: Sort notifications by the most recent first
//   });

//   return notifications;
// };

// // ========================= Get Single Notification ==========================

// export async function getNotificationDetails(req, res) {
//   try {
//     const reqQueryFields = queryReqFields(req, res, ["uuid"]);
//     if (reqQueryFields.error) return reqQueryFields.response;

//     const { uuid } = req.query;

//     const notificationData = await Notification.findOne({
//       where: { uuid },
//       order: [["createdAt", "DESC"]],
//       // include: [
//       //   {
//       //     model: User,
//       //     as: "user",
//       //     attributes: ["uuid", "username"],
//       //   },
//       // ],
//     });

//     if (!notificationData) return frontError(res, "Invalid uuid.");

//     return successOkWithData(
//       res,
//       "Notifications fetched successfully",
//       notificationData
//     );
//   } catch (error) {
//     console.error("Error fetching notification details:", error);
//     return catchError(res, error);
//   }
// }

// // ==================== Mark Notification As Read ===================

// export async function markNotificationAsRead(req, res) {
//   try {
//     const reqQueryFields = queryReqFields(req, res, ["uuid"]);
//     if (reqQueryFields.error) return reqQueryFields.response;

//     const { uuid } = req.query;

//     const notificationData = await Notification.findOne({
//       where: { uuid },
//     });

//     if (!notificationData) return frontError(res, "Invalid uuid.");
//     if (notificationData.read)
//       return frontError(res, "Notification is already read.");

//     await Notification.update(
//       { read: true },
//       {
//         where: { uuid },
//       }
//     );

//     return successOk(res, "Notifications read successfully");
//   } catch (error) {
//     console.error("Error fetching notification details:", error);
//     return catchError(res, error);
//   }
// }

// // ==================== Unread Notification Count ===================

// export async function getUnreadCount(req, res) {
//   try {
//     const userUid = req.userUid;

//     const count = await Notification.count({
//       where: {
//         userUuid: userUid,
//         read: false,
//       },
//     });

//     return successOkWithData(res, "Unread notification count fetched", {
//       unreadCount: count,
//     });
//   } catch (error) {
//     console.error("Error fetching unread notification count:", error);
//     return catchError(res, error);
//   }
// }

// // ==================== Mark All Notification As Read ===================

// export async function markAllNotificationsAsRead(req, res) {
//   try {
//     const userUid = req.userUid;

//     const [updatedCount] = await Notification.update(
//       { read: true },
//       {
//         where: {
//           userUuid: userUid,
//           read: false, // only update unread ones
//         },
//       }
//     );

//     if (updatedCount === 0) {
//       return successOk(res, "All notifications are already marked as read.");
//     }

//     return successOk(res, "All notifications have been marked as read.");
//   } catch (error) {
//     console.error("Error marking all notifications as read:", error);
//     return catchError(res, error);
//   }
// }

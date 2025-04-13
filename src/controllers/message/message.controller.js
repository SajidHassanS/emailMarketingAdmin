import { Op } from "sequelize";
import models from "../../models/models.js";
import {
  catchError,
  frontError,
  notFound,
  successOk,
  successOkWithData,
} from "../../utils/responses.js";
import { bodyReqFields, queryReqFields } from "../../utils/requiredFields.js";
const { User, Message } = models;

export const getUsersForNewChat = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["uuid", "username"],
      order: [["username", "ASC"]],
    });

    return successOkWithData(res, "Users fetched successfully.", users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    return catchError(res, error);
  }
};

// export const getUsersChattedWithAdmin = async (req, res) => {
//   try {
//     const adminUuid = req.adminUid;

//     // console.log("===== adminUuid ===== : ", adminUuid);

//     // Fetch distinct users who have had conversations with the admin
//     const users = await Message.findAll({
//       where: {
//         [Op.or]: [
//           { senderUuid: adminUuid, senderType: "admin" },
//           { receiverUuid: adminUuid, receiverType: "admin" },
//         ],
//       },
//       include: [
//         {
//           model: User,
//           as: "senderByUser", // If the user is the sender
//           attributes: ["uuid", "username"],
//         },
//         {
//           model: User,
//           as: "receiverByUser", // If the user is the receiver
//           attributes: ["uuid", "username"],
//         },
//       ],
//       distinct: true, // Ensures that we only get distinct results
//       order: [["createdAt", "DESC"]], // Order by most recent message
//       attributes: [], // We want to select the distinct user IDs
//     });
//     // console.log("===== users ===== : ", users);

//     // Extracting distinct users (sender or receiver) from the result set
//     const distinctUsers = new Map();

//     // Loop through all messages and add unique users to the map
//     users.forEach((message) => {
//       const sender = message.senderByUser;
//       const receiver = message.receiverByUser;

//       if (sender && !distinctUsers.has(sender.uuid)) {
//         distinctUsers.set(sender.uuid, sender);
//       }

//       if (receiver && !distinctUsers.has(receiver.uuid)) {
//         distinctUsers.set(receiver.uuid, receiver);
//       }
//     });

//     // Convert the map values (distinct users) to an array
//     const uniqueUsers = Array.from(distinctUsers.values());

//     // console.log("===== uniqueUsers ===== : ", uniqueUsers);

//     // Return the list of users
//     return successOkWithData(res, "Users fetched succesffully.", uniqueUsers);
//   } catch (error) {
//     console.error("Error fetching users chatted with admin:", error);
//     return catchError(res, error);
//   }
// };

// Controller to get messages

export const getUsersChattedWithAdmin = async (req, res) => {
  try {
    const adminUuid = req.adminUid;
    console.log("===== adminUuid ===== : ", adminUuid);

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderUuid: adminUuid, senderType: "admin" },
          { receiverUuid: adminUuid, receiverType: "admin" },
        ],
      },
      include: [
        {
          model: User,
          as: "senderByUser",
          attributes: ["uuid", "username"],
        },
        {
          model: User,
          as: "receiverByUser",
          attributes: ["uuid", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
      attributes: [],
    });

    const distinctUsers = new Map();

    for (const message of messages) {
      const sender = message.senderByUser;
      const receiver = message.receiverByUser;

      if (
        sender &&
        sender.uuid !== adminUuid &&
        !distinctUsers.has(sender.uuid)
      ) {
        distinctUsers.set(sender.uuid, sender);
      }

      if (
        receiver &&
        receiver.uuid !== adminUuid &&
        !distinctUsers.has(receiver.uuid)
      ) {
        distinctUsers.set(receiver.uuid, receiver);
      }
    }

    const uniqueUsers = Array.from(distinctUsers.values());

    // Now fetch unread counts in parallel for all users
    const enrichedUsers = await Promise.all(
      uniqueUsers.map(async (user) => {
        const count = await Message.count({
          where: {
            senderUuid: user.uuid,
            receiverUuid: adminUuid,
            isRead: false,
          },
        });

        return {
          ...user.toJSON(),
          unreadCount: count,
        };
      })
    );

    console.log("===== enrichedUsers ===== : ", enrichedUsers);

    return successOkWithData(res, "Users fetched successfully.", enrichedUsers);
  } catch (error) {
    console.error("Error fetching users chatted with admin:", error);
    return catchError(res, error);
  }
};

export const getUserMessages = async (req, res) => {
  try {
    const adminUuid = req.adminUid; // Admin's UUID

    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid, page = 1, pageSize = 20, search = "" } = req.query; // Pagination params (page, pageSize) and optional search

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Fetch messages exchanged between the admin and the specified user
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderUuid: adminUuid, receiverUuid: uuid },
          { senderUuid: uuid, receiverUuid: adminUuid },
        ],
        content: { [Op.iLike]: `%${search}%` }, // Optional search by content (case-insensitive)
      },
      include: [
        {
          model: User,
          as: "senderByUser",
          attributes: ["uuid", "username"], // Sender user details
          required: false,
        },
        {
          model: User,
          as: "receiverByUser",
          attributes: ["uuid", "username"], // Receiver user details
          required: false,
        },
      ],
      order: [["createdAt", "ASC"]], // Order by message creation date (ascending)
      limit: pageSize, // Limit results per page
      offset: offset, // Skip previous pages
    });

    // Fetch the total count of messages to calculate total pages
    const totalMessages = await Message.count({
      where: {
        [Op.or]: [
          { senderUuid: adminUuid, receiverUuid: uuid },
          { senderUuid: uuid, receiverUuid: adminUuid },
        ],
        content: { [Op.iLike]: `%${search}%` }, // Optional search by content (case-insensitive)
      },
    });

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalMessages / pageSize);

    // Format the messages into a desired structure
    const formattedMessages = messages.map((message) => ({
      uuid: message.uuid,
      senderUsername:
        message.senderType === "admin"
          ? message.senderByAdmin?.username || "Admin"
          : message.senderByUser?.username || "User",
      receiverUsername:
        message.receiverType === "admin"
          ? message.receiverByAdmin?.username || "Admin"
          : message.receiverByUser?.username || "User",
      content: message.content,
      isNotification: message.isNotification,
      createdAt: message.createdAt,
    }));

    // Return the list of messages using the custom response function
    return successOkWithData(res, "Successfully fetched messages with user", {
      messages: formattedMessages,
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalPages: totalPages,
        totalMessages: totalMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching messages with user:", error);
    catchError(res, error);
  }
};

export const getUnreadMessageCount = async (req, res) => {
  try {
    const adminUuid = req.adminUid;

    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid } = req.query;

    const count = await Message.count({
      where: {
        senderUuid: uuid,
        receiverUuid: adminUuid,
        isRead: false,
      },
    });

    return successOkWithData(res, "Unread message count fetched.", { count });
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    catchError(res, error);
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const adminUuid = req.adminUid;

    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid } = req.query;

    await Message.update(
      { isRead: true },
      {
        where: {
          senderUuid: uuid,
          receiverUuid: adminUuid,
          isRead: false,
        },
      }
    );

    return successOk(res, "Messages marked as read.");
  } catch (error) {
    console.error("Error marking messages as read:", error);
    catchError(res, error);
  }
};

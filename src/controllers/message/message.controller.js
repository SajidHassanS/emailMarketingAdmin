import { Op } from "sequelize";
import models from "../../models/models.js";
import { catchError, frontError, notFound, successOk, successOkWithData } from "../../utils/responses.js";
import { bodyReqFields, queryReqFields } from "../../utils/requiredFields.js";
const { User, Admin, Message } = models


export const getUsersChattedWithAdmin = async (req, res) => {
    try {
        const adminUuid = req.adminUid

        // Fetch distinct users who have had conversations with the admin
        const users = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderUuid: adminUuid, senderType: "admin" },
                    { receiverUuid: adminUuid, receiverType: "admin" },
                ],
            },
            include: [
                {
                    model: User,
                    as: "senderByUser", // If the user is the sender
                    attributes: ["uuid", "username"],
                    where: { uuid: { [Op.ne]: adminUuid } }, // Exclude admin from being returned as a user
                },
                {
                    model: User,
                    as: "receiverByUser", // If the user is the receiver
                    attributes: ["uuid", "username"],
                    where: { uuid: { [Op.ne]: adminUuid } },
                },
            ],
            distinct: true, // Ensures that we only get distinct users
            order: [["createdAt", "DESC"]], // Order by most recent message
        });

        // Extract distinct users from the result
        const distinctUsers = users.map((message) => {
            const user = message.senderByUser || message.receiverByUser;
            return {
                uuid: user.uuid,
                name: user.username,
            };
        });

        // Return the list of users
        return successOkWithData(res, "Users fetched succesffully.", distinctUsers)
    } catch (error) {
        console.error("Error fetching users chatted with admin:", error);
        return catchError(res, error)
    }
};

// Controller to get messages
export const getMessages = async (req, res) => {
    try {

        const adminUuid = req.adminUid; // Admin's UUID

        const reqQueryFields = queryReqFields(req, res, ["userUuid"]);
        if (reqQueryFields.error) return reqQueryFields.response;

        const { userUuid } = req.query

        // Fetch messages exchanged between the admin and the specified user
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderUuid: adminUuid, receiverUuid: userUuid },
                    { senderUuid: userUuid, receiverUuid: adminUuid }
                ],
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
        });

        // Format the messages into a desired structure (optional)
        const formattedMessages = messages.map((message) => ({
            uuid: message.uuid,
            senderUuid: message.senderUuid,
            senderUsername: message.senderByUser ? message.senderByUser.username : "Admin",
            receiverUuid: message.receiverUuid,
            receiverUsername: message.receiverByUser ? message.receiverByUser.username : "Admin",
            content: message.content,
            isNotification: message.isNotification,
            createdAt: message.createdAt,
        }));

        // Return the list of messages using the custom response function
        return successOkWithData(res, "Successfully fetched messages with user", formattedMessages);
    } catch (error) {
        console.error("Error fetching messages with user:", error);
        catchError(res, error)
    }
};

// Controller to get messages
export const sendMessages = async (req, res) => {
    try {

        const adminUuid = req.adminUid; // Admin's UUID

        const reqQueryFields = queryReqFields(req, res, ["userUuid"]);
        if (reqQueryFields.error) return reqQueryFields.response;

        const reqBodyFields = bodyReqFields(req, res, ["content"]);
        if (reqBodyFields.error) return reqBodyFields.response;

        const { userUuid } = req.query
        const { content } = req.body

        // Check if user exists
        const user = await User.findOne({ where: { uuid: userUuid } });
        if (!user) return frontError(res, "Invalid userUuid.")

        // Validate
        if (!content || content.trim() === "") {
            return frontError(res, "this is required.", "content");
        }

        console.log("===== adminUuid ===== : ", adminUuid);
        console.log("===== userUuid ===== : ", userUuid);
        console.log("===== content ===== : ", content);

        // Create message
        await Message.create({
            senderUuid: adminUuid,
            senderType: "admin",
            receiverUuid: userUuid,
            receiverType: "user",
            content,
            isNotification: false,
        });

        return successOk(res, "Message sent successfully.");
    } catch (error) {
        console.error("Error fetching messages with user:", error);
        catchError(res, error)
    }
};

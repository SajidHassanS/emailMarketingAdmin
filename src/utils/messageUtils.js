import models from "../models/models.js";
const { Message } = models

export const saveMessageToDB = async ({ senderUuid, senderType, receiverUuid, receiverType, content, isNotification = false }) => {
    try {
        // Save the message to the database
        const savedMessage = await Message.create({
            senderUuid,
            senderType,
            receiverUuid,
            receiverType,
            content,
            isNotification,
        });

        // Return the saved message
        return savedMessage;
    } catch (error) {
        console.error("Error saving message:", error);
        throw new Error("Failed to save message to the database");
    }
};

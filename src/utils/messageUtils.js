import models from "../models/models.js";
const { Message } = models

export const saveMessageToDB = async ({ senderUuid, receiverUuid, content, senderType, receiverType }) => {
    try {
        // Save the message to the database
        const savedMessage = await Message.create({
            senderUuid,
            receiverUuid,
            content,
            senderType,
            receiverType,
        });

        // Return the saved message
        return savedMessage;
    } catch (error) {
        console.error("Error saving message:", error);
        throw new Error("Failed to save message to the database");
    }
};

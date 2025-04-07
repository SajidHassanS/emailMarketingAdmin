import models from "../models/models.js";
const { Notification } = models

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
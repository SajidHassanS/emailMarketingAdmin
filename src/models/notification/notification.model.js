import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";
import User from "../user/user.model.js";

const Notification = sequelize.define(
  "Notification",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Title for the notification (can be used to categorize or provide a quick hint of what the notification is about)
    title: {
      type: DataTypes.STRING,
      allowNull: true, // Title is optional, useful for different types of notifications
    },
    // Message content of the notification (detailed text)
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "User", key: "uuid" },
    },
    // Notification type: can be expanded for different categories like system, user-specific, warnings, etc.
    type: {
      type: DataTypes.ENUM(
        "info", // Informational messages
        "warning", // Warning alerts
        "error", // Error messages (e.g., invalid email, system issues)
        "success", // Success messages (e.g., operation successful)
        "duplicate_email", // Specific to duplicate email notifications
        "system_update", // For system updates
        "user_message" // For custom user messages
      ),
      defaultValue: "info", // Default type is informational
    },
    // Indicates whether the notification has been read or not
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Optional: This could be used to store any metadata related to the notification, such as a link or reference
    metadata: {
      type: DataTypes.JSONB, // Flexible to store additional data like links, user actions, etc.
      allowNull: true,
    },
  },
  {
    underscored: true,
    timestamps: true,
    schema: "public",
  }
);

export default Notification;

// ========================= Relations ============================

// Define associations
User.hasMany(Notification, {
  foreignKey: "userUuid",
  sourceKey: "uuid",
  as: "notifications",
});

Notification.belongsTo(User, {
  foreignKey: "userUuid",
  targetKey: "uuid",
  as: "user",
});

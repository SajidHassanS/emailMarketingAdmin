import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";
import User from "../user/user.model.js";
import Admin from "../admin/admin.model.js";

const Message = sequelize.define(
    "Message",
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        senderUuid: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        senderType: {
            type: DataTypes.ENUM("user", "admin"),
            allowNull: false,
        },
        receiverUuid: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        receiverType: {
            type: DataTypes.ENUM("user", "admin"),
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isNotification: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        schema: "public",
        timestamps: true,
        underscored: true,
    }
);

export default Message;

// ========================= Relations ============================

// 1. For User as sender:
User.hasMany(Message, {
    foreignKey: "senderUuid",
    sourceKey: "uuid",
    as: "sentMessagesByUser",  // Changed alias for sent messages by user
});

Message.belongsTo(User, {
    foreignKey: "senderUuid",
    targetKey: "uuid",
    as: "senderByUser",  // Changed alias for sender being a user
    constraints: false,
});

// 2. For Admin as sender:
Admin.hasMany(Message, {
    foreignKey: "senderUuid",
    sourceKey: "uuid",
    as: "sentMessagesByAdmin",  // Changed alias for sent messages by admin
});

Message.belongsTo(Admin, {
    foreignKey: "senderUuid",
    targetKey: "uuid",
    as: "senderByAdmin",  // Changed alias for sender being an admin
    constraints: false,
});

// 3. For User as receiver:
User.hasMany(Message, {
    foreignKey: "receiverUuid",
    sourceKey: "uuid",
    as: "receivedMessagesByUser",  // Changed alias for received messages by user
});

Message.belongsTo(User, {
    foreignKey: "receiverUuid",
    targetKey: "uuid",
    as: "receiverByUser",  // Changed alias for receiver being a user
    constraints: false,
});

// 4. For Admin as receiver:
Admin.hasMany(Message, {
    foreignKey: "receiverUuid",
    sourceKey: "uuid",
    as: "receivedMessagesByAdmin",  // Changed alias for received messages by admin
});

Message.belongsTo(Admin, {
    foreignKey: "receiverUuid",
    targetKey: "uuid",
    as: "receiverByAdmin",  // Changed alias for receiver being an admin
    constraints: false,
});

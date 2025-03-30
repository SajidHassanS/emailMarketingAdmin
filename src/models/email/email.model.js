import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";
import User from "../user/user.model.js";

const Email = sequelize.define(
  "Email",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true }, // Ensure valid email format
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("good", "bad", "pending"),
      defaultValue: "pending",
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    emailScreenshot: {
      type: DataTypes.STRING, // email Screenshot (optional)
      allowNull: true,
    },
    remarks: {
      type: DataTypes.STRING,
    },
    userUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "User", key: "uuid" },
    },
  },
  {
    underscored: true,
    timestamps: true,
    schema: "public",
  }
);

export default Email;

// ========================= Relations ============================

// Define associations
User.hasMany(Email, {
  foreignKey: "userUuid",
  sourceKey: "uuid",
  as: "emails",
});

Email.belongsTo(User, {
  foreignKey: "userUuid",
  targetKey: "uuid",
  as: "user",
});

import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";
import Password from "../password/password.model.js";

const User = sequelize.define(
  "User",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    referCode: {
      type: DataTypes.STRING,
    },
    // bonus: {
    //   type: DataTypes.FLOAT,
    // },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    profileImg: {
      type: DataTypes.STRING, // Profile image (optional)
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    passwordUuid: {
      type: DataTypes.UUID,
      references: { model: "Password", key: "uuid" },
      allowNull: true, // Initially null if no passwords exist
    },
    userTitle: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    schema: "public",
    timestamps: true,
    underscored: true,
  }
);

export default User;

// ========================= Relations ============================

// Define associations
Password.hasMany(User, {
  foreignKey: "passwordUuid",
  sourceKey: "uuid",
  onDelete: "RESTRICT", // Prevents deleting a password if assigned to a user
});

User.belongsTo(Password, {
  foreignKey: "passwordUuid",
  targetKey: "uuid",
  onDelete: "SET NULL", // If a password is deleted, user's passwordUuid becomes NULL
});

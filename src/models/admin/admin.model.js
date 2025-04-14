import sequelize from "../../config/dbConfig.js";
import { DataTypes } from "sequelize";

const Admin = sequelize.define(
  "Admin",
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
    password: {
      type: DataTypes.STRING, // ✅ ADD THIS FIELD
      allowNull: false, // Users must have a password
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("superadmin", "admin"),
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Admin approval status
    },
    profileImg: {
      type: DataTypes.STRING, // Profile image (optional)
      allowNull: true,
    },
  },
  {
    schema: "public",
    timestamps: true,
    underscored: true,
  }
);

export default Admin;

import sequelize from "../../config/dbConfig.js";
import { DataTypes } from "sequelize";

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
    bonus: {
      type: DataTypes.FLOAT,
    },
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
    }
  },
  {
    schema: "public",
    timestamps: true,
    underscored: true,
  }
);

export default User;

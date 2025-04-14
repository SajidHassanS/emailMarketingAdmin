import sequelize from "../../config/dbConfig.js";
import { DataTypes } from "sequelize";

const BlacklistToken = sequelize.define(
  "BlacklistToken",
  {
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    expiry: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    schema: "public",
    underscored: true,
  }
);

export default BlacklistToken;

import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";

const SystemSetting = sequelize.define(
  "SystemSetting",
  {
    key: {
      type: DataTypes.STRING,
      unique: true,
      primaryKey: true,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    underscored: true,
    timestamps: true,
    schema: "public",
  }
);

export default SystemSetting;

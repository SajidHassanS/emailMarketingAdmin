import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";

const MarqueeMessage = sequelize.define(
  "MarqueeMessage",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    schema: "public",
    timestamps: true,
    underscored: true,
  }
);

export default MarqueeMessage;

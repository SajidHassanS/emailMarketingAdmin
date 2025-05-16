import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";

const FAQ = sequelize.define(
  "FAQ",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    question: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    answer: {
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

export default FAQ;

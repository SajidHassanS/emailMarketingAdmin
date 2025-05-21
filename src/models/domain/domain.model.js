import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";

const Domain = sequelize.define(
  "Domain",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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

export default Domain;

import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";
import User from "../user/user.model.js";

const Phone = sequelize.define(
  "Phone",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "User",
        key: "uuid",
      },
      onDelete: "CASCADE",
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    schema: "public",
    timestamps: true,
    underscored: true,
  }
);

export default Phone;

// ========================= Relations ============================

// Define associations
User.hasMany(Phone, {
  foreignKey: "userUuid",
  as: "otherPhones",
  onDelete: "CASCADE",
});

Phone.belongsTo(User, {
  foreignKey: "userUuid",
  as: "user",
});

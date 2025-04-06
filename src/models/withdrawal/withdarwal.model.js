import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";
import User from "../user/user.model.js";

const Withdrawal = sequelize.define(
  "Withdrawal",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "User", key: "uuid" },
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    method: {
      type: DataTypes.ENUM("easypaisa", "jazzcash"),
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
  },
  {
    underscored: true,
    timestamps: true,
    schema: "public",
  }
);

export default Withdrawal;

// ========================= Relations ============================

// User has many withdrawals
User.hasMany(Withdrawal, {
  foreignKey: "userUuid",
  sourceKey: "uuid",
  as: "withdrawals",
});

// Withdrawal belongs to a user
Withdrawal.belongsTo(User, {
  foreignKey: "userUuid",
  targetKey: "uuid",
  as: "user",
});

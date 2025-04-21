import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";
import Bonus from "./bonus.model.js";
import User from "../user/user.model.js";
import WithdrawalMethod from "./withdrawalMethod.model.js";

const BonusWithdrawal = sequelize.define(
  "BonusWithdrawal",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bonusUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Bonuses",
        key: "uuid",
      },
      onDelete: "CASCADE",
    },
    // userUuid: {
    //   type: DataTypes.UUID,
    //   allowNull: false,
    //   references: {
    //     model: "Users",
    //     key: "uuid",
    //   },
    //   onDelete: "CASCADE",
    // },
    // withdrawalMethodUuid: {
    //   type: DataTypes.UUID,
    //   allowNull: false,
    //   references: { model: "WithdrawalMethod", key: "uuid" },
    // },
    status: {
      type: DataTypes.ENUM("pending", "approved", "withdrawn"),
      defaultValue: "pending",
    },
  },
  {
    schema: "public",
    timestamps: true,
    underscored: true,
  }
);

export default BonusWithdrawal;

// ===================== Associations ======================

Bonus.hasOne(BonusWithdrawal, {
  foreignKey: "bonusUuid",
  as: "withdrawal",
  onDelete: "CASCADE",
});

BonusWithdrawal.belongsTo(Bonus, {
  foreignKey: "bonusUuid",
  as: "bonus",
});

User.hasMany(BonusWithdrawal, {
  foreignKey: "userUuid",
  as: "bonusWithdrawals",
});

BonusWithdrawal.belongsTo(User, {
  foreignKey: "userUuid",
  as: "user",
});

WithdrawalMethod.hasMany(BonusWithdrawal, {
  foreignKey: "withdrawalMethodUuid",
  as: "bonusWithdrawals",
});

BonusWithdrawal.belongsTo(WithdrawalMethod, {
  foreignKey: "withdrawalMethodUuid",
  as: "withdrawalMethod",
});

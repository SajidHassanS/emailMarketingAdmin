import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";
import User from "../user/user.model.js";

const Bonus = sequelize.define(
  "Bonus",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "Users", key: "uuid" },
      onDelete: "CASCADE",
    },
    type: {
      type: DataTypes.ENUM("signup", "referral"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unlockedAfterFirstWithdrawal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    refereeUuid: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: "uuid",
      },
    },
  },
  {
    schema: "public",
    timestamps: true,
    underscored: true,
  }
);

export default Bonus;

// ========================= Relations ============================

// Define associations
User.hasMany(Bonus, {
  foreignKey: "userUuid",
  as: "bonuses",
  onDelete: "CASCADE",
});

Bonus.belongsTo(User, {
  foreignKey: "userUuid",
  as: "user",
});

// relationship with the referee (the user who used the referral code)
Bonus.belongsTo(User, {
  foreignKey: "refereeUuid",
  as: "referee",
});

import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";
import User from "../user/user.model.js";

const WithdrawalMethod = sequelize.define(
  "WithdrawalMethod",
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
    methodType: {
      type: DataTypes.ENUM("easypaisa", "jazzcash", "bank"),
      allowNull: false,
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accountTitle: {
      type: DataTypes.STRING,
      allowNull: true, // Optional for mobile wallet methods
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    underscored: true,
    timestamps: true,
    schema: "public",
  }
);

export default WithdrawalMethod;

// ========================= Relations ============================

// User has many withdrawal methods
User.hasMany(WithdrawalMethod, {
  foreignKey: "userUuid",
  sourceKey: "uuid",
  as: "withdrawalMethods",
});

// WithdrawalMethod belongs to a user
WithdrawalMethod.belongsTo(User, {
  foreignKey: "userUuid",
  targetKey: "uuid",
  as: "user",
});

import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";
import Email from "./email.model.js";
import User from "../user/user.model.js";

const DuplicateEmail = sequelize.define(
  "DuplicateEmail",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    emailUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Email, key: "uuid" },
    },
    uploadedByUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: User, key: "uuid" },
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false, // Store the filename of the uploaded screenshot
    },
  },
  {
    schema: "public",
    timestamps: true,
    underscored: true,
  }
);

export default DuplicateEmail;

// ========================= Relations ============================
// Define associations

// One email can have multiple duplicate entries
Email.hasMany(DuplicateEmail, {
  foreignKey: "emailUuid",
  sourceKey: "uuid",
  as: "duplicates",
});

DuplicateEmail.belongsTo(Email, {
  foreignKey: "emailUuid",
  targetKey: "uuid",
  as: "originalEmail",
});

// Track which user uploaded the duplicate email
User.hasMany(DuplicateEmail, {
  foreignKey: "uploadedByUuid",
  sourceKey: "uuid",
  as: "duplicateUploads",
});

DuplicateEmail.belongsTo(User, {
  foreignKey: "uploadedByUuid",
  targetKey: "uuid",
  as: "uploader",
});

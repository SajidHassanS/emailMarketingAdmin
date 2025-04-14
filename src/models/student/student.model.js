// import sequelize from "../../config/dbConfig.js";
// import { DataTypes } from "sequelize";

// const Student = sequelize.define(
//   "Student",
//   {
//     uuid: {
//       type: DataTypes.UUID,
//       defaultValue: DataTypes.UUIDV4,
//       primaryKey: true,
//     },
//     firstName: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     lastName: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     email: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       unique: true,
//     },
//     countryCode: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     phone: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     password: {
//       type: DataTypes.STRING, // ✅ ADD THIS FIELD
//       allowNull: false, // Users must have a password
//     },
//     dateOfBirth: {
//       type: DataTypes.DATE,
//       allowNull: true, // Optional
//     },
//     cnic: {
//       type: DataTypes.STRING,
//       allowNull: true, // Optional
//       unique: true,
//     },
//     gender: {
//       type: DataTypes.ENUM("male", "female", "other"),
//       allowNull: true, // Optional
//     },
//     education: {
//       type: DataTypes.STRING, // Array of educational qualifications (filled later)
//       allowNull: true,
//     },
//     experience: {
//       type: DataTypes.STRING, // Array of job experiences (filled later)
//       allowNull: true,
//     },
//     address: {
//       type: DataTypes.STRING, // Address (filled later)
//       allowNull: true,
//     },
//     tehsil: {
//       type: DataTypes.STRING, // tehsil (filled later)
//       allowNull: true,
//     },
//     district: {
//       type: DataTypes.STRING, // district (filled later)
//       allowNull: true,
//     },
//     province: {
//       type: DataTypes.STRING, // province (filled later)
//       allowNull: true,
//     },
//     profileImg: {
//       type: DataTypes.STRING, // Profile image (optional)
//       allowNull: true,
//     },
//     otp: {
//       type: DataTypes.INTEGER,
//     },
//     otpCount: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },
//     canChangePassword: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//     },
//     profileCompleted: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//     },
//   },
//   {
//     underscored: true,
//     timestamps: true,
//     schema: "public",
//   }
// );

// export default Student;

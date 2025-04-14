// import sequelize from "../../config/dbConfig.js";
// import { DataTypes } from "sequelize";

// const Employer = sequelize.define(
//     "Employer",
//     {
//         uuid: {
//             type: DataTypes.UUID,
//             defaultValue: DataTypes.UUIDV4,
//             primaryKey: true,
//         },
//         email: {
//             type: DataTypes.STRING,
//             allowNull: false,
//             unique: true,
//         },
//         password: {
//             type: DataTypes.STRING, // ✅ ADD THIS FIELD
//             allowNull: false, // Users must have a password
//         },
//         name: {
//             type: DataTypes.STRING,
//             allowNull: false,
//         },
//         description: {
//             type: DataTypes.TEXT,
//             allowNull: true, // Short description about the employer
//         },
//         organization: {
//             type: DataTypes.STRING,
//             allowNull: false,
//         },
//         industry: {
//             type: DataTypes.STRING,
//             allowNull: true, // The sector the employer operates in
//         },
//         countryCode: {
//             type: DataTypes.STRING,
//             allowNull: false,
//         },
//         phone: {
//             type: DataTypes.STRING,
//             allowNull: false,
//         },
//         address: {
//             type: DataTypes.STRING, // Address (filled later)
//             allowNull: true,
//         },
//         tehsil: {
//             type: DataTypes.STRING, // tehsil (filled later)
//             allowNull: true,
//         },
//         district: {
//             type: DataTypes.STRING, // district (filled later)
//             allowNull: true,
//         },
//         province: {
//             type: DataTypes.STRING, // province (filled later)
//             allowNull: true,
//         },
//         status: {
//             type: DataTypes.ENUM("pending", "approved", "rejected"),
//             defaultValue: "pending", // Admin approval status
//         },
//         profileImg: {
//             type: DataTypes.STRING, // Profile image (optional)
//             allowNull: true,
//         },
//         otp: {
//             type: DataTypes.INTEGER,
//         },
//         otpCount: {
//             type: DataTypes.INTEGER,
//             defaultValue: 0,
//         },
//         canChangePassword: {
//             type: DataTypes.BOOLEAN,
//             defaultValue: false,
//         },
//     },
//     {
//         schema: "public",
//         underscored: true,
//         timestamps: true,
//     }
// );

// export default Employer;

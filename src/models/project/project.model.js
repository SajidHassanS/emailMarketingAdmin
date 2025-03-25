// import sequelize from "../../config/dbConfig.js";
// import { DataTypes } from "sequelize";

// const Project = sequelize.define(
//   "Project",
//   {
//     uuid: {
//       type: DataTypes.UUID,
//       defaultValue: DataTypes.UUIDV4,
//       primaryKey: true,
//     },
//     createdByUuid: {
//       type: DataTypes.UUID,
//       allowNull: false, // Must belong to either Employer or Admin
//     },
//     creatorType: {
//       type: DataTypes.ENUM("admin", "employer"), // Identifies who created the project
//       allowNull: false,
//     },
//     title: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     trade: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     sector: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     description: {
//       type: DataTypes.TEXT,
//       allowNull: false,
//     },
//     requirements: {
//       type: DataTypes.JSONB,
//     },

//     // Location Breakdown
//     location: {
//       type: DataTypes.ARRAY(DataTypes.FLOAT),
//       allowNull: true,
//     },
//     address: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     tehsil: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     district: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     province: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },

//     // Dates
//     duration: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     startDate: {
//       type: DataTypes.DATEONLY,
//       allowNull: false,
//     },
//     endDate: {
//       type: DataTypes.DATEONLY,
//       allowNull: false,
//     },
//     deadline: {
//       type: DataTypes.DATEONLY,
//       allowNull: false,
//     },

//     // Slots & Status
//     totalSlots: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     slotsFilled: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       defaultValue: 0,
//     },
//     status: {
//       type: DataTypes.ENUM("pending", "open", "closed", 'rejected'),
//       defaultValue: "pending",
//     },
//     approvedby: {
//       type: DataTypes.UUID,
//       allowNull: true,
//     }
//   },
//   {
//     schema: "public",
//     underscored: true,
//     timestamps: true,
//   }
// );

// export default Project;

// // ========================= Relations ============================
// import Admin from "../user/user.model.js";
// import Employer from "../employer/employer.model.js";

// // Define associations dynamically using a scope condition
// Admin.hasMany(Project, {
//   foreignKey: "createdByUuid",
//   constraints: false,
//   scope: {
//     creatorType: "admin", // Ensures only projects created by Admins are associated
//   },
//   as: "adminProjects",
// });

// Project.belongsTo(Admin, {
//   foreignKey: "createdByUuid",
//   constraints: false,
//   as: "admin",
//   targetKey: "uuid",
// });

// Employer.hasMany(Project, {
//   foreignKey: "createdByUuid",
//   constraints: false,
//   scope: {
//     creatorType: "employer", // Ensures only projects created by Employers are associated
//   },
//   as: "employerProjects",
// });

// Project.belongsTo(Employer, {
//   foreignKey: "createdByUuid",
//   constraints: false,
//   as: "employer",
//   targetKey: "uuid",
// });

// import sequelize from "../../config/dbConfig.js";
// import { DataTypes } from "sequelize";
// import Project from "../project/project.model.js";
// import Student from "../student/student.model.js";

// const Application = sequelize.define(
//   "Application",
//   {
//     uuid: {
//       type: DataTypes.UUID,
//       defaultValue: DataTypes.UUIDV4,
//       primaryKey: true,
//     },
//     studentUuid: {
//       type: DataTypes.UUID,
//       allowNull: false,
//       references: {
//         model: "student.Student",
//         key: "uuid",
//       },
//       onDelete: "CASCADE",
//     },
//     projectUuid: {
//       type: DataTypes.UUID,
//       allowNull: false,
//       references: {
//         model: "employer.Project",
//         key: "uuid",
//       },
//       onDelete: "CASCADE",
//     },
//     status: {
//       type: DataTypes.ENUM("pending", "accepted", "rejected"),
//       defaultValue: "pending",
//     },
//     reviewedByUuid: {
//       type: DataTypes.UUID,
//       allowNull: true,
//     },
//   },
//   {
//     underscored: true,
//     timestamps: true,
//     schema: "public",
//   }
// );

// export default Application;

// // ========================= Relations ============================

// // Define associations
// Student.hasMany(Application, {
//   foreignKey: "studentUuid",
//   sourceKey: "uuid",
//   onDelete: "CASCADE",
//   as: "applications",
// });
// Application.belongsTo(Student, {
//   foreignKey: "studentUuid",
//   targetKey: "uuid",
//   onDelete: "CASCADE",
//   as: "student",
// });

// Project.hasMany(Application, {
//   foreignKey: "projectUuid",
//   sourceKey: "uuid",
//   onDelete: "CASCADE",
//   as: "applications",
// });
// Application.belongsTo(Project, {
//   foreignKey: "projectUuid",
//   targetKey: "uuid",
//   onDelete: "CASCADE",
//   as: "project",
// });

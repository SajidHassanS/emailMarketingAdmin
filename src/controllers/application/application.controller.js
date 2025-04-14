// import { Op } from "sequelize";
// import Application from "../../models/application/application.model.js";
// import Employer from "../../models/employer/employer.model.js";
// import Project from "../../models/project/project.model.js";
// // import Employer from "../../models/Employer/employer.model.js";
// import { queryReqFields } from "../../utils/requiredFields.js";
// import {
//   created,
//   catchError,
//   successOk,
//   validationError,
//   successOkWithData,
//   frontError,
// } from "../../utils/responses.js";
// import Admin from "../../models/user/user.model.js";
// import Student from "../../models/student/student.model.js";

// // Get all applications
// export const getFilteredApplications = async (req, res) => {
//   try {
//     const { status, district, reviewed, trade, sector, duration, deadline } =
//       req.query;

//     const where = {};
//     if (status) where.status = status;
//     if (reviewed === "false") where.reviewedByUuid = null; // Show only unreviewed applications
//     // ✅ Define filters for associated project details
//     const projectWhere = {};
//     if (district) projectWhere.district = district;
//     if (trade) projectWhere.trade = trade;
//     if (sector) projectWhere.sector = sector;
//     if (duration) projectWhere.duration = duration;

//     // ✅ Filter by project deadline (applications where project deadline is <= given date)
//     if (deadline) projectWhere.deadline = { [Op.lte]: deadline };

//     const applications = await Application.findAll({
//       where,
//       include: [
//         {
//           model: Project,
//           as: "project",
//           order: [["createdAt", "Desc"]],
//           attributes: {
//             exclude: ["createdAt", "updatedAt"],
//           },
//           where: projectWhere,
//           include: [
//             {
//               model: Admin,
//               as: "admin",
//               required: false, // Ensures it doesn't break if the project creator is an employer
//               attributes: {
//                 exclude: [
//                   "password",
//                   "otp",
//                   "otpCount",
//                   "canChangePassword",
//                   "createdAt",
//                   "updatedAt",
//                 ],
//               },
//             },
//             {
//               model: Employer,
//               as: "employer",
//               required: false, // Ensures it doesn't break if the project creator is an admin
//               attributes: {
//                 exclude: [
//                   "password",
//                   "otp",
//                   "otpCount",
//                   "canChangePassword",
//                   "createdAt",
//                   "updatedAt",
//                 ],
//               },
//             },
//           ],
//         },
//         {
//           model: Student,
//           as: "student",
//           attributes: {
//             exclude: [
//               "password",
//               "otp",
//               "otpCount",
//               "canChangePassword",
//               "createdAt",
//               "updatedAt",
//             ],
//           },
//         },
//       ],
//     });
//     if (!applications || applications.length === 0)
//       return successOk(res, "No applications found.");

//     return successOkWithData(
//       res,
//       "Applications retrieved successfully",
//       applications
//     );
//   } catch (error) {
//     console.log(error);
//     return catchError(res, error);
//   }
// };

// // Get application details
// export const getApplicationData = async (req, res) => {
//   try {
//     const reqBodyFields = queryReqFields(req, res, ["uuid"]);
//     if (reqBodyFields.error) return reqBodyFields.response;
//     const { uuid } = req.query;

//     const applications = await Application.findOne({
//       where: { uuid },
//       include: [
//         {
//           model: Project,
//           as: "project",
//           include: [
//             {
//               model: Admin,
//               as: "admin",
//               required: false, // Ensures it doesn't break if the project creator is an employer
//               attributes: {
//                 exclude: [
//                   "password",
//                   "otp",
//                   "otpCount",
//                   "canChangePassword",
//                   "createdAt",
//                   "updatedAt",
//                 ],
//               },
//             },
//             {
//               model: Employer,
//               as: "employer",
//               required: false, // Ensures it doesn't break if the project creator is an admin
//               attributes: {
//                 exclude: [
//                   "password",
//                   "otp",
//                   "otpCount",
//                   "canChangePassword",
//                   "createdAt",
//                   "updatedAt",
//                 ],
//               },
//             },
//           ],
//         },
//         {
//           model: Student,
//           as: "student",
//           attributes: {
//             exclude: [
//               "password",
//               "otp",
//               "otpCount",
//               "canChangePassword",
//               "createdAt",
//               "updatedAt",
//             ],
//           },
//         },
//       ],
//     });
//     if (!applications || applications.length === 0)
//       return frontError(res, "Invalid uuid.");

//     return successOkWithData(
//       res,
//       "Applications retrieved successfully",
//       applications
//     );
//   } catch (error) {
//     return catchError(res, error);
//   }
// };

// // ========================= Approve Project ============================

// export async function approveApplication(req, res) {
//   try {
//     const userUid = req.user.uuid;
//     const reqBodyFields = queryReqFields(req, res, ["uuid"]);
//     if (reqBodyFields.error) return reqBodyFields.response;

//     const { uuid } = req.query;

//     const application = await Application.findByPk(uuid);
//     if (!application) return frontError(res, "Invalid uuid.");

//     const applictaionStatus = application.status;
//     if (applictaionStatus === "accepted")
//       return validationError(res, "Application is already approved.");

//     const fieldsToUpdate = {
//       status: "accepted",
//       reviewedByUuid: userUid,
//     };

//     await application.update(fieldsToUpdate, {
//       where: { uuid },
//     });

//     return successOkWithData(res, "Application approved successfully.");
//   } catch (error) {
//     return catchError(res, error);
//   }
// }

// // ========================= Reject Project ============================

// export async function rejectApplication(req, res) {
//   try {
//     const userUid = req.user.uuid;
//     const reqBodyFields = queryReqFields(req, res, ["uuid"]);
//     if (reqBodyFields.error) return reqBodyFields.response;

//     const { uuid } = req.query;

//     const application = await Application.findByPk(uuid);
//     if (!application) return frontError(res, "Invalid uuid.");

//     const applictaionStatus = application.status;
//     if (applictaionStatus === "rejected")
//       return validationError(res, "Application is already rejected.");

//     const fieldsToUpdate = {
//       status: "rejected",
//       reviewedByUuid: userUid,
//     };

//     await application.update(fieldsToUpdate, {
//       where: { uuid },
//     });

//     return successOkWithData(res, "Application rejected successfully.");
//   } catch (error) {
//     return catchError(res, error);
//   }
// }
// // ========================= Application stats ============================

// export async function applicationsStats(req, res) {
//   try {
//     const totalApplicationCount = await Application.count();
//     const pendingApplicationCount = await Application.count({
//       where: { status: "pending" },
//     });
//     const acceptedApplicationCount = await Application.count({
//       where: { status: "accepted" },
//     });
//     const rejectedApplicationCount = await Application.count({
//       where: { status: "rejected" },
//     });

//     return successOkWithData(res, "Stats fetched successfully.", {
//       totalApplicationCount,
//       pendingApplicationCount,
//       acceptedApplicationCount,
//       rejectedApplicationCount,
//     });
//   } catch (error) {
//     return catchError(res, error);
//   }
// }

// import { Op, Sequelize } from "sequelize";
// import { bodyReqFields, queryReqFields } from "../../utils/requiredFields.js";
// import {
//   created,
//   catchError,
//   successOk,
//   successOkWithData,
//   sequelizeValidationError,
//   frontError,
//   validationError,
// } from "../../utils/responses.js";
// import Project from "../../models/project/project.model.js";
// import { convertToLowercase } from "../../utils/utils.js";
// import Admin from "../../models/user/user.model.js";
// import Employer from "../../models/employer/employer.model.js";

// // ========================= Add Project ============================
// export async function addProject(req, res) {
//   try {
//     const userUid = req.user.uuid

//     // const adminExist = await Admin.findByPk(userUid)
//     // console.log(adminExist)
//     // if (adminExist) return frontError(res, "Invalid token.")

//     const reqBodyFields = bodyReqFields(req, res, [
//       "title",
//       "trade",
//       "sector",
//       "description",
//       "requirements",
//       "location",
//       "address",
//       "tehsil",
//       "district",
//       "province",
//       "duration",
//       "startDate",
//       "endDate",
//       "deadline",
//       "totalSlots"
//     ]);
//     if (reqBodyFields.error) return reqBodyFields.response;

//     // ✅ Convert relevant fields to lowercase (excluding sensitive ones)
//     const excludedFields = ["startDate", "endDate", "totalSlots"];
//     const requiredData = convertToLowercase(req.body, excludedFields);
//     let { title, trade, sector, description, requirements, location, address, tehsil, district, province, duration, startDate, endDate, deadline, totalSlots
//     } = requiredData;

//     const projectData = {
//       title,
//       trade,
//       sector,
//       description,
//       requirements,
//       location,
//       address,
//       tehsil,
//       district,
//       province,
//       duration,
//       startDate,
//       endDate,
//       deadline,
//       totalSlots,
//       slotsFilled: 0,
//       createdByUuid: userUid,
//       creatorType: 'admin',
//       status: 'open',
//       approvedby: userUid
//     }

//     await Project.create(projectData);
//     return created(res, "Project created successfully.");
//   } catch (error) {
//     console.log(error);
//     if (error instanceof Sequelize.ValidationError) {
//       return sequelizeValidationError(res, error);
//     }
//     return catchError(res, error);
//   }
// }

// // ========================= Get All Projects ============================

// export async function getAllProjects(req, res) {
//   try {
//     const { status, district, trade, sector, duration, deadline } = req.query;

//     const where = {};
//     if (status) where.status = status;
//     // ✅ Define filters for associated project details
//     if (district) where.district = district;
//     if (trade) where.trade = trade;
//     if (sector) where.sector = sector;
//     if (duration) where.duration = duration;

//     // ✅ Filter by project deadline (applications where project deadline is <= given date)
//     if (deadline) where.deadline = { [Op.lte]: deadline };
//     const projects = await Project.findAll({
//       where,
//       order: [["createdAt", "Desc"]],
//       include: [
//         {
//           model: Admin,
//           as: "admin",
//           required: false, // Ensures it doesn't break if the project creator is an employer
//         },
//         {
//           model: Employer,
//           as: "employer",
//           required: false, // Ensures it doesn't break if the project creator is an admin
//         },
//       ]
//     });
//     return successOkWithData(res, "Projects retrieved successfully", projects);
//   } catch (error) {
//     return catchError(res, error);
//   }
// }

// // ========================= Get Project by ID ============================

// export async function getProjectDetails(req, res) {
//   try {
//     const reqBodyFields = queryReqFields(req, res, ["uuid"]);
//     if (reqBodyFields.error) return reqBodyFields.response;

//     const { uuid } = req.query;

//     const project = await Project.findByPk(uuid);
//     if (!project) return frontError(res, "Invalid uuid.");
//     return successOkWithData(res, "Project retrieved successfully", project);
//   } catch (error) {
//     return catchError(res, error);
//   }
// }

// // ========================= Update Project ============================

// export async function updateProjectDetails(req, res) {
//   try {
//     const userUid = req.user.uuid

//     const reqBodyFields = queryReqFields(req, res, ["uuid"]);
//     if (reqBodyFields.error) return reqBodyFields.response;

//     const { uuid } = req.query;

//     const project = await Project.findByPk(uuid);
//     if (!project) return frontError(res, "Invalid uuid.");

//     const {
//       title,
//       trade,
//       sector,
//       description,
//       requirements,
//       location,
//       address,
//       tehsil,
//       district,
//       province,
//       duration,
//       startDate,
//       endDate,
//       deadline,
//       totalSlots
//     } = req.body

//     let fieldsToUpdate = {};

//     if (title) fieldsToUpdate.title = title;
//     if (trade) fieldsToUpdate.trade = trade;
//     if (sector) fieldsToUpdate.sector = sector;
//     if (description) fieldsToUpdate.description = description;
//     if (requirements) fieldsToUpdate.requirements = description;
//     if (location) fieldsToUpdate.location = location;
//     if (address) fieldsToUpdate.address = address;
//     if (tehsil) fieldsToUpdate.tehsil = tehsil;
//     if (district) fieldsToUpdate.district = district;
//     if (province) fieldsToUpdate.province = province;
//     if (duration) fieldsToUpdate.duration = duration;
//     if (startDate) fieldsToUpdate.startDate = startDate;
//     if (endDate) fieldsToUpdate.endDate = endDate;
//     if (deadline) fieldsToUpdate.deadline = deadline;
//     if (totalSlots) fieldsToUpdate.totalSlots = totalSlots;

//     fieldsToUpdate.approvedby = userUid;

//     const excludedFields = ["location", "startDate", "endDate", "totalSlots"];
//     const fieldsToUpdateLowered = convertToLowercase(fieldsToUpdate, excludedFields);

//     await project.update(fieldsToUpdateLowered, {
//       where: { uuid },
//     });
//     return successOk(res, "Project updated successfully");
//   } catch (error) {
//     return catchError(res, error);
//   }
// }

// // ========================= Delete Project ============================

// export async function deleteProject(req, res) {
//   try {
//     const reqBodyFields = queryReqFields(req, res, ["uuid"]);
//     if (reqBodyFields.error) return reqBodyFields.response;

//     const { uuid } = req.query;

//     const project = await Project.findByPk(uuid);
//     if (!project) return frontError(res, "Invalid uuid.");

//     await project.destroy();
//     return successOkWithData(res, "Project deleted successfully");
//   } catch (error) {
//     return catchError(res, error);
//   }
// }
// // ========================= Approve Project ============================

// export async function approveProject(req, res) {
//   try {
//     const userUid = req.user.uuid

//     const reqBodyFields = queryReqFields(req, res, ["uuid"]);
//     if (reqBodyFields.error) return reqBodyFields.response;

//     const { uuid } = req.query;

//     const project = await Project.findByPk(uuid);
//     if (!project) return frontError(res, "Invalid uuid.");

//     const projectStatus = project.status
//     if (projectStatus === 'open') return validationError(res, "project is already approved.")

//     const fieldsToUpdate = {
//       status: "open",
//       approvedby: userUid
//     };

//     await project.update(fieldsToUpdate, {
//       where: { uuid },
//     });

//     return successOkWithData(res, "Project approved successfully.");
//   } catch (error) {
//     return catchError(res, error);
//   }
// }

// // ========================= Reject Project ============================

// export async function rejectProject(req, res) {
//   try {
//     const userUid = req.user.uuid

//     const reqBodyFields = queryReqFields(req, res, ["uuid"]);
//     if (reqBodyFields.error) return reqBodyFields.response;

//     const { uuid } = req.query;

//     const project = await Project.findByPk(uuid);
//     if (!project) return frontError(res, "Invalid uuid.");

//     const projectStatus = project.status
//     if (projectStatus === 'rejected') return validationError(res, "project is already rejected.")

//     const fieldsToUpdate = {
//       status: "rejected",
//       approvedby: userUid
//     };

//     await project.update(fieldsToUpdate, {
//       where: { uuid },
//     });

//     return successOkWithData(res, "Project rejected successfully.");
//   } catch (error) {
//     return catchError(res, error);
//   }
// }

// // ========================= Project stats ============================

// export async function projectStats(req, res) {
//   try {
//     const totalProjectCount = await Project.count()
//     const pendingProjectCount = await Project.count({ where: { status: 'pending' } })
//     const openProjectCount = await Project.count({ where: { status: 'open' } })
//     const closedProjectCount = await Project.count({ where: { status: 'closed' } })
//     const rejectedProjectCount = await Project.count({ where: { status: 'rejected' } })

//     return successOkWithData(res, "Stats fetched successfully.", { totalProjectCount, pendingProjectCount, openProjectCount, closedProjectCount, rejectedProjectCount });
//   } catch (error) {
//     return catchError(res, error);
//   }
// }
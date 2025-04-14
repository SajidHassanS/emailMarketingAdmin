import { Op, Sequelize } from "sequelize";
import { bodyReqFields, queryReqFields } from "../../utils/requiredFields.js";
import {
  created,
  catchError,
  successOk,
  successOkWithData,
  sequelizeValidationError,
  frontError,
  validationError,
} from "../../utils/responses.js";
// import Project from "../../models/project/project.model.js";
import {
  convertToLowercase,
  isValidCategory,
  validateCountryCode,
  validatePhone,
  validateUsername,
} from "../../utils/utils.js";
// import Admin from "../../models/user/user.model.js";
// import Employer from "../../models/employer/employer.model.js";
import User from "../../models/user/user.model.js";
import { hashPassword, validatePassword } from "../../utils/passwordUtils.js";
import Admin from "../../models/admin/admin.model.js";

// ========================= Helping Functions ============================

const generateUserTitle = async (category, userUid, username) => {
  // Find the user's registration position based on created_at
  const userNumber = await User.count({
    where: {
      createdAt: { [Op.lte]: (await User.findByPk(userUid)).createdAt },
    },
  });

  // Format userNumber as a 4-digit number
  const formattedNumber = String(userNumber).padStart(4, "0");

  // Construct the userTitle
  return `${category}${formattedNumber}_${username}`;
};

// ========================= Get All Suppliers ============================

export async function getSuppliersList(req, res) {
  try {
    const { status, district, trade, sector, duration, deadline } = req.query;

    const where = {};
    // where.active = true;
    // if (status) where.status = status;
    // // ✅ Define filters for associated project details
    // if (district) where.district = district;
    // if (trade) where.trade = trade;
    // if (sector) where.sector = sector;
    // if (duration) where.duration = duration;

    // ✅ Filter by project deadline (applications where project deadline is <= given date)
    // if (deadline) where.deadline = { [Op.lte]: deadline };
    const supplierList = await User.findAll({
      where,
      // where: {
      //     active: true
      // },
      order: [["createdAt", "Desc"]],
      raw: true,
    });

    // Get unique 'createdBy' UUIDs from the supplier list
    const createdByUuids = [
      ...new Set(
        supplierList.map((user) => user.createdBy).filter((uuid) => uuid)
      ),
    ];

    // Fetch admin details for those UUIDs
    const adminDetails = createdByUuids.length
      ? await Admin.findAll({
        where: { uuid: createdByUuids },
        attributes: ["uuid", "username"],
        raw: true, // Convert to plain objects
      })
      : [];

    // Convert admin details to a dictionary (uuid -> admin object)
    const adminMap = Object.fromEntries(
      adminDetails.map((admin) => [admin.uuid, admin])
    );

    // Attach admin username to suppliers
    const suppliersWithAdmin = supplierList.map((supplier) => ({
      ...supplier,
      createdBy: supplier.createdBy
        ? adminMap[supplier.createdBy]?.username || supplier.createdBy
        : null,
    }));

    return successOkWithData(
      res,
      "Suppliers retrieved successfully.",
      suppliersWithAdmin
    );
  } catch (error) {
    console.log(error);
    return catchError(res, error);
  }
}

// ========================= Add New Supplier ============================
export async function addNewSupplier(req, res) {
  try {
    const adminUid = req.adminUid;

    // const adminExist = await Admin.findByPk(userUid)
    // console.log(adminExist)
    // if (adminExist) return frontError(res, "Invalid token.")

    // ✅ Check if required fields are provided
    const reqBodyFields = bodyReqFields(req, res, [
      "username",
      "countryCode",
      "phone",
      "password",
      "confirmPassword",
    ]);
    if (reqBodyFields.error) return reqBodyFields.response;

    // ✅ Convert relevant fields to lowercase (excluding sensitive ones)
    const excludedFields = [
      "countryCode",
      "phone",
      "password",
      "confirmPassword",
    ];
    const requiredData = convertToLowercase(req.body, excludedFields);

    let { username, countryCode, phone, password, confirmPassword, referCode } =
      requiredData;

    // ✅ Validate User Name
    const usernameError = validateUsername(username);
    if (usernameError) return validationError(res, usernameError, "username");

    // ✅ Validate Country Code
    const countryCodeError = validateCountryCode(countryCode);
    if (countryCodeError)
      return validationError(res, countryCodeError, "countryCode");

    // ✅ Validate Phone Number
    const phoneError = validatePhone(phone);
    if (phoneError) return validationError(res, phoneError, "phone");

    // ✅ Check if the Email Already Exists
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser)
      return validationError(res, "This phone is already registered.", "phone");

    // ✅ Check if Passwords Match (Explicitly Checking Here)
    if (password !== confirmPassword) {
      return validationError(res, "Passwords do not match.", "password");
    }

    // ✅ Validate Password Format
    const invalidPassword = validatePassword(password);
    if (invalidPassword) return validationError(res, invalidPassword);

    // ✅ Hash Password Before Saving
    const hashedPassword = await hashPassword(password);

    let userData = {};
    // ✅ Prepare Data for Insertion
    userData.username = username;
    userData.phone = phone;
    userData.countryCode = countryCode;
    userData.password = hashedPassword;
    if (referCode) userData.referCode = referCode;
    userData.bonus = 0; // get bonus set by admin
    userData.active = true; // user created by admin
    userData.createdBy = adminUid; // user created by admin

    // ✅ Create New User in Database
    await User.create(userData);

    return created(res, "User profile created successfully.");
  } catch (error) {
    console.log(error);
    if (error instanceof Sequelize.ValidationError) {
      return sequelizeValidationError(res, error);
    }
    return catchError(res, error);
  }
}

// // ========================= Get Supplier by uuid ============================

export async function getSupplierDetail(req, res) {
  try {
    const reqBodyFields = queryReqFields(req, res, ["uuid"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { uuid } = req.query;

    const supplier = await User.findByPk(uuid);
    if (!supplier) return frontError(res, "Invalid uuid.");

    return successOkWithData(
      res,
      "Supplier detail retrieved successfully.",
      supplier
    );
  } catch (error) {
    return catchError(res, error);
  }
}

// ========================= Update Supplier ============================

export async function updateSupplierDetail(req, res) {
  try {
    const adminUid = req.adminUid;

    const reqBodyFields = queryReqFields(req, res, ["uuid"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { uuid } = req.query;

    const supplier = await User.findByPk(uuid);
    if (!supplier) return frontError(res, "Invalid uuid.");

    const { active, bonus, category } = req.body;

    let fieldsToUpdate = {};

    if (active !== undefined) fieldsToUpdate.active = active; // Check explicitly if active is not undefined (false should be valid)
    if (bonus) fieldsToUpdate.bonus = bonus;

    fieldsToUpdate.updatedBy = adminUid;

    if (category) {
      const isCategoryValid = isValidCategory(category);

      if (!isCategoryValid)
        return frontError(
          res,
          "Invalid category. It must be a single uppercase letter (A-Z)."
        );

      const userTitle = await generateUserTitle(
        category,
        supplier.uuid,
        supplier.username
      );
      fieldsToUpdate.userTitle = userTitle;
    }

    await supplier.update(fieldsToUpdate);

    return successOk(res, "Supplier updated successfully.");
  } catch (error) {
    console.log("===== error ===== : ", error);
    return catchError(res, error);
  }
}

// ========================= Delete Supplier ============================

export async function deleteSupplier(req, res) {
  try {
    const reqBodyFields = queryReqFields(req, res, ["uuid"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { uuid } = req.query;

    const supplier = await User.findByPk(uuid);
    if (!supplier) return frontError(res, "Invalid uuid.");

    await supplier.destroy();
    return successOkWithData(res, "Supplier deleted successfully.");
  } catch (error) {
    return catchError(res, error);
  }
}

// // ========================= Approve Project ============================

// export async function approveProject(req, res) {
//     try {
//         const userUid = req.user.uuid

//         const reqBodyFields = queryReqFields(req, res, ["uuid"]);
//         if (reqBodyFields.error) return reqBodyFields.response;

//         const { uuid } = req.query;

//         const project = await Project.findByPk(uuid);
//         if (!project) return frontError(res, "Invalid uuid.");

//         const projectStatus = project.status
//         if (projectStatus === 'open') return validationError(res, "project is already approved.")

//         const fieldsToUpdate = {
//             status: "open",
//             approvedby: userUid
//         };

//         await project.update(fieldsToUpdate, {
//             where: { uuid },
//         });

//         return successOkWithData(res, "Project approved successfully.");
//     } catch (error) {
//         return catchError(res, error);
//     }
// }

// // ========================= Reject Project ============================

// export async function rejectProject(req, res) {
//     try {
//         const userUid = req.user.uuid

//         const reqBodyFields = queryReqFields(req, res, ["uuid"]);
//         if (reqBodyFields.error) return reqBodyFields.response;

//         const { uuid } = req.query;

//         const project = await Project.findByPk(uuid);
//         if (!project) return frontError(res, "Invalid uuid.");

//         const projectStatus = project.status
//         if (projectStatus === 'rejected') return validationError(res, "project is already rejected.")

//         const fieldsToUpdate = {
//             status: "rejected",
//             approvedby: userUid
//         };

//         await project.update(fieldsToUpdate, {
//             where: { uuid },
//         });

//         return successOkWithData(res, "Project rejected successfully.");
//     } catch (error) {
//         return catchError(res, error);
//     }
// }

// // ========================= Project stats ============================

// export async function projectStats(req, res) {
//     try {
//         const totalProjectCount = await Project.count()
//         const pendingProjectCount = await Project.count({ where: { status: 'pending' } })
//         const openProjectCount = await Project.count({ where: { status: 'open' } })
//         const closedProjectCount = await Project.count({ where: { status: 'closed' } })
//         const rejectedProjectCount = await Project.count({ where: { status: 'rejected' } })

//         return successOkWithData(res, "Stats fetched successfully.", { totalProjectCount, pendingProjectCount, openProjectCount, closedProjectCount, rejectedProjectCount });
//     } catch (error) {
//         return catchError(res, error);
//     }
// }

import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { fileURLToPath } from "url";
import { Op, Sequelize } from "sequelize";
import models from "../../models/models.js";
import { bodyReqFields, queryReqFields } from "../../utils/requiredFields.js";
import { hashPassword, validatePassword } from "../../utils/passwordUtils.js";
import { createNotification } from "../notification/notification.controller.js";
import {
  created,
  catchError,
  successOk,
  successOkWithData,
  sequelizeValidationError,
  frontError,
  validationError,
} from "../../utils/responses.js";
import {
  convertToLowercase,
  isValidCategory,
  validateCountryCode,
  validatePhone,
  validateUsername,
} from "../../utils/utils.js";
const { Admin, Email, User, Bonus, Password, Phone, SystemSetting } = models;

// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load OAuth2 credentials and tokens
const CREDENTIALS_PATH = path.join(__dirname, "../../../credentials.json");
const TOKENS_PATH = path.join(__dirname, "../../../tokens.json");

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8")).web;
const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uris[0]
);

oauth2Client.setCredentials(tokens);

// Instantiate the People API service
const peopleService = google.people({ version: "v1", auth: oauth2Client });

// ========================= Helping Functions ============================

const generateUserTitle = async (category, username) => {
  // Find the user with the highest userTitle starting with the category
  const lastUser = await User.findOne({
    where: {
      userTitle: {
        [Op.like]: `${category}_____%`, // e.g., A0001_username
      },
    },
    order: [["userTitle", "DESC"]],
  });

  let newNumber = 1;

  if (lastUser) {
    const match = lastUser.userTitle.match(/^([A-Z])(\d{4})_/);
    if (match) {
      newNumber = parseInt(match[2], 10) + 1;
    }
  }

  const formattedNumber = String(newNumber).padStart(4, "0");
  return `${category}${formattedNumber}_${username}`;
};

// ====================================================================

async function createOrUpdateContact(displayName, phoneNumber) {
  // Normalize to just digits for matching
  const cleanPhone = phoneNumber.replace(/\D/g, "");

  try {
    const searchRes = await peopleService.people.searchContacts({
      query: cleanPhone,
      readMask: "names,phoneNumbers",
      pageSize: 10,
      // restrict to your “Contacts” source so you don’t get directory/profile entries
      sources: ["READ_SOURCE_TYPE_CONTACT"],
    });

    // Look through the hits for an exact phone match
    const people = (searchRes.data.results || []).map((r) => r.person);
    const existing = people.find((person) =>
      (person.phoneNumbers || []).some(
        (p) => p.value.replace(/\D/g, "") === cleanPhone
      )
    );

    if (existing) {
      const updateRes = await peopleService.people.updateContact({
        resourceName: existing.resourceName,
        updatePersonFields: "names,phoneNumbers",
        requestBody: {
          names: [{ displayName, givenName: displayName }],
          phoneNumbers: [{ value: phoneNumber }],
        },
      });
      return updateRes.data;
    } else {
      const createRes = await peopleService.people.createContact({
        requestBody: {
          names: [{ displayName, givenName: displayName }],
          phoneNumbers: [{ value: phoneNumber }],
        },
      });
      return createRes.data;
    }
  } catch (err) {
    console.error("Error saving contact:", err);
    return { error: err.message };
  }
}

// ========================= Get All Suppliers ============================

export async function getSuppliersList(req, res) {
  try {
    const {
      active,
      username,
      countryCode,
      phone,
      userTitle,
      createdByUuid,
      createdFrom,
      createdTo,
      updatedFrom,
      updatedTo,
    } = req.query;

    const where = {};
    if (active !== undefined) where.active = active === "true";
    if (username) where.username = { [Op.iLike]: `%${username}%` };
    if (countryCode) where.countryCode = countryCode;
    if (phone) where.phone = { [Op.iLike]: `%${phone}%` };
    if (userTitle) where.userTitle = { [Op.iLike]: `%${userTitle}%` };
    if (createdByUuid) where.createdBy = createdByUuid;
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt[Op.gte] = new Date(createdFrom);
      if (createdTo) where.createdAt[Op.lte] = new Date(createdTo);
    }

    if (updatedFrom || updatedTo) {
      where.updatedAt = {};
      if (updatedFrom) where.updatedAt[Op.gte] = new Date(updatedFrom);
      if (updatedTo) where.updatedAt[Op.lte] = new Date(updatedTo);
    }

    // ✅ Filter by project deadline (applications where project deadline is <= given date)
    // if (deadline) where.deadline = { [Op.lte]: deadline };
    const supplierList = await User.findAll({
      where,
      order: [["createdAt", "Desc"]],
      // raw: false,
      include: [
        {
          model: Password,
          as: "currentPassword",
          attributes: ["uuid", "password", "active"],
          required: false,
          foreignKey: "passwordUuid",
        },
        {
          model: Password,
          as: "oldPassword",
          attributes: ["uuid", "password", "active"],
          required: false,
          foreignKey: "lastPasswordUuid",
        },
      ],
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

    // Get active passwords
    const passwords = await Password.findAll({
      where: { active: true },
      order: [["uuid", "ASC"]],
    });

    // Get user count once to calculate round-robin base index
    const totalUsers = await User.count();

    let passwordAssignCounter = totalUsers;

    const suppliersWithAdmin = await Promise.all(
      supplierList.map(async (supplier) => {
        // Assign password if missing
        if (!supplier.passwordUuid && passwords.length > 0) {
          const passwordIndex = passwordAssignCounter % passwords.length;
          const assignedPassword = passwords[passwordIndex];

          await supplier.update({ passwordUuid: assignedPassword.uuid });

          passwordAssignCounter++;
        }

        // ✅ Calculate available balance per supplier
        const emails = await Email.findAll({
          where: { userUuid: supplier.uuid },
          attributes: ["amount", "status", "isWithdrawn"],
        });

        let availableBalance = 0;
        for (const email of emails) {
          if (email.status === "good" && !email.isWithdrawn) {
            availableBalance += email.amount;
          } else if (email.isWithdrawn && email.amount < 0) {
            availableBalance += email.amount;
          }
        }

        return {
          ...supplier.toJSON(),
          createdBy: supplier.createdBy
            ? adminMap[supplier.createdBy]?.username || supplier.createdBy
            : null,
          availableBalance,
        };
      })
    );

    return successOkWithData(
      res,
      "Suppliers retrieved and updated successfully.",
      suppliersWithAdmin
    );
  } catch (error) {
    console.error("===== error in getSupplierList ===== : ", error);
    return catchError(res, error);
  }
}

// ========================= Set Simple Supplier List  ============================

export async function getSuppliersSimpleList(req, res) {
  try {
    const suppliers = await User.findAll({
      attributes: ["uuid", "username"],
      order: [["username", "ASC"]],
      raw: true,
    });

    return successOkWithData(
      res,
      "Suppliers list retrieved successfully.",
      suppliers
    );
  } catch (error) {
    console.error("Error fetching suppliers list:", error);
    return catchError(res, error);
  }
}

// ========================= Admin Simple List ============================
export async function getAdminsSimpleList(req, res) {
  try {
    // Fetch only uuid and username for all admins
    const admins = await Admin.findAll({
      attributes: ["uuid", "username"], // Select only the uuid and username fields
      order: [["username", "ASC"]], // Sort admins by username in ascending order
      raw: true, // Return raw data (plain objects)
    });

    // Return success response with the data
    return successOkWithData(
      res,
      "Admins list retrieved successfully.",
      admins
    );
  } catch (error) {
    console.error("Error fetching admins list:", error);
    return catchError(res, error);
  }
}

// ========================= Add New Supplier ============================
export async function addNewSupplier(req, res) {
  try {
    const adminUid = req.adminUid;

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

    // ✅ Check Refer Code (if provided)
    let referUser = null;
    if (referCode) {
      referUser = await User.findOne({ where: { username: referCode } });
    }

    // ✅ Assign from Password Pool
    const passwords = await Password.findAll({
      where: { active: true },
      order: [["uuid", "ASC"]],
    });
    const userCount = await User.count();
    const passwordIndex = userCount % passwords.length;

    const userData = {
      username,
      countryCode,
      phone,
      password: hashedPassword,
      active: true,
      createdBy: adminUid,
      referCode: referCode || null,
      passwordUuid: passwords.length > 0 ? passwords[passwordIndex].uuid : null,
    };

    // ✅ Create New User in Database
    const newUser = await User.create(userData);

    const signupBonus = await SystemSetting.findOne({
      where: { key: "default_signup_bonus" },
    });
    if (signupBonus) {
      await Bonus.create({
        userUuid: newUser.uuid,
        type: "signup",
        amount: parseInt(signupBonus.value),
        status: "pending",
      });
    }

    // ✅ Add Referral Bonus (to the referring user, if applicable)
    let referralBonusStatus = ""; // To store message about referral bonus status
    if (referCode && referUser) {
      const referralBonus = await SystemSetting.findOne({
        where: { key: "default_referral_bonus" },
      });
      if (referralBonus) {
        await Bonus.create({
          userUuid: referUser.uuid,
          type: "referral",
          amount: parseInt(referralBonus.value),
          status: "pending",
          refereeUuid: newUser.uuid, // Storing the refereeUuid (new user who used the referral code)
        });
        referralBonusStatus = "Referral bonus awarded successfully.";
      } else {
        referralBonusStatus =
          "No referral bonus awarded. Please contact admin for more details.";
      }
    }

    // ✅ Create a Welcome Notification for the New User
    const notificationMessage = `Welcome ${newUser.username}! Your account has been successfully created. ${referralBonusStatus}`;
    await createNotification({
      userUuid: newUser.uuid,
      title: "Welcome to the Platform",
      message: notificationMessage,
      type: "info",
    });

    // Send response with appropriate messages
    if (referCode && referUser) {
      return created(res, "User profile created successfully.");
    } else if (referCode && !referUser) {
      return created(
        res,
        "User profile created successfully, but the provided referCode is invalid."
      );
    } else {
      return created(res, "User profile created successfully.");
    }
  } catch (error) {
    console.error("===== error in addNewSupplier ===== : ", error);
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

    // Fetch phones associated with the supplier
    const phones = await Phone.findAll({
      where: { userUuid: uuid },
      attributes: ["uuid", "countryCode", "phone"],
    });

    // Attach phones to the supplier response
    const supplierData = {
      ...supplier.toJSON(),
      phones,
    };

    return successOkWithData(
      res,
      "Supplier detail retrieved successfully.",
      supplierData
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

    const { active, bonus, category, password } = req.body;

    let fieldsToUpdate = {};

    if (active !== undefined) fieldsToUpdate.active = active; // Check explicitly if active is not undefined (false should be valid)
    if (bonus) fieldsToUpdate.bonus = bonus;
    if (password) {
      // ✅ Validate Password Format
      const invalidPassword = validatePassword(password);
      if (invalidPassword) return validationError(res, invalidPassword);

      const hashedPassword = await hashPassword(password);
      fieldsToUpdate.password = hashedPassword;
    }

    if (category && !supplier.userTitle) {
      const isCategoryValid = isValidCategory(category);

      if (!isCategoryValid)
        return frontError(
          res,
          "Invalid category. It must be a single uppercase letter (A-Z)."
        );

      const userTitle = await generateUserTitle(
        category,
        // supplier.uuid,
        supplier.username
      );
      fieldsToUpdate.userTitle = userTitle;

      // Combine country code and phone into full E.164 format
      const fullPhone = `${supplier.countryCode}${supplier.phone}`;

      // ✅ Save/Update to Google Contacts here
      // Create or update Google Contact and log the result
      const logInfo = await createOrUpdateContact(userTitle, fullPhone);
    }

    // Always stamp who’s making the change, but don’t count it as “something to update”
    fieldsToUpdate.updatedBy = adminUid;

    // Check if there’s anything but `updatedBy` in fieldsToUpdate
    const actualChanges = Object.keys(fieldsToUpdate).filter(
      (k) => k !== "updatedBy"
    );
    if (actualChanges.length === 0) {
      return frontError(res, "Nothing to update.");
    }

    await supplier.update(fieldsToUpdate);

    return successOk(res, "Supplier updated successfully.");
  } catch (error) {
    console.error("===== error in updateSupplierDetail ===== : ", error);
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

// ========================= Update Supplier Phone ============================

export async function updateSupplierPhone(req, res) {
  try {
    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const reqBodyFields = bodyReqFields(req, res, [
      // "countryCode",
      "phone",
    ]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { uuid } = req.query; // phone uuid
    const { countryCode, phone } = req.body;

    const phoneRecord = await Phone.findByPk(uuid);
    if (!phoneRecord) return frontError(res, "Invalid uuid.", "uuid");

    // Check if no actual change
    const isSame =
      phoneRecord.phone === phone && phoneRecord.countryCode === countryCode;
    if (isSame) {
      return validationError(
        res,
        "New phone number cannot be the same as the current one.",
        "phone"
      );
    }

    // Check if the new phone (with countryCode) already exists in other records
    const duplicate = await Phone.findOne({
      where: {
        countryCode,
        phone,
        uuid: { [Op.ne]: uuid }, // Ignore the current record
      },
    });

    if (duplicate) {
      return frontError(res, "Phone number already exists.", "phone");
    }

    if (countryCode) phoneRecord.countryCode = countryCode;
    if (phone) phoneRecord.phone = phone;

    await phoneRecord.save();

    return successOk(res, "Phone number updated successfully.");
  } catch (error) {
    console.error("===== error updating phone ===== :", error);
    return catchError(res, error);
  }
}

// ========================= Delete Supplier Phone ============================

export async function deleteSupplierPhone(req, res) {
  try {
    const reqQueryFields = queryReqFields(req, res, ["uuid"]);
    if (reqQueryFields.error) return reqQueryFields.response;

    const { uuid } = req.query; // phone uuid

    const phoneRecord = await Phone.findByPk(uuid);
    if (!phoneRecord) return frontError(res, "Invalid uuid.");

    await phoneRecord.destroy();

    return successOk(res, "Phone number deleted successfully.");
  } catch (error) {
    console.error("===== error deleting phone ===== :", error);
    return catchError(res, error);
  }
}

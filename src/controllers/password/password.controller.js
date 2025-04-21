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
import { convertToLowercase } from "../../utils/utils.js";
import models from "../../models/models.js";
import { validatePassword } from "../../utils/passwordUtils.js";

const { Password, User } = models;

// =================================================================
// ========================= Helping Functions =====================
// =================================================================

const assignPasswords = async () => {
  const users = await User.findAll({ order: [["uuid", "ASC"]] });
  const passwords = await Password.findAll({
    where: { active: true },
    order: [["uuid", "ASC"]],
  });

  if (passwords.length === 0) {
    console.log("No active passwords available!");
    return;
  }

  for (let i = 0; i < users.length; i++) {
    const passwordIndex = i % passwords.length; // Round-robin logic
    await users[i].update({ passwordUuid: passwords[passwordIndex].uuid });
  }
  console.log("Passwords reassigned successfully!");
};

// ========================= Get Password ============================

export async function getPassword(req, res) {
  try {
    const passwords = await Password.findAll({
      where: { active: true },
      order: [["uuid", "ASC"]],
    });

    if (passwords.length === 0) {
      return validationError(res, "No active passwords available!");
    }

    return successOkWithData(res, "Password fetched successfully.", passwords);
  } catch (error) {
    console.log(error);
    if (error instanceof Sequelize.ValidationError) {
      return sequelizeValidationError(res, error);
    }
    return catchError(res, error);
  }
}

// ========================= Add Password ============================

export async function addPassword(req, res) {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["password"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { password } = req.body;

    // ✅ Validate Password Format
    const invalidPassword = validatePassword(password);
    if (invalidPassword) return validationError(res, invalidPassword);

    await Password.create({
      password,
      active: true,
    });
    return created(res, "Password added successfully.");
  } catch (error) {
    console.log(error);
    if (error instanceof Sequelize.ValidationError) {
      return sequelizeValidationError(res, error);
    }
    return catchError(res, error);
  }
}

// ========================= Add Bulk Password ============================

export async function addBulkPasswords(req, res) {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["passwords"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    let { passwords } = req.body; // Expecting an array of passwords
    if (!Array.isArray(passwords) || passwords.length === 0) {
      return validationError(res, "Passwords must be a non-empty array.");
    }

    // ✅ Validate each password
    const invalidPasswords = passwords.filter((password) =>
      validatePassword(password)
    );
    if (invalidPasswords.length > 0) {
      return validationError(
        res,
        `Invalid passwords found: ${invalidPasswords.join(
          ", "
        )}. Possibel Reasons: 1. Password must be at least 8 characters long.  2. Password must contain at least one uppercase letter, one numeric digit and one special character.`
      );
    }

    // ✅ Prepare the bulk insert data
    const passwordData = passwords.map((password) => ({
      password,
      active: true,
    }));

    await Password.bulkCreate(passwordData);

    // ✅ Get newly created active passwords
    const activePasswords = await Password.findAll({
      where: { active: true },
      order: [["uuid", "ASC"]],
    });

    if (activePasswords.length === 0) {
      return created(
        res,
        "Passwords added, but none are active for assignment."
      );
    }

    // ✅ Find users without passwords
    const usersWithoutPassword = await User.findAll({
      where: { passwordUuid: null },
    });

    let updatedCount = 0;
    for (let i = 0; i < usersWithoutPassword.length; i++) {
      const user = usersWithoutPassword[i];
      const passwordIndex = i % activePasswords.length;
      const passwordToAssign = activePasswords[passwordIndex];

      await user.update({ passwordUuid: passwordToAssign.uuid });
      updatedCount++;
    }

    return created(
      res,
      `${passwords.length} passwords added successfully. ${updatedCount} users were updated with new passwords.`
    );

    // return created(res, `${passwords.length} passwords added successfully.`);
  } catch (error) {
    console.log(error);
    if (error instanceof Sequelize.ValidationError) {
      return sequelizeValidationError(res, error);
    }
    return catchError(res, error);
  }
}

// ========================= Update Passwords ============================

export async function updatePasswords(req, res) {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["passwords"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { passwords } = req.body;

    if (!Array.isArray(passwords) || passwords.length === 0) {
      return validationError(res, "Passwords must be a non-empty array.");
    }

    // ✅ Validate each password
    const invalidPasswords = passwords.filter((password) =>
      validatePassword(password)
    );
    if (invalidPasswords.length > 0) {
      return validationError(
        res,
        `Invalid passwords found: ${invalidPasswords.join(
          ", "
        )}. Possibel Reasons: 1. Password must be at least 8 characters long.  2. Password must contain at least one uppercase letter, one numeric digit and one special character.`
      );
    }

    // ✅ Check if any passwords already exist in the database
    const existingPasswords = await Password.findAll({
      where: { password: passwords },
    });

    if (existingPasswords.length > 0) {
      const duplicatePasswords = existingPasswords.map((pwd) => pwd.password);
      return validationError(
        res,
        `The following passwords already exist and cannot be reused: ${duplicatePasswords.join(
          ", "
        )}`
      );
    }

    // Mark existing passwords as inactive
    await Password.update({ active: false }, { where: { active: true } });

    // Insert new passwords
    const newPasswords = passwords.map((pwd) => ({
      password: pwd,
      active: true,
    }));
    await Password.bulkCreate(newPasswords);

    // Reassign passwords to all users
    await assignPasswords();

    return successOk(res, "Passwords updated successfully.");
  } catch (error) {
    console.log("===== Error ===== : ", error);

    return catchError(res, error);
  }
}

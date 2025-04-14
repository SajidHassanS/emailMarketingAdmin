// import Student from "../../models/admin/admin.model.js";
import { convertToLowercase, getRelativePath, validateCountryCode, validatePhone } from "../../utils/utils.js";
import {
  catchError,
  validationError,
  successOk,
  successOkWithData,
  UnauthorizedError
} from "../../utils/responses.js";
// import User from "../../models/admin/admin.model.js";
// import Admin from "../../models/admin/admin.model.js";

import models from "../../models/models.js";
const { User, Admin } = models

// ========================= Get Profile ============================

export async function getProfile(req, res) {
  try {
    const adminUid = req.adminUid

    const profile = await Admin.findByPk(adminUid, {
      attributes: {
        exclude: ["password", "createdAt", "updatedAt"]
      },
      // attributes: [
      //   "uuid",
      //   "firstName",
      //   "lastName",
      //   "email",
      //   "countryCode",
      //   "phone",
      //   "dateOfBirth",
      //   "cnic",
      //   "gender",
      //   "education",
      //   "experience",
      //   "address",
      //   "tehsil",
      //   "district",
      //   "province",
      //   "profileImg",
      // ],
    });
    if (!profile) return UnauthorizedError(res, "Invalid token");

    return successOkWithData(res, "Profile fetched successfully", profile);
  } catch (error) {
    return catchError(res, error);
  }
}

// ========================= Update Profile ============================

export async function updateProfile(req, res) {
  try {
    const adminUid = req.adminUid

    const { firstName, lastName, countryCode, phone, gender, dateOfBirth, cnic, education, experience, address, tehsil, district, province } = req.body;

    let fieldsToUpdate = {};

    // If countryCode is updated, ensure that phoneNo is also provided
    // if (countryCode && !phone) return validationError(res, "Phone number must be provided when changing the country code.");

    // if (firstName) fieldsToUpdate.firstName = firstName;
    // if (lastName) fieldsToUpdate.lastName = lastName;

    // Validate phone number if provided
    // if (phone) {
    //   // ✅ Validate Phone Number
    //   const phoneError = validatePhone(phone);
    //   if (phoneError) return validationError(res, phoneError, "phone");
    //   fieldsToUpdate.phone = phone;
    // }

    // Validate country code if provided
    // if (countryCode) {
    //   // ✅ Validate Country Code
    //   const countryCodeError = validateCountryCode(countryCode);
    //   if (countryCodeError) return validationError(res, countryCodeError, "countryCode");
    //   fieldsToUpdate.countryCode = countryCode;
    // }

    // If profileImg is provided, handle the upload
    if (req.file) {
      const profileImgPath = getRelativePath(req.file.path); // Get the relative path for the image
      fieldsToUpdate.profileImg = profileImgPath; // Add the profileImg path to the update fields
    }

    const excludedFields = ["profileImg"];
    const fieldsToUpdateLowered = convertToLowercase(fieldsToUpdate, excludedFields);

    await Admin.update(fieldsToUpdate, {
      where: { uuid: adminUid },
    });

    // ✅ Check Profile Completion
    const student = await Admin.findOne({ where: { uuid: adminUid } });

    const requiredFields = ["firstName", "lastName", "phone", "dateOfBirth", "gender", "cnic", "education", "experience", "address", "tehsil", "district", "province"];

    // Check if all required fields are filled
    const isProfileComplete = requiredFields.every(field => student[field] && student[field] !== "");

    // Update profileCompleted field
    await Admin.update({ profileCompleted: isProfileComplete }, { where: { uuid: adminUid } });

    return successOk(res, "Profile updated successfully.");
  } catch (error) {
    return catchError(res, error);
  }
}
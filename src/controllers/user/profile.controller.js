// controllers/admin/profile.controller.js

import {
  catchError,
  validationError,
  successOk,
  successOkWithData,
  UnauthorizedError,
} from "../../utils/responses.js";
import {
  convertToLowercase,
  validateCountryCode,
  validatePhone,
} from "../../utils/utils.js";
import models from "../../models/models.js";
const { Admin } = models;

// Build your S3 URL prefix
const BUCKET = process.env.S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const S3_PREFIX = `https://${BUCKET}.s3.${REGION}.amazonaws.com/`;

// ========================= Get Profile ============================
export async function getProfile(req, res) {
  try {
    const adminUid = req.adminUid;

    const profile = await Admin.findByPk(adminUid, {
      attributes: { exclude: ["password", "createdAt", "updatedAt"] },
    });
    if (!profile) return UnauthorizedError(res, "Invalid token");

    // Convert and prefix profileImg
    const data = profile.toJSON();
    if (data.profileImg && !data.profileImg.startsWith("http")) {
      data.profileImg = S3_PREFIX + data.profileImg;
    }

    return successOkWithData(res, "Profile fetched successfully", data);
  } catch (error) {
    return catchError(res, error);
  }
}

// ========================= Update Profile ============================
export async function updateProfile(req, res) {
  try {
    const adminUid = req.adminUid;
    const {
      firstName,
      lastName,
      countryCode,
      phone,
      gender,
      dateOfBirth,
      cnic,
      education,
      experience,
      address,
      tehsil,
      district,
      province,
    } = req.body;

    let fieldsToUpdate = {};

    // (Your existing validation blocks are left commented out for re-enable later)
    // if (countryCode && !phone) return validationError(...);
    // if (phone) { /* validatePhone */ }
    // if (countryCode) { /* validateCountryCode */ }

    // Standard field updates
    if (firstName) fieldsToUpdate.firstName = firstName;
    if (lastName) fieldsToUpdate.lastName = lastName;
    if (countryCode) fieldsToUpdate.countryCode = countryCode;
    if (phone) fieldsToUpdate.phone = phone;
    if (gender) fieldsToUpdate.gender = gender;
    if (dateOfBirth) fieldsToUpdate.dateOfBirth = dateOfBirth;
    if (cnic) fieldsToUpdate.cnic = cnic;
    if (education) fieldsToUpdate.education = education;
    if (experience) fieldsToUpdate.experience = experience;
    if (address) fieldsToUpdate.address = address;
    if (tehsil) fieldsToUpdate.tehsil = tehsil;
    if (district) fieldsToUpdate.district = district;
    if (province) fieldsToUpdate.province = province;

    // ——— UPDATED: store the S3 key, not a FS path ———
    if (req.file) {
      fieldsToUpdate.profileImg = req.file.key;
    }

    // (Optional) lowercase conversion if you still use it
    const excluded = ["profileImg"];
    convertToLowercase(fieldsToUpdate, excluded);

    // Save updates
    await Admin.update(fieldsToUpdate, { where: { uuid: adminUid } });

    // Re-fetch and update profileCompleted
    const updated = await Admin.findByPk(adminUid);
    const required = [
      "firstName",
      "lastName",
      "phone",
      "dateOfBirth",
      "gender",
      "cnic",
      "education",
      "experience",
      "address",
      "tehsil",
      "district",
      "province",
    ];
    const complete = required.every((f) => updated[f]);
    if (updated.profileCompleted !== complete) {
      await Admin.update(
        { profileCompleted: complete },
        { where: { uuid: adminUid } }
      );
    }

    return successOk(res, "Profile updated successfully.");
  } catch (error) {
    return catchError(res, error);
  }
}

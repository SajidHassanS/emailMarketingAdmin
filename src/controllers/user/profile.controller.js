import Student from "../../models/admin/admin.model.js";
import { convertToLowercase, getRelativePath, validateCountryCode, validatePhone } from "../../utils/utils.js";
import {
  catchError,
  validationError,
  successOk,
  successOkWithData,
  UnauthorizedError
} from "../../utils/responses.js";
import User from "../../models/admin/admin.model.js";

// ========================= Get Profile ============================

export async function getProfile(req, res) {
  try {
    const adminUid = req.adminUid

    const profile = await User.findByPk(adminUid, {
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

// export async function updateProfile(req, res) {
//   try {
//     const userUid = req.userUid

//     const { firstName, lastName, countryCode, phone, gender, dateOfBirth, cnic, education, experience, address, tehsil, district, province } = req.body;

//     let fieldsToUpdate = {};

//     // If countryCode is updated, ensure that phoneNo is also provided
//     if (countryCode && !phone) return validationError(res, "Phone number must be provided when changing the country code.");

//     if (firstName) fieldsToUpdate.firstName = firstName;
//     if (lastName) fieldsToUpdate.lastName = lastName;

//     // Validate phone number if provided
//     if (phone) {
//       // ✅ Validate Phone Number
//       const phoneError = validatePhone(phone);
//       if (phoneError) return validationError(res, phoneError, "phone");
//       fieldsToUpdate.phone = phone;
//     }

//     // Validate country code if provided
//     if (countryCode) {
//       // ✅ Validate Country Code
//       const countryCodeError = validateCountryCode(countryCode);
//       if (countryCodeError) return validationError(res, countryCodeError, "countryCode");
//       fieldsToUpdate.countryCode = countryCode;
//     }

//     if (dateOfBirth) fieldsToUpdate.dateOfBirth = dateOfBirth;
//     if (gender) fieldsToUpdate.gender = gender;
//     if (cnic) fieldsToUpdate.cnic = cnic;
//     if (education) fieldsToUpdate.education = education;
//     if (experience) fieldsToUpdate.experience = experience;
//     if (address) fieldsToUpdate.address = address;
//     if (tehsil) fieldsToUpdate.tehsil = tehsil;
//     if (district) fieldsToUpdate.district = district;
//     if (province) fieldsToUpdate.province = province;

//     // If profileImg is provided, handle the upload
//     if (req.file) {
//       const profileImgPath = getRelativePath(req.file.path); // Get the relative path for the image
//       fieldsToUpdate.profileImg = profileImgPath; // Add the profileImg path to the update fields
//     }

//     const excludedFields = ["countryCode", "phone", "dateOfBirth", "cnic", "profileImg"];
//     const fieldsToUpdateLowered = convertToLowercase(fieldsToUpdate, excludedFields);

//     console.log(" ===== fieldsToUpdate ===== ", fieldsToUpdate)
//     console.log(" ===== fieldsToUpdateLowered ===== ", fieldsToUpdateLowered)
//     await Student.update(fieldsToUpdate, {
//       where: { uuid: userUid },
//     });

//     // ✅ Check Profile Completion
//     const student = await Student.findOne({ where: { uuid: userUid } });

//     const requiredFields = ["firstName", "lastName", "phone", "dateOfBirth", "gender", "cnic", "education", "experience", "address", "tehsil", "district", "province"];

//     // Check if all required fields are filled
//     const isProfileComplete = requiredFields.every(field => student[field] && student[field] !== "");

//     // Update profileCompleted field
//     await Student.update({ profileCompleted: isProfileComplete }, { where: { uuid: userUid } });

//     return successOk(res, "Profile updated successfully.");
//   } catch (error) {
//     return catchError(res, error);
//   }
// }
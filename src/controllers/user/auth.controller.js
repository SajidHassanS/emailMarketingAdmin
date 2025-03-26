import { Sequelize } from "sequelize";
import { bodyReqFields } from "../../utils/requiredFields.js";
import { convertToLowercase, validateCountryCode, validateEmail, validatePhone, validateUsername } from "../../utils/utils.js";
import {
  comparePassword,
  hashPassword,
  validatePassword,
} from "../../utils/passwordUtils.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwtTokenGenerator.js";
import {
  created,
  catchError,
  validationError,
  successOk,
  successOkWithData,
  UnauthorizedError,
  sequelizeValidationError,
  forbiddenError,
} from "../../utils/responses.js";
import { jwtSecret } from "../../config/initialConfig.js";
import jwt from 'jsonwebtoken';
// import BlacklistToken from "../../models/admin/blackListToken.model.js";
// import Admin from "../../models/admin/admin.model.js";

import models from "../../models/models.js";
const { Admin, BlacklistToken } = models

// ========================= Register Admin ============================

export async function registerAdmin(req, res) {
  try {
    // ✅ Check if required fields are provided
    const reqBodyFields = bodyReqFields(req, res, [
      "username",
      "countryCode",
      "phone",
      "role",
      "password",
      "confirmPassword",
    ]);
    if (reqBodyFields.error) return reqBodyFields.response;

    // ✅ Convert relevant fields to lowercase (excluding sensitive ones)
    const excludedFields = ['countryCode', 'phone', 'password', 'confirmPassword'];
    const requiredData = convertToLowercase(req.body, excludedFields);
    let { username, countryCode, phone, role, password, confirmPassword } = requiredData;

    // ✅ Validate User Name
    const usernameError = validateUsername(username)
    if (usernameError) return validationError(res, usernameError, "username");

    // ✅ Validate Country Code
    const countryCodeError = validateCountryCode(countryCode);
    if (countryCodeError) return validationError(res, countryCodeError, "countryCode");

    // ✅ Validate Phone Number
    const phoneError = validatePhone(phone);
    if (phoneError) return validationError(res, phoneError, "phone");

    // ✅ Check if the Email Already Exists
    const existingAdmin = await Admin.findOne({ where: { phone } });
    if (existingAdmin) return validationError(res, "This phone is already registered.", "phone");

    // ✅ Check if Role is not correct (Explicitly Checking Here)
    if (role !== 'superadmin' && role !== 'admin') {
      return validationError(res, "Invalid role.", "role");
    }

    // ✅ Check if Passwords Match (Explicitly Checking Here)
    if (password !== confirmPassword) {
      return validationError(res, "Passwords do not match.", "password");
    }

    // ✅ Validate Password Format
    const invalidPassword = validatePassword(password);
    if (invalidPassword) return validationError(res, invalidPassword);

    // ✅ Hash Password Before Saving
    const hashedPassword = await hashPassword(password);

    let adminData = {}
    // ✅ Prepare Data for Insertion
    adminData.username = username
    adminData.phone = phone
    adminData.countryCode = countryCode
    adminData.password = hashedPassword
    adminData.role = role
    adminData.verified = true // chnage this based on approval flow

    console.log("===== adminData ===== : ", adminData);

    // ✅ Create New User in Database
    await Admin.create(adminData);

    return created(res, "Admin profile created successfully.");
  } catch (error) {
    console.log(error);

    // ✅ Handle Sequelize Validation Errors
    if (error instanceof Sequelize.ValidationError) {
      return sequelizeValidationError(res, error);
    }
    // ✅ Catch Any Other Errors
    return catchError(res, error);
  }
}

// ========================= Login Admin ============================

export async function loginAdmin(req, res) {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["username", "password"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { username, password } = req.body;

    // Check if a admin with the given username not exists
    const admin = await Admin.findOne({ where: { username } });
    if (!admin) return validationError(res, "Invalid username or password");

    // Compare passwords
    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) return validationError(res, "Invalid username or password");

    // Generate tokens
    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);

    // If passwords match, return success
    return successOkWithData(res, "Login successful", { accessToken, refreshToken });
  } catch (error) {
    return catchError(res, error);
  }
}

// ========================= Regenerate Access Token ============================

export async function regenerateAccessToken(req, res) {
  try {
    const reqBodyFields = bodyReqFields(req, res, ["refreshToken"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { refreshToken } = req.body;
    const { invalid, expired, userUid } = verifyRefreshToken(refreshToken);

    // Check if a admin with the given uuid not exists
    const admin = await Admin.findOne({ where: { uuid: userUid } });
    if (!admin) return validationError(res, "Invalid token.");

    if (invalid) return validationError(res, "Invalid refresh token");
    if (expired) return forbiddenError(res, "Refresh token has expired. Please log in again.");

    const newAccessToken = generateAccessToken({ uuid: userUid });

    return successOkWithData(res, "Access Token Generated Successfully", { accessToken: newAccessToken });
  } catch (error) {
    return catchError(res, error);
  }
};

// ========================= Update Password ============================

export async function updatePassword(req, res) {
  try {
    const userUid = req.userUid
    const reqBodyFields = bodyReqFields(req, res, ["oldPassword", "newPassword", "confirmPassword"]);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Check if a user exists
    const admin = await Admin.findOne({ where: { uuid: userUid } });
    if (!admin) return UnauthorizedError(res, "Invalid token");

    // Compare oldPassword with hashed password in database
    const isMatch = await comparePassword(oldPassword, admin.password);
    if (!isMatch) return validationError(res, "Invalid old password", "oldPassword");

    const invalidPassword = validatePassword(newPassword, confirmPassword);
    if (invalidPassword) return validationError(res, invalidPassword);

    // Check if oldPassword and newPassword are the same
    if (oldPassword === newPassword) return validationError(res, "New password must be different from old password");

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    // // Update admin's password in the database
    await admin.update({ password: hashedPassword });

    return successOk(res, "Password updated successfully.");
  } catch (error) {
    catchError(res, error);
  }
}

// // ========================= Forgot Password ============================
// export async function forgotPassword(req, res) {
//   try {
//     const reqBodyFields = bodyReqFields(req, res, ["email"]);
//     if (reqBodyFields.error) return reqBodyFields.response;

//     const { email } = req.body;

//     // Check if a user with the given email exists
//     const user = await Student.findOne({ where: { email } });
//     if (!user) return validationError(res, "This email is not registered.", "email");

//     // generating otp
//     const otp = crypto.randomInt(100099, 999990);

//     // Save OTP in the database within transaction
//     await Student.update({ otp, otpCount: 0 }, { where: { email } });

//     // Send OTP email
//     const emailSent = await sendOTPEmail(email, otp);

//     if (!emailSent) return catchError(res, "Something went wrong. Failed to send OTP.");

//     return successOk(res, "OTP sent successfully");
//   } catch (error) {
//     return catchError(res, error);
//   }
// }

// // ========================= Verify OTP ============================

// export async function verifyOtp(req, res) {
//   try {
//     const reqBodyFields = bodyReqFields(req, res, ["email", "otp"]);
//     if (reqBodyFields.error) return reqBodyFields.response;
//     const { email, otp } = req.body;

//     // Check if a user with the given email exists
//     const user = await Student.findOne({ where: { email } });
//     if (!user) return frontError(res, "This email is not registered.", "email");

//     if (user.otpCount >= 3) return validationError(res, "Maximum OTP attempts reached. Please regenerate OTP.");

//     // Compare OTP; if incorrect, increment otp_count
//     if (user.otp !== parseInt(otp, 10)) {
//       await user.update({ otpCount: user.otpCount + 1 });
//       return validationError(res, "Invalid OTP");
//     }

//     // OTP matched, reset otp_count and set can_change_password to true
//     await user.update({ otpCount: 0, canChangePassword: true });

//     return successOk(res, "OTP Verified Successfully");
//   } catch (error) {
//     return catchError(res, error);
//   }
// }

// // ========================= Set New Password ============================

// export async function setNewPassword(req, res) {
//   try {
//     const reqBodyFields = bodyReqFields(req, res, [
//       "newPassword",
//       "confirmPassword",
//       "email",
//     ]);
//     if (reqBodyFields.error) return reqBodyFields.response;

//     const { newPassword, confirmPassword, email } = req.body;

//     // Check if a user with the given email exists
//     const user = await Student.findOne({ where: { email } });
//     if (!user) return frontError(res, "User not found");

//     // Check if passwords match
//     const invalidPassword = validatePassword(newPassword, confirmPassword);
//     if (invalidPassword) return validationError(res, invalidPassword);

//     // Only allow if canChangePassword is true (i.e., OTP verified)
//     if (user.canChangePassword === false) {
//       return UnauthorizedError(res, "Unauthorized");
//     }

//     // Hash the new password
//     const hashedPassword = await hashPassword(newPassword);

//     // Update user's password in the database
//     await Student.update(
//       {
//         password: hashedPassword,
//         canChangePassword: false,
//         otp: null,
//         otpCount: 0,
//       },
//       {
//         where: { email },
//       }
//     );

//     return successOk(res, "Password updated successfully.");
//   } catch (error) {
//     catchError(res, error);
//   }
// }

// ========================= Logout ============================
export async function logoutUser(req, res) {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return validationError(res, "Authorization token is required.");

    console.log("===== token ===== : ", token);

    // Verify JWT token (instead of decode)
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, jwtSecret);
    } catch (err) {
      console.log("===== err ===== : ", err);
      return validationError(res, "Invalid or expired token.");
    }

    // Convert expiry time from seconds to milliseconds
    const expiryTime = new Date(decodedToken.exp * 1000);

    // Blacklist the token
    await BlacklistToken.create({ token, expiry: expiryTime });

    successOk(res, "Logout successfully.");
  } catch (error) {
    console.log(error);
    catchError(res, error);
  }
}
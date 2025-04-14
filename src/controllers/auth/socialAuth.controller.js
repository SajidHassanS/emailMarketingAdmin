// // controllers/auth/socialAuth.controller.js

// import {
//   generateAccessToken,
//   generateRefreshToken,
// } from "../../utils/jwtTokenGenerator.js";
// import { successOkWithData, frontError } from "../../utils/responses.js";

// // Called if Passport successfully authenticates the user
// export async function socialLoginSuccess(req, res) {
//   try {
//     // Passport attaches authenticated user to req.user
//     const user = req.user;

//     // Generate JWT tokens (reuse your existing utility)
//     const accessToken = generateAccessToken(user);
//     const refreshToken = generateRefreshToken(user);

//     // Return tokens to the client (or redirect if you have a frontend route)
//     return successOkWithData(res, "Social Login successful", {
//       accessToken,
//       refreshToken,
//     });
//   } catch (error) {
//     console.error(error);
//     return frontError(res, "Error in social login");
//   }
// }

// // Called if Passport fails to authenticate the user
// export async function socialLoginFail(req, res) {
//   return frontError(res, "Social authentication failed");
// }

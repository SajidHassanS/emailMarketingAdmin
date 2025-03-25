// // Import required modules and configuration
// import express from "express";
// import * as authCtrl from "../../controllers/auth/auth.controller.js";
// import verifyToken from "../../middlewares/authMiddleware.js";
// const router = express.Router();

// // Authentication routes
// router.post("/signup", authCtrl.registerAdmin); // User registration
// router.post("/login", authCtrl.loginUser); // User login
// router.post("/regenerate-access-token", authCtrl.regenerateAccessToken); // Regenerate access token
// router.patch("/password/update", verifyToken, authCtrl.updatePassword); // Update password
// router.post("/password/forgot", authCtrl.forgotPassword); // Forgot password
// router.post("/password/verify-otp", authCtrl.verifyOtp); // Verify OTP for password reset
// router.post("/password/reset", authCtrl.setNewPassword); // Set new password after OTP verification
// router.post("/logout", verifyToken, authCtrl.logoutUser); // Logout user

// export default router;

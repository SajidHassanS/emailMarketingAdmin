// import express from "express";
// import * as applicationCtrl from "../../controllers/application/application.controller.js";
// import verifyToken from "../../middlewares/authMiddleware.js";
// import { checkRole } from "../../middlewares/adminRole.middleware.js";
// const router = express.Router();

// // ✅ Get student applications
// router.get("/all", verifyToken, checkRole(["apprenticeship"]), applicationCtrl.getFilteredApplications);

// // ✅ Get application data
// router.get("/detail", verifyToken, checkRole(["apprenticeship"]), applicationCtrl.getApplicationData);

// // ✅ Approve application
// router.patch("/approve", verifyToken, checkRole(["apprenticeship"]), applicationCtrl.approveApplication);

// // ✅ Reject application
// router.patch("/reject", verifyToken, checkRole(["apprenticeship"]), applicationCtrl.rejectApplication);

// // ✅ Application stats
// router.get("/stats", verifyToken, checkRole(["apprenticeship"]), applicationCtrl.applicationsStats);

// export default router;

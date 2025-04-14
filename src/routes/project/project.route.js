// import express from "express";
// import * as jobCtrl from "../../controllers/project/project.controller.js";
// import verifyToken from "../../middlewares/authMiddleware.js";
// import { checkRole } from "../../middlewares/adminRole.middleware.js";

// const router = express.Router();

// // ✅ Post Project (Employer)
// router.post("/add", verifyToken, checkRole(["apprenticeship"]), jobCtrl.addProject);

// // ✅ Get All Projects (Filtering & Display)
// router.get("/list", verifyToken, checkRole(["apprenticeship"]), jobCtrl.getAllProjects);

// // ✅ Get Single Project
// router.get("/get", verifyToken, checkRole(["apprenticeship"]), jobCtrl.getProjectDetails);

// // ✅ Update Project
// router.patch("/update", verifyToken, checkRole(["apprenticeship"]), jobCtrl.updateProjectDetails);

// // ✅ Delete Project
// router.delete("/delete", verifyToken, checkRole(["apprenticeship"]), jobCtrl.deleteProject);

// // ✅ Approve Project
// router.patch("/approve", verifyToken, checkRole(["apprenticeship"]), jobCtrl.approveProject);

// // ✅ Reject Project
// router.patch("/reject", verifyToken, checkRole(["apprenticeship"]), jobCtrl.rejectProject);

// // ✅ Project stats
// router.get("/stats", verifyToken, jobCtrl.projectStats);

// export default router;

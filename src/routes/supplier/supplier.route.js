import express from "express";
import * as jobCtrl from "../../controllers/supplier/supplier.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/adminRole.middleware.js";

const router = express.Router();

// ✅ Get All Suppliers
router.get(
  "/list",
  verifyToken,
  checkRole(["superadmin", "admin"]),
  jobCtrl.getSuppliersList
);

router.get(
  "/simple-list",
  verifyToken,
  checkRole(["superadmin", "admin"]),
  jobCtrl.getSuppliersSimpleList
);

// router
//     .route("/")
//     .get(verifyToken, checkRole(["superadmin", "admin"]), jobCtrl.getSupplierDetail)
//     .post(verifyToken, checkRole(["superadmin", "admin"]), jobCtrl.addNewSupplier)
//     .patch(verifyToken, checkRole(["superadmin", "admin"]), jobCtrl.updateSupplierDetail)
//     .delete(verifyToken, checkRole(["superadmin", "admin"]), jobCtrl.deleteSupplier);

router
  .route("/")
  .all(verifyToken, checkRole(["superadmin", "admin"])) // Apply middleware to all routes
  .get(jobCtrl.getSupplierDetail)
  .post(jobCtrl.addNewSupplier)
  .patch(jobCtrl.updateSupplierDetail)
  .delete(jobCtrl.deleteSupplier);

// // ✅ Post Project (Employer)
// router.post("/add", verifyToken, checkRole(["apprenticeship"]), jobCtrl.addProject);

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

export default router;

import express from "express";
import * as supplierCtrl from "../../controllers/supplier/supplier.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/adminRole.middleware.js";

const router = express.Router();

// ✅ Get All Suppliers
router.get(
  "/list",
  verifyToken,
  checkRole(["superadmin", "admin"]),
  supplierCtrl.getSuppliersList
);

router.get(
  "/simple-list",
  verifyToken,
  checkRole(["superadmin", "admin"]),
  supplierCtrl.getSuppliersSimpleList
);

router.get(
  "/simple-list/admin",
  verifyToken,
  checkRole(["superadmin", "admin"]),
  supplierCtrl.getAdminsSimpleList
);

router
  .route("/")
  .all(verifyToken, checkRole(["superadmin", "admin"])) // Apply middleware to all routes
  .get(supplierCtrl.getSupplierDetail)
  .post(supplierCtrl.addNewSupplier)
  .patch(supplierCtrl.updateSupplierDetail)
  .delete(supplierCtrl.deleteSupplier);

router
  .route("/phone")
  .patch(supplierCtrl.updateSupplierPhone)
  .delete(supplierCtrl.deleteSupplierPhone);

// user details with stats, balance, phones, withdrawal methods and history.
router.get("/details", verifyToken, supplierCtrl.getUserDetails);

export default router;

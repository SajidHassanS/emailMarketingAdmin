import express from "express";
import * as domainCtrl from "../../controllers/domain/domain.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Message routes

router
  .route("/")
  .get(verifyToken, domainCtrl.getAllDomains)
  .post(verifyToken, domainCtrl.addDomain)
  .patch(verifyToken, domainCtrl.updateDomain)
  .delete(verifyToken, domainCtrl.deleteDomain);

export default router;

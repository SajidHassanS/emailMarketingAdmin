import express from "express";
import * as faqCtrl from "../../controllers/faq/faq.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Message routes

router
  .route("/")
  .get(verifyToken, faqCtrl.getAllFAQs)
  .post(verifyToken, faqCtrl.addFAQ)
  .patch(verifyToken, faqCtrl.updateFAQ)
  .delete(verifyToken, faqCtrl.deleteFAQ);

router.route("/reorder").patch(verifyToken, faqCtrl.reorderFAQs);

export default router;

import express from "express";
import * as marqueeCtrl from "../../controllers/marquee/marquee.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Message routes

router
  .route("/")
  .get(verifyToken, marqueeCtrl.getAllMarqueeMessages)
  .post(verifyToken, marqueeCtrl.createMarqueeMessage)
  .patch(verifyToken, marqueeCtrl.updateMarqueeMessage)
  .delete(verifyToken, marqueeCtrl.deleteMarqueeMessage);

router.route("/reorder").patch(verifyToken, marqueeCtrl.reorderMarqueeMessages);

export default router;

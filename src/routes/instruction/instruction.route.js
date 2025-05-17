import express from "express";
import * as instructionCtrl from "../../controllers/instruction/instruction.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Message routes

router
  .route("/")
  .get(verifyToken, instructionCtrl.getAllInstructions)
  .post(verifyToken, instructionCtrl.addInstruction)
  .patch(verifyToken, instructionCtrl.updateInstruction)
  .delete(verifyToken, instructionCtrl.deleteInstruction);

router.route("/reorder").patch(verifyToken, instructionCtrl.reorderInstructions);

export default router;

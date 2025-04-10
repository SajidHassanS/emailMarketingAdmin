import express from "express";
import * as messageCtrl from "../../controllers/message/message.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Message routes

router
    .route("/users")
    .get(verifyToken, messageCtrl.getUsersChattedWithAdmin)

router
    .route("/")
    .get(verifyToken, messageCtrl.getMessages)
    .post(verifyToken, messageCtrl.sendMessages)

export default router;

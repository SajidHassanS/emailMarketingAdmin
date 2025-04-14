import express from "express";
import * as messageCtrl from "../../controllers/message/message.controller.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Message routes

router
  .route("/users-for-new-chat")
  .get(verifyToken, messageCtrl.getUsersForNewChat);

router.route("/users").get(verifyToken, messageCtrl.getUsersChattedWithAdmin);

router.route("/messages").get(verifyToken, messageCtrl.getUserMessages);

router
  .route("/unread-count")
  .get(verifyToken, messageCtrl.getUnreadMessageCount);

router.route("/mark-as-read").post(verifyToken, messageCtrl.markMessagesAsRead);

export default router;

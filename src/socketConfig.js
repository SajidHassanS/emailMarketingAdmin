import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import chalk from "chalk";
import { saveMessageToDB } from "../src/utils/messageUtils.js"; // Assuming this is the file where you save messages

export const setupSocketIO = (server) => {
  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? process.env.DOMAIN : "*",
    },
  });

  // Handle new connections
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    const token = socket.handshake.query.token;
    if (!token) {
      console.log("No token provided.");
      socket.disconnect();
      return;
    }

    let senderUuid;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      senderUuid = decoded.userUid;
      socket.join(senderUuid); // Join room based on UUID
      console.log(
        chalk.green(`✅ Socket ${socket.id} joined room: ${senderUuid}`)
      );
    } catch (err) {
      console.error("❌ Token verification failed:", err);
      socket.disconnect();
      return;
    }

    // 🎯 Handle sending messages
    socket.on("sendMessage", async (data) => {
      try {
        if (!data.receiverUuid || !data.senderType || !data.content) {
          socket.emit("messageSent", {
            success: false,
            error: "Missing fields",
          });
          return;
        }

        // Determine receiver type
        const receiverType = data.senderType === "admin" ? "user" : "admin";

        console.log("===== data =====", data);
        console.log("===== receiverType =====", receiverType);

        const savedMessage = await saveMessageToDB({
          senderUuid,
          senderType: data.senderType,
          receiverUuid: data.receiverUuid,
          receiverType,
          content: data.content,
          isNotification: data.isNotification || false,
        });

        // Send to receiver's room
        io.to(data.receiverUuid).emit("receiveMessage", savedMessage);

        // Acknowledge sender
        socket.emit("messageSent", { success: true, data: savedMessage });

        console.log(
          chalk.yellow(
            `📩 Message from ${senderUuid} to ${data.receiverUuid} sent.`
          )
        );
      } catch (error) {
        console.error("❌ Error sending message:", error);
        socket.emit("messageSent", {
          success: false,
          error: "Failed to send message.",
        });
      }
    });

    socket.on("receiveMessage", (message) => {
      console.log("Received message:", message);
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

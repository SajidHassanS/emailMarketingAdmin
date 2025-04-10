import { Server } from "socket.io";
import { saveMessageToDB } from "../src/utils/messageUtils.js"; // Assuming this is the file where you save messages
import { Op } from "sequelize";
import models from "./models/models.js";
import chalk from "chalk";
const { Message } = models

export const setupSocketIO = (server) => {
    // Initialize Socket.IO
    const io = new Server(server, {
        cors: {
            origin: process.env.NODE_ENV === "production" ? process.env.DOMAIN : "*", // Set this in your .env file
        },
    });

    // Handle new connections
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Listen for message events
        // socket.on("sendMessage", (message) => {
        //     console.log("Received message:", message);
        //     // Optionally send a message back to the client
        //     socket.emit("receiveMessage", { message: "Message received!" });
        // });


        // Listen for 'sendMessage' event
        socket.on("sendMessage", async (data) => {
            console.log("sendMessage done:", data);
            // Extract token from the socket handshake
            const token = socket.handshake.query.token;  // Get the token sent during the connection

            if (!token) {
                console.log("No token provided.");
                socket.disconnect();
                return;
            }
            try {
                // Verify and decode the token to get adminUuid
                const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Ensure the secret key matches your JWT signing key
                const adminUuid = decoded.adminUuid;

                console.log("Admin UUID extracted from token:", adminUuid);
                console.log(chalk.yellow(`Admin (UUID: ${adminUuid}) is sending the message`));  // Log admin message sending

                // Save the message to the database
                const savedMessage = await saveMessageToDB({
                    senderUuid: req.adminUid,
                    receiverUuid: data.uuid,
                    content: data.content,
                    senderType: "admin",
                    receiverType: "user",
                });

                // Emit the saved message to the receiver's socket
                io.to(data.receiverUuid).emit("receiveMessage", savedMessage);

                // Optionally, send acknowledgment to the sender (admin)
                io.to(data.senderUuid).emit("messageSent", savedMessage);
            } catch (error) {
                console.error("Error saving message:", error);
            }
        });

        socket.on('receiveMessage', (message) => {
            console.log('Received message:', message);
        });

        // Handle user disconnection
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};

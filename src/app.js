// =========================================
//             Lbraries Import
// =========================================
import chalk from "chalk";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { fileURLToPath } from "url";
import path from "path";
import { domain } from "./config/initialConfig.js";
// import passport from "./config/passport.js";
import http from "http"; // This imports the http module

// =========================================
//             Code Import
// =========================================
import { nodeEnv, port } from "./config/initialConfig.js";
import { connectDB } from "./config/dbConfig.js";
import { getIPAddress } from "./utils/utils.js";
import { setupSocketIO } from "./socketConfig.js";
import session from "express-session";
import { ensureSystemAdminExists } from "./config/initadmin.js";
import "./models/models.js";
import authRoutes from "./routes/admin/auth.route.js";
import profileRoutes from "./routes/admin/profile.route.js";
import supplierRoutes from "./routes/supplier/supplier.route.js";
import passwordRoutes from "./routes/password/password.route.js";
import emailRoutes from "./routes/email/email.route.js";
import systemSettingRoutes from "./routes/systemSetting/systemSetting.route.js";
import withdrawalRoutes from "./routes/withdrawal/withdrawal.route.js";
import messageRoutes from "./routes/message/message.route.js";
import marqueeRoutes from "./routes/marquee/marquee.route.js";
import faqRoutes from "./routes/faq/faq.route.js";

// =========================================
//            Configurations
// =========================================
// Initializing the app
const app = express();
// app.use(passport.initialize());

// If you plan to use session-based flows (optional with JWT):
app.use(
  session({ secret: "yoursecret", resave: false, saveUninitialized: false })
);

app.use(cookieParser());

// Essential security headers with Helmet
app.use(helmet());

// Enable CORS with default settings
const crosOptions = {
  origin: nodeEnv === "production" ? domain : "*", // allow requests from all ips in development, and use array for multiple domains
  // allowedHeaders: ['Content-Type', 'Authorization', 'x-token', 'y-token'],    // allow these custom headers only
};
app.use(cors(crosOptions));

// Logger middleware for development environment
if (nodeEnv !== "production") {
  app.use(morgan("dev"));
}

// Compress all routes
app.use(compression());

// Rate limiting to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Built-in middleware for parsing JSON
app.use(express.json());

// static directories
// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/static", express.static(path.join(__dirname, "../../", "static")));

// =========================================
//            Routes
// =========================================
// Route for root path
app.get("/", (req, res) => {
  res.send("Welcome to Admin Dashboard Backend");
});

// other routes
app.use("/api/admin/auth", authRoutes);
app.use("/api/admin/profile", profileRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/system-setting", systemSettingRoutes);
app.use("/api/withdrawal", withdrawalRoutes);
app.use("/api/chat", messageRoutes);
app.use("/api/marquee", marqueeRoutes);
app.use("/api/faq", faqRoutes);

// =========================================
//            Global Error Handler
// =========================================
// Global error handler
app.use((err, req, res, next) => {
  console.error(chalk.red(err.stack));
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: {},
  });
});

// Database connection
connectDB();

await ensureSystemAdminExists(); // Ensure system admin exists

// Create an HTTP server to work with Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO with the server
setupSocketIO(server);

// Server running
server.listen(port, () => {
  console.log(
    chalk.bgYellow.bold(
      ` Server is listening at http://${getIPAddress()}:${port} `
    )
  );
});

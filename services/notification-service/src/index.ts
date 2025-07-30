import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env["NOTIFICATION_SERVICE_PORT"] || 3004;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env["CORS_ORIGIN"] || "http://localhost:3000",
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(morgan("combined"));

// Request ID middleware
app.use((req, res, next) => {
  req.headers["x-request-id"] = req.headers["x-request-id"] || uuidv4();
  res.setHeader("X-Request-ID", req.headers["x-request-id"] as string);
  next();
});

// Basic routes
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "notification-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Notification Service is running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      notifications: "/api/notifications",
    },
  });
});

// API routes
app.get("/api/notifications", (req, res) => {
  res.json({
    message: "Get notifications endpoint",
    data: [
      {
        id: "notif-1",
        type: "email",
        title: "Welcome!",
        message: "Welcome to our platform",
        isRead: false,
      },
    ],
  });
});

app.post("/api/notifications", (req, res) => {
  res.json({
    message: "Send notification endpoint",
    data: req.body,
  });
});

// Error handling
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Start server
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Notification Service running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API docs: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error("Failed to start Notification Service:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startServer();

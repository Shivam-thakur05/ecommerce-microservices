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
const PORT = process.env["API_GATEWAY_PORT"] || 3000;

// Service URLs
const SERVICES = {
  user: `http://localhost:${process.env["USER_SERVICE_PORT"] || 3001}`,
  product: `http://localhost:${process.env["PRODUCT_SERVICE_PORT"] || 3002}`,
  order: `http://localhost:${process.env["ORDER_SERVICE_PORT"] || 3003}`,
  notification: `http://localhost:${process.env["NOTIFICATION_SERVICE_PORT"] || 3004}`,
  payment: `http://localhost:${process.env["PAYMENT_SERVICE_PORT"] || 3005}`,
  analytics: `http://localhost:${process.env["ANALYTICS_SERVICE_PORT"] || 3006}`,
};

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
    service: "api-gateway",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: Object.keys(SERVICES),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "API Gateway is running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      users: "/api/users",
      products: "/api/products",
      orders: "/api/orders",
      notifications: "/api/notifications",
      payments: "/api/payments",
      analytics: "/api/analytics",
    },
    services: SERVICES,
  });
});

// Service routes
app.get("/api/users/*", (req, res) => {
  const targetUrl = `${SERVICES.user}${req.url.replace("/api/users", "")}`;
  res.json({
    message: "User service endpoint",
    targetUrl,
    method: req.method,
    path: req.path,
  });
});

app.get("/api/products/*", (req, res) => {
  const targetUrl = `${SERVICES.product}${req.url.replace("/api/products", "")}`;
  res.json({
    message: "Product service endpoint",
    targetUrl,
    method: req.method,
    path: req.path,
  });
});

app.get("/api/orders/*", (req, res) => {
  const targetUrl = `${SERVICES.order}${req.url.replace("/api/orders", "")}`;
  res.json({
    message: "Order service endpoint",
    targetUrl,
    method: req.method,
    path: req.path,
  });
});

app.get("/api/notifications/*", (req, res) => {
  const targetUrl = `${SERVICES.notification}${req.url.replace("/api/notifications", "")}`;
  res.json({
    message: "Notification service endpoint",
    targetUrl,
    method: req.method,
    path: req.path,
  });
});

app.get("/api/payments/*", (req, res) => {
  const targetUrl = `${SERVICES.payment}${req.url.replace("/api/payments", "")}`;
  res.json({
    message: "Payment service endpoint",
    targetUrl,
    method: req.method,
    path: req.path,
  });
});

app.get("/api/analytics/*", (req, res) => {
  const targetUrl = `${SERVICES.analytics}${req.url.replace("/api/analytics", "")}`;
  res.json({
    message: "Analytics service endpoint",
    targetUrl,
    method: req.method,
    path: req.path,
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
      console.log(`🚀 API Gateway running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API docs: http://localhost:${PORT}/`);
      console.log(`📋 Services:`);
      Object.entries(SERVICES).forEach(([name, url]) => {
        console.log(`   ${name}: ${url}`);
      });
    });
  } catch (error) {
    console.error("Failed to start API Gateway:", error);
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

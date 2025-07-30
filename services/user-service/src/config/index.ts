import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env["PORT"] || "3001", 10),
  nodeEnv: process.env["NODE_ENV"] || "development",

  // CORS configuration
  corsOrigins: process.env["CORS_ORIGINS"]?.split(",") || [
    "http://localhost:3000",
  ],

  // JWT configuration
  jwt: {
    secret: process.env["JWT_SECRET"] || "your-super-secret-jwt-key",
    expiresIn: process.env["JWT_EXPIRES_IN"] || "24h",
    refreshExpiresIn: process.env["JWT_REFRESH_EXPIRES_IN"] || "7d",
  },

  // PostgreSQL configuration
  postgres: {
    host: process.env["POSTGRES_HOST"] || "localhost",
    port: parseInt(process.env["POSTGRES_PORT"] || "5432", 10),
    database: process.env["POSTGRES_DB"] || "microservices",
    user: process.env["POSTGRES_USER"] || "postgres",
    password: process.env["POSTGRES_PASSWORD"] || "postgres123",
    ssl: process.env["POSTGRES_SSL"] === "true",
    max: parseInt(process.env["POSTGRES_MAX_CONNECTIONS"] || "20", 10),
    idleTimeoutMillis: parseInt(
      process.env["POSTGRES_IDLE_TIMEOUT"] || "30000",
      10
    ),
    connectionTimeoutMillis: parseInt(
      process.env["POSTGRES_CONNECTION_TIMEOUT"] || "2000",
      10
    ),
  },

  // Redis configuration
  redis: {
    host: process.env["REDIS_HOST"] || "localhost",
    port: parseInt(process.env["REDIS_PORT"] || "6379", 10),
    password: process.env["REDIS_PASSWORD"],
    db: parseInt(process.env["REDIS_DB"] || "0", 10),
    keyPrefix: process.env["REDIS_KEY_PREFIX"] || "user-service:",
  },

  // RabbitMQ configuration
  rabbitmq: {
    host: process.env["RABBITMQ_HOST"] || "localhost",
    port: parseInt(process.env["RABBITMQ_PORT"] || "5672", 10),
    username: process.env["RABBITMQ_USERNAME"] || "admin",
    password: process.env["RABBITMQ_PASSWORD"] || "admin123",
    vhost: process.env["RABBITMQ_VHOST"] || "/",
  },

  // Logging configuration
  logging: {
    level: process.env["LOG_LEVEL"] || "info",
    format: process.env["LOG_FORMAT"] || "json",
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env["RATE_LIMIT_WINDOW_MS"] || "900000", 10), // 15 minutes
    max: parseInt(process.env["RATE_LIMIT_MAX"] || "100", 10),
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env["BCRYPT_ROUNDS"] || "12", 10),
    passwordMinLength: parseInt(process.env["PASSWORD_MIN_LENGTH"] || "8", 10),
    sessionTimeout: parseInt(process.env["SESSION_TIMEOUT"] || "3600000", 10), // 1 hour
  },

  // Service URLs
  services: {
    productService: process.env["PRODUCT_SERVICE_URL"] || "http://localhost:3002",
    orderService: process.env["ORDER_SERVICE_URL"] || "http://localhost:3003",
    notificationService:
      process.env["NOTIFICATION_SERVICE_URL"] || "http://localhost:3004",
    paymentService: process.env["PAYMENT_SERVICE_URL"] || "http://localhost:3005",
    analyticsService:
      process.env["ANALYTICS_SERVICE_URL"] || "http://localhost:3006",
  },

  // Monitoring configuration
  monitoring: {
    prometheus: {
      enabled: process.env["PROMETHEUS_ENABLED"] === "true",
      port: parseInt(process.env["PROMETHEUS_PORT"] || "9090", 10),
    },
    jaeger: {
      enabled: process.env["JAEGER_ENABLED"] === "true",
      endpoint:
        process.env["JAEGER_ENDPOINT"] || "http://localhost:14268/api/traces",
    },
  },

  // Email configuration (for notifications)
  email: {
    host: process.env["EMAIL_HOST"],
    port: parseInt(process.env["EMAIL_PORT"] || "587", 10),
    secure: process.env["EMAIL_SECURE"] === "true",
    auth: {
      user: process.env["EMAIL_USER"],
      pass: process.env["EMAIL_PASS"],
    },
  },
};

// Validation function to ensure required environment variables are set
export const validateConfig = (): void => {
  const requiredEnvVars = [
    "JWT_SECRET",
    "POSTGRES_PASSWORD",
    "REDIS_PASSWORD",
    "RABBITMQ_PASSWORD",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
};

// Export configuration for testing
export const getTestConfig = () => ({
  ...config,
  port: 0, // Use random port for testing
  postgres: {
    ...config.postgres,
    database: "test_microservices",
  },
  redis: {
    ...config.redis,
    db: 1, // Use different database for testing
  },
});

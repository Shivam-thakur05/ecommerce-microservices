// Application constants

export const APP_CONFIG = {
  NAME: "E-Commerce Microservices",
  VERSION: "1.0.0",
  DESCRIPTION:
    "Industry-level microservices architecture for e-commerce platform",
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Service Names
export const SERVICE_NAMES = {
  USER_SERVICE: "user-service",
  PRODUCT_SERVICE: "product-service",
  ORDER_SERVICE: "order-service",
  PAYMENT_SERVICE: "payment-service",
  NOTIFICATION_SERVICE: "notification-service",
  ANALYTICS_SERVICE: "analytics-service",
  API_GATEWAY: "api-gateway",
} as const;

// Service Ports
export const SERVICE_PORTS = {
  API_GATEWAY: 3000,
  USER_SERVICE: 3001,
  PRODUCT_SERVICE: 3002,
  ORDER_SERVICE: 3003,
  NOTIFICATION_SERVICE: 3004,
  PAYMENT_SERVICE: 3005,
  ANALYTICS_SERVICE: 3006,
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
  POSTGRES: {
    DEFAULT_PORT: 5432,
    DEFAULT_DB: "microservices",
    DEFAULT_USER: "postgres",
    POOL_MIN: 2,
    POOL_MAX: 10,
    POOL_IDLE: 30000,
  },
  MONGODB: {
    DEFAULT_PORT: 27017,
    DEFAULT_DB: "microservices",
    DEFAULT_USER: "admin",
  },
  REDIS: {
    DEFAULT_PORT: 6379,
    DEFAULT_DB: 0,
    KEY_PREFIX: "ms:",
    TTL: {
      SHORT: 300, // 5 minutes
      MEDIUM: 3600, // 1 hour
      LONG: 86400, // 24 hours
      SESSION: 1800, // 30 minutes
    },
  },
  RABBITMQ: {
    DEFAULT_PORT: 5672,
    MANAGEMENT_PORT: 15672,
    DEFAULT_USER: "admin",
    DEFAULT_VHOST: "/",
    HEARTBEAT: 60,
    CONNECTION_TIMEOUT: 30000,
  },
} as const;

// JWT Configuration
export const JWT_CONFIG = {
  ALGORITHM: "HS256",
  EXPIRES_IN: {
    ACCESS_TOKEN: "15m",
    REFRESH_TOKEN: "7d",
    RESET_PASSWORD: "1h",
    EMAIL_VERIFICATION: "24h",
  },
  ISSUER: "ecommerce-microservices",
  AUDIENCE: "ecommerce-users",
} as const;

// Rate Limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  SKIP_SUCCESSFUL_REQUESTS: false,
  SKIP_FAILED_REQUESTS: false,
  MESSAGE: "Too many requests from this IP, please try again later.",
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  UPLOAD_PATH: "uploads",
  CDN_URL: process.env.CDN_URL || "https://cdn.example.com",
} as const;

// Email Configuration
export const EMAIL_CONFIG = {
  FROM: "noreply@ecommerce.com",
  SUBJECTS: {
    WELCOME: "Welcome to Our E-Commerce Platform",
    PASSWORD_RESET: "Password Reset Request",
    EMAIL_VERIFICATION: "Verify Your Email Address",
    ORDER_CONFIRMATION: "Order Confirmation",
    ORDER_SHIPPED: "Your Order Has Been Shipped",
    ORDER_DELIVERED: "Your Order Has Been Delivered",
  },
  TEMPLATES: {
    WELCOME: "welcome",
    PASSWORD_RESET: "password-reset",
    EMAIL_VERIFICATION: "email-verification",
    ORDER_CONFIRMATION: "order-confirmation",
    ORDER_SHIPPED: "order-shipped",
    ORDER_DELIVERED: "order-delivered",
  },
} as const;

// SMS Configuration
export const SMS_CONFIG = {
  FROM: "ECOMMERCE",
  TEMPLATES: {
    ORDER_CONFIRMATION: "Your order #{orderNumber} has been confirmed.",
    ORDER_SHIPPED:
      "Your order #{orderNumber} has been shipped. Track: {trackingUrl}",
    ORDER_DELIVERED: "Your order #{orderNumber} has been delivered.",
    PASSWORD_RESET: "Your password reset code is: {code}",
  },
} as const;

// Payment Gateway Configuration
export const PAYMENT_CONFIG = {
  STRIPE: {
    CURRENCY: "usd",
    PAYMENT_METHODS: ["card", "sepa_debit", "sofort"],
  },
  PAYPAL: {
    CURRENCY: "USD",
    PAYMENT_METHODS: ["paypal"],
  },
  CRYPTO: {
    SUPPORTED_CURRENCIES: ["BTC", "ETH", "USDT"],
  },
} as const;

// Order Configuration
export const ORDER_CONFIG = {
  AUTO_CANCEL_MINUTES: 30,
  MAX_ITEMS_PER_ORDER: 50,
  MIN_ORDER_AMOUNT: 10,
  MAX_ORDER_AMOUNT: 10000,
  TAX_RATE: 0.08, // 8%
  SHIPPING_METHODS: {
    STANDARD: {
      id: "standard",
      name: "Standard Shipping",
      price: 5.99,
      estimatedDays: 5,
    },
    EXPRESS: {
      id: "express",
      name: "Express Shipping",
      price: 12.99,
      estimatedDays: 2,
    },
    PREMIUM: {
      id: "premium",
      name: "Premium Shipping",
      price: 19.99,
      estimatedDays: 1,
    },
  },
} as const;

// Product Configuration
export const PRODUCT_CONFIG = {
  MAX_IMAGES_PER_PRODUCT: 10,
  MAX_VARIANTS_PER_PRODUCT: 50,
  MAX_ATTRIBUTES_PER_PRODUCT: 20,
  MIN_STOCK_LEVEL: 0,
  MAX_STOCK_LEVEL: 999999,
  PRICE_PRECISION: 2,
  WEIGHT_UNITS: ["g", "kg", "lb", "oz"],
  DIMENSION_UNITS: ["cm", "inch"],
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER: {
    PROFILE: (userId: string) => `user:profile:${userId}`,
    SESSION: (sessionId: string) => `user:session:${sessionId}`,
    PREFERENCES: (userId: string) => `user:preferences:${userId}`,
  },
  PRODUCT: {
    DETAILS: (productId: string) => `product:details:${productId}`,
    LIST: (filters: string) => `product:list:${filters}`,
    SEARCH: (query: string) => `product:search:${query}`,
    CATEGORY: (categoryId: string) => `product:category:${categoryId}`,
  },
  ORDER: {
    DETAILS: (orderId: string) => `order:details:${orderId}`,
    USER_ORDERS: (userId: string) => `order:user:${userId}`,
  },
  PAYMENT: {
    DETAILS: (paymentId: string) => `payment:details:${paymentId}`,
  },
  ANALYTICS: {
    DASHBOARD: (userId: string) => `analytics:dashboard:${userId}`,
    SALES: (dateRange: string) => `analytics:sales:${dateRange}`,
  },
} as const;

// Event Types
export const EVENT_TYPES = {
  USER: {
    CREATED: "user.created",
    UPDATED: "user.updated",
    DELETED: "user.deleted",
    LOGIN: "user.login",
    LOGOUT: "user.logout",
    PASSWORD_CHANGED: "user.password_changed",
    EMAIL_VERIFIED: "user.email_verified",
  },
  PRODUCT: {
    CREATED: "product.created",
    UPDATED: "product.updated",
    DELETED: "product.deleted",
    STOCK_UPDATED: "product.stock_updated",
    VIEWED: "product.viewed",
  },
  ORDER: {
    CREATED: "order.created",
    UPDATED: "order.updated",
    CANCELLED: "order.cancelled",
    CONFIRMED: "order.confirmed",
    SHIPPED: "order.shipped",
    DELIVERED: "order.delivered",
  },
  PAYMENT: {
    CREATED: "payment.created",
    PROCESSED: "payment.processed",
    FAILED: "payment.failed",
    REFUNDED: "payment.refunded",
  },
  NOTIFICATION: {
    SENT: "notification.sent",
    DELIVERED: "notification.delivered",
    FAILED: "notification.failed",
  },
  ANALYTICS: {
    PAGE_VIEW: "analytics.page_view",
    CONVERSION: "analytics.conversion",
    CART_ADDED: "analytics.cart_added",
    CART_REMOVED: "analytics.cart_removed",
  },
} as const;

// Queue Names
export const QUEUE_NAMES = {
  EMAIL: "email-queue",
  SMS: "sms-queue",
  PUSH_NOTIFICATION: "push-notification-queue",
  ANALYTICS: "analytics-queue",
  PAYMENT_PROCESSING: "payment-processing-queue",
  ORDER_PROCESSING: "order-processing-queue",
  INVENTORY_UPDATE: "inventory-update-queue",
} as const;

// Environment Variables
export const ENV_VARS = {
  NODE_ENV: "NODE_ENV",
  PORT: "PORT",
  DATABASE_URL: "DATABASE_URL",
  REDIS_URL: "REDIS_URL",
  RABBITMQ_URL: "RABBITMQ_URL",
  JWT_SECRET: "JWT_SECRET",
  API_KEY: "API_KEY",
  LOG_LEVEL: "LOG_LEVEL",
  CORS_ORIGIN: "CORS_ORIGIN",
  RATE_LIMIT_WINDOW: "RATE_LIMIT_WINDOW",
  RATE_LIMIT_MAX: "RATE_LIMIT_MAX",
  SESSION_SECRET: "SESSION_SECRET",
  ENCRYPTION_KEY: "ENCRYPTION_KEY",
  STRIPE_SECRET_KEY: "STRIPE_SECRET_KEY",
  STRIPE_WEBHOOK_SECRET: "STRIPE_WEBHOOK_SECRET",
  PAYPAL_CLIENT_ID: "PAYPAL_CLIENT_ID",
  PAYPAL_CLIENT_SECRET: "PAYPAL_CLIENT_SECRET",
  SMTP_HOST: "SMTP_HOST",
  SMTP_PORT: "SMTP_PORT",
  SMTP_USER: "SMTP_USER",
  SMTP_PASS: "SMTP_PASS",
  TWILIO_ACCOUNT_SID: "TWILIO_ACCOUNT_SID",
  TWILIO_AUTH_TOKEN: "TWILIO_AUTH_TOKEN",
  FIREBASE_PROJECT_ID: "FIREBASE_PROJECT_ID",
  FIREBASE_PRIVATE_KEY: "FIREBASE_PRIVATE_KEY",
  FIREBASE_CLIENT_EMAIL: "FIREBASE_CLIENT_EMAIL",
  AWS_ACCESS_KEY_ID: "AWS_ACCESS_KEY_ID",
  AWS_SECRET_ACCESS_KEY: "AWS_SECRET_ACCESS_KEY",
  AWS_REGION: "AWS_REGION",
  AWS_S3_BUCKET: "AWS_S3_BUCKET",
  CDN_URL: "CDN_URL",
} as const;

// Log Levels
export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
} as const;

// HTTP Headers
export const HEADERS = {
  AUTHORIZATION: "Authorization",
  CONTENT_TYPE: "Content-Type",
  ACCEPT: "Accept",
  USER_AGENT: "User-Agent",
  X_REQUEST_ID: "X-Request-ID",
  X_CORRELATION_ID: "X-Correlation-ID",
  X_API_KEY: "X-API-Key",
  X_RATE_LIMIT_LIMIT: "X-RateLimit-Limit",
  X_RATE_LIMIT_REMAINING: "X-RateLimit-Remaining",
  X_RATE_LIMIT_RESET: "X-RateLimit-Reset",
} as const;

// Content Types
export const CONTENT_TYPES = {
  JSON: "application/json",
  FORM_DATA: "multipart/form-data",
  TEXT_PLAIN: "text/plain",
  TEXT_HTML: "text/html",
} as const;

// Time Formats
export const TIME_FORMATS = {
  ISO: "YYYY-MM-DDTHH:mm:ss.SSSZ",
  DATE: "YYYY-MM-DD",
  TIME: "HH:mm:ss",
  DATETIME: "YYYY-MM-DD HH:mm:ss",
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
  },
  EMAIL: {
    MAX_LENGTH: 254,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  PHONE: {
    PATTERN: /^\+?[1-9]\d{1,14}$/,
  },
  PRODUCT_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  PRODUCT_DESCRIPTION: {
    MAX_LENGTH: 2000,
  },
  ORDER_NOTES: {
    MAX_LENGTH: 500,
  },
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  PASSWORD_SALT_ROUNDS: 12,
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  CSRF_TOKEN_LENGTH: 32,
  API_KEY_LENGTH: 64,
  ENCRYPTION_ALGORITHM: "aes-256-gcm",
  HASH_ALGORITHM: "sha256",
} as const;

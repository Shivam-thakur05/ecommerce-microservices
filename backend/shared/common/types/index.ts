// Common types used across all microservices

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User Management Types
export interface User extends BaseEntity {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  role: UserRole;
  preferences: UserPreferences;
  addresses: Address[];
  avatar?: string;
  lastLoginAt?: Date;
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  MODERATOR = "moderator",
  CUSTOMER_SUPPORT = "customer_support",
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  marketingEmails: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

export interface Address extends BaseEntity {
  type: "billing" | "shipping";
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber?: string;
  isDefault: boolean;
}

// Product Management Types
export interface Product extends BaseEntity {
  name: string;
  description: string;
  shortDescription: string;
  sku: string;
  price: number;
  comparePrice?: number;
  costPrice: number;
  categoryId: string;
  brandId?: string;
  stock: number;
  minStockLevel: number;
  maxStockLevel: number;
  images: ProductImage[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  weight: number;
  dimensions: ProductDimensions;
  seo: SEOData;
  ratings: ProductRating[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface ProductAttribute {
  name: string;
  value: string;
  type: "text" | "number" | "boolean" | "select";
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: "cm" | "inch";
}

export interface ProductRating {
  userId: string;
  rating: number;
  review?: string;
  createdAt: Date;
}

export interface Category extends BaseEntity {
  name: string;
  description: string;
  slug: string;
  parentId?: string;
  image?: string;
  isActive: boolean;
  order: number;
}

export interface Brand extends BaseEntity {
  name: string;
  description: string;
  logo: string;
  website?: string;
  isActive: boolean;
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
}

// Order Management Types
export interface Order extends BaseEntity {
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingMethod: ShippingMethod;
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  notes?: string;
  tags: string[];
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  discountAmount: number;
  attributes?: Record<string, string>;
}

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  RETURNED = "returned",
  REFUNDED = "refunded",
}

export enum PaymentStatus {
  PENDING = "pending",
  AUTHORIZED = "authorized",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  PARTIALLY_REFUNDED = "partially_refunded",
}

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  PAYPAL = "paypal",
  BANK_TRANSFER = "bank_transfer",
  CASH_ON_DELIVERY = "cash_on_delivery",
  CRYPTO = "crypto",
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: number;
  isActive: boolean;
}

// Payment Management Types
export interface Payment extends BaseEntity {
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  gatewayResponse?: PaymentGatewayResponse;
  refunds: Refund[];
  metadata?: Record<string, any>;
}

export interface PaymentGatewayResponse {
  gateway: string;
  transactionId: string;
  status: string;
  responseCode: string;
  responseMessage: string;
  rawResponse?: any;
}

export interface Refund extends BaseEntity {
  paymentId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  gatewayTransactionId?: string;
  notes?: string;
}

export enum RefundStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

// Notification Types
export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority: NotificationPriority;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveryStatus: DeliveryStatus;
}

export enum NotificationType {
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
  IN_APP = "in_app",
  WEBHOOK = "webhook",
}

export enum NotificationPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

export enum DeliveryStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  BOUNCED = "bounced",
}

export interface NotificationTemplate extends BaseEntity {
  name: string;
  type: NotificationType;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

// Analytics Types
export interface AnalyticsEvent extends BaseEntity {
  eventType: string;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  timestamp: Date;
  source: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

export interface PageView extends BaseEntity {
  userId?: string;
  sessionId: string;
  page: string;
  title: string;
  referrer?: string;
  userAgent: string;
  ipAddress: string;
  duration?: number;
}

export interface Conversion extends BaseEntity {
  userId: string;
  orderId: string;
  value: number;
  currency: string;
  source: string;
  medium: string;
  campaign?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
  requestId?: string;
}

// Service Communication types
export interface ServiceEvent {
  type: string;
  data: any;
  timestamp: Date;
  source: string;
  correlationId: string;
  version: string;
  metadata?: Record<string, any>;
}

export interface HealthCheck {
  service: string;
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: Date;
  version: string;
  uptime: number;
  details?: Record<string, any>;
  dependencies?: {
    database: "healthy" | "unhealthy";
    redis: "healthy" | "unhealthy";
    rabbitmq: "healthy" | "unhealthy";
  };
}

// Database types
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
    idle: number;
  };
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

export interface RabbitMQConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost?: string;
  heartbeat?: number;
  connectionTimeout?: number;
}

// Environment types
export interface Environment {
  NODE_ENV: "development" | "staging" | "production";
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  RABBITMQ_URL: string;
  JWT_SECRET: string;
  API_KEY: string;
  LOG_LEVEL: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX: number;
  SESSION_SECRET: string;
  ENCRYPTION_KEY: string;
}

// Cache types
export interface CacheConfig {
  ttl: number;
  maxSize: number;
  checkPeriod: number;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Search types
export interface SearchFilters {
  query?: string;
  category?: string;
  brand?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  facets: Record<string, any>;
  suggestions: string[];
}

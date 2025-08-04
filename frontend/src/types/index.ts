// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin" | "moderator";
  status: "active" | "inactive" | "suspended";
  emailVerified: boolean;
  phoneNumber?: string;
  dateOfBirth?: string;
  avatar?: string;
  addresses: Address[];
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  type: "billing" | "shipping";
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  language: string;
  timezone: string;
  currency: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  sku: string;
  price: number;
  comparePrice?: number;
  costPrice: number;
  categoryId: string;
  category?: Category;
  brandId?: string;
  brand?: Brand;
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
  dimensions?: ProductDimensions;
  seo?: SEOData;
  ratings: ProductRating[];
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
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
  name: string;
  sku: string;
  price: number;
  comparePrice?: number;
  stock: number;
  attributes: Record<string, string>;
  images: ProductImage[];
}

export interface ProductAttribute {
  name: string;
  value: string;
  type: "text" | "number" | "boolean" | "select";
  options?: string[];
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: "cm" | "inch";
}

export interface ProductRating {
  id: string;
  userId: string;
  user?: User;
  rating: number;
  review?: string;
  createdAt: string;
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  image?: string;
  isActive: boolean;
  order: number;
  children?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
}

// Search and Filter Types
export interface SearchFilters {
  category?: string;
  brand?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  attributes?: Record<string, string>;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  user?: User;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  billingAddress: Address;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  attributes?: Record<string, string>;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export interface PaymentMethod {
  id: string;
  type:
    | "credit_card"
    | "debit_card"
    | "paypal"
    | "stripe"
    | "apple_pay"
    | "google_pay";
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

// Payment Types
export interface Payment {
  id: string;
  orderId: string;
  order?: Order;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  gatewayResponse?: any;
  refundedAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed";
  clientSecret: string;
  paymentMethodId?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: "email" | "sms" | "push" | "in_app";
  title: string;
  message: string;
  data?: Record<string, any>;
  status: "pending" | "sent" | "failed" | "delivered";
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: "email" | "sms" | "push";
  subject?: string;
  title: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface AnalyticsData {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Product[];
  topCategories: Category[];
  revenueByMonth: RevenueData[];
  ordersByStatus: Record<OrderStatus, number>;
}

export interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "select"
    | "textarea"
    | "checkbox"
    | "radio";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: any;
}

// UI Types
export interface Breadcrumb {
  label: string;
  href?: string;
  current?: boolean;
}

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Store Types
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}

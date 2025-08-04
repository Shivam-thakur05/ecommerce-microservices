// Custom error classes for microservices

export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// HTTP Errors
export class BadRequestError extends BaseError {
  constructor(message: string = "Bad Request", code: string = "BAD_REQUEST") {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string = "Unauthorized", code: string = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = "Forbidden", code: string = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string = "Not Found", code: string = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string = "Conflict", code: string = "CONFLICT") {
    super(message, 409, code);
  }
}

export class ValidationError extends BaseError {
  public readonly details: any;

  constructor(message: string = "Validation Error", details?: any) {
    super(message, 422, "VALIDATION_ERROR");
    this.details = details;
  }
}

export class TooManyRequestsError extends BaseError {
  constructor(
    message: string = "Too Many Requests",
    code: string = "RATE_LIMIT_EXCEEDED"
  ) {
    super(message, 429, code);
  }
}

export class InternalServerError extends BaseError {
  constructor(
    message: string = "Internal Server Error",
    code: string = "INTERNAL_ERROR"
  ) {
    super(message, 500, code);
  }
}

export class ServiceUnavailableError extends BaseError {
  constructor(
    message: string = "Service Unavailable",
    code: string = "SERVICE_UNAVAILABLE"
  ) {
    super(message, 503, code);
  }
}

// Business Logic Errors
export class InsufficientStockError extends BaseError {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`,
      400,
      "INSUFFICIENT_STOCK"
    );
  }
}

export class PaymentFailedError extends BaseError {
  constructor(
    message: string = "Payment processing failed",
    gatewayError?: string
  ) {
    super(
      gatewayError ? `${message}: ${gatewayError}` : message,
      400,
      "PAYMENT_FAILED"
    );
  }
}

export class OrderCancellationError extends BaseError {
  constructor(orderId: string, reason: string) {
    super(
      `Cannot cancel order ${orderId}: ${reason}`,
      400,
      "ORDER_CANCELLATION_FAILED"
    );
  }
}

export class UserAlreadyExistsError extends BaseError {
  constructor(email: string) {
    super(
      `User with email ${email} already exists`,
      409,
      "USER_ALREADY_EXISTS"
    );
  }
}

export class InvalidCredentialsError extends BaseError {
  constructor(message: string = "Invalid credentials") {
    super(message, 401, "INVALID_CREDENTIALS");
  }
}

export class TokenExpiredError extends BaseError {
  constructor(message: string = "Token has expired") {
    super(message, 401, "TOKEN_EXPIRED");
  }
}

export class InvalidTokenError extends BaseError {
  constructor(message: string = "Invalid token") {
    super(message, 401, "INVALID_TOKEN");
  }
}

// Database Errors
export class DatabaseConnectionError extends BaseError {
  constructor(message: string = "Database connection failed") {
    super(message, 503, "DATABASE_CONNECTION_ERROR", false);
  }
}

export class DatabaseQueryError extends BaseError {
  constructor(message: string = "Database query failed") {
    super(message, 500, "DATABASE_QUERY_ERROR", false);
  }
}

// External Service Errors
export class ExternalServiceError extends BaseError {
  constructor(service: string, message: string) {
    super(
      `${service} service error: ${message}`,
      502,
      "EXTERNAL_SERVICE_ERROR"
    );
  }
}

export class ServiceTimeoutError extends BaseError {
  constructor(service: string, timeout: number) {
    super(
      `${service} service timeout after ${timeout}ms`,
      504,
      "SERVICE_TIMEOUT"
    );
  }
}

// Cache Errors
export class CacheError extends BaseError {
  constructor(message: string = "Cache operation failed") {
    super(message, 500, "CACHE_ERROR", false);
  }
}

// Message Queue Errors
export class MessageQueueError extends BaseError {
  constructor(message: string = "Message queue operation failed") {
    super(message, 500, "MESSAGE_QUEUE_ERROR", false);
  }
}

// Error handler utility
export class ErrorHandler {
  static handle(error: Error): BaseError {
    if (error instanceof BaseError) {
      return error;
    }

    // Handle common database errors
    if (
      error.name === "SequelizeConnectionError" ||
      error.name === "MongooseConnectionError"
    ) {
      return new DatabaseConnectionError(error.message);
    }

    if (
      error.name === "SequelizeValidationError" ||
      error.name === "MongooseValidationError"
    ) {
      return new ValidationError(error.message);
    }

    if (
      error.name === "SequelizeUniqueConstraintError" ||
      (error.name === "MongoError" && (error as any).code === 11000)
    ) {
      return new ConflictError("Resource already exists");
    }

    // Handle JWT errors
    if (error.name === "JsonWebTokenError") {
      return new InvalidTokenError("Invalid token format");
    }

    if (error.name === "TokenExpiredError") {
      return new TokenExpiredError();
    }

    // Handle network errors
    if (error.name === "ECONNREFUSED" || error.name === "ENOTFOUND") {
      return new ExternalServiceError("External Service", "Connection refused");
    }

    if (error.name === "ETIMEDOUT") {
      return new ServiceTimeoutError("External Service", 5000);
    }

    // Default to internal server error
    return new InternalServerError(error.message);
  }

  static isOperational(error: Error): boolean {
    if (error instanceof BaseError) {
      return error.isOperational;
    }
    return false;
  }

  static getErrorResponse(error: BaseError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error instanceof ValidationError &&
          error.details && { details: error.details }),
      },
      timestamp: new Date(),
    };
  }
}

// Error codes enum
export enum ErrorCodes {
  // HTTP Errors
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",

  // Business Logic Errors
  INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  ORDER_CANCELLATION_FAILED = "ORDER_CANCELLATION_FAILED",
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_TOKEN = "INVALID_TOKEN",

  // Infrastructure Errors
  DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR",
  DATABASE_QUERY_ERROR = "DATABASE_QUERY_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  SERVICE_TIMEOUT = "SERVICE_TIMEOUT",
  CACHE_ERROR = "CACHE_ERROR",
  MESSAGE_QUEUE_ERROR = "MESSAGE_QUEUE_ERROR",
}

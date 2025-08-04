import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import createLogger from "../../common/utils/logger";
import { TooManyRequestsError } from "../../common/errors";
import { RATE_LIMIT, HEADERS } from "../../common/constants";

const logger = createLogger("rate-limiting-middleware");

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
  skip?: (req: Request) => boolean;
}

// Default rate limit configuration
const defaultConfig: RateLimitConfig = {
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: RATE_LIMIT.MESSAGE,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: RATE_LIMIT.SKIP_SUCCESSFUL_REQUESTS,
  skipFailedRequests: RATE_LIMIT.SKIP_FAILED_REQUESTS,
};

// Generate key based on IP address
function generateKeyByIP(req: Request): string {
  // Use the ipKeyGenerator helper for IPv6 compatibility
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  return ip;
}

// Generate key based on user ID (if authenticated)
function generateKeyByUser(req: Request): string {
  if (req.user && "id" in req.user) {
    return `user:${(req.user as any).id}`;
  }
  return generateKeyByIP(req);
}

// Generate key based on API key
function generateKeyByAPIKey(req: Request): string {
  const apiKey = req.headers["x-api-key"] as string;
  if (apiKey) {
    return `apikey:${apiKey}`;
  }
  return generateKeyByIP(req);
}

// Generate key based on service name
function generateKeyByService(req: Request): string {
  const serviceName = req.headers["x-service-name"] as string;
  if (serviceName) {
    return `service:${serviceName}`;
  }
  return generateKeyByIP(req);
}

// Custom handler for rate limit exceeded
function rateLimitHandler(req: Request, res: Response): void {
  const error = new TooManyRequestsError("Rate limit exceeded");

  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
    },
    timestamp: new Date(),
  });
}

// Skip rate limiting for certain conditions
function skipRateLimit(req: Request): boolean {
  // Skip for health checks
  if (req.path === "/health" || req.path === "/healthz") {
    return true;
  }

  // Skip for internal service communication
  if (req.headers["x-service-name"]) {
    return true;
  }

  // Skip for admin users
  if (req.user && "role" in req.user && (req.user as any).role === "admin") {
    return true;
  }

  return false;
}

// Create rate limiter with custom configuration
export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  return rateLimit({
    windowMs: finalConfig.windowMs,
    max: finalConfig.max,
    message: finalConfig.message,
    standardHeaders: finalConfig.standardHeaders,
    legacyHeaders: finalConfig.legacyHeaders,
    skipSuccessfulRequests: finalConfig.skipSuccessfulRequests,
    skipFailedRequests: finalConfig.skipFailedRequests,
    keyGenerator: finalConfig.keyGenerator || generateKeyByIP,
    handler: finalConfig.handler || rateLimitHandler,
    skip: finalConfig.skip || skipRateLimit,
  });
}

// Strict rate limiter (for sensitive endpoints)
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many requests from this IP, please try again later.",
  keyGenerator: generateKeyByIP,
});

// Standard rate limiter (for general endpoints)
export const standardRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  keyGenerator: generateKeyByUser,
});

// API rate limiter (for API endpoints)
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  keyGenerator: generateKeyByAPIKey,
  skip: (req: Request) => {
    // Skip for authenticated services
    if (req.headers["x-service-name"]) {
      return true;
    }
    return false;
  },
});

// Login rate limiter (for authentication endpoints)
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: "Too many login attempts, please try again later.",
  keyGenerator: generateKeyByIP,
  skip: (req: Request) => {
    // Skip for successful logins
    if (
      req.path.includes("/login") &&
      req.method === "POST" &&
      req.statusCode === 200
    ) {
      return true;
    }
    return false;
  },
});

// Registration rate limiter
export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: "Too many registration attempts, please try again later.",
  keyGenerator: generateKeyByIP,
});

// Password reset rate limiter
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: "Too many password reset attempts, please try again later.",
  keyGenerator: generateKeyByIP,
});

// File upload rate limiter
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: "Too many file uploads, please try again later.",
  keyGenerator: generateKeyByUser,
});

// Search rate limiter
export const searchRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 searches per 5 minutes
  message: "Too many search requests, please try again later.",
  keyGenerator: generateKeyByUser,
});

// Service-to-service rate limiter
export const serviceRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  keyGenerator: generateKeyByService,
  skip: (req: Request) => {
    // Only apply to service-to-service communication
    return !req.headers["x-service-name"];
  },
});

// Dynamic rate limiter based on user role
export function dynamicRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let limiter: ReturnType<typeof createRateLimiter>;

  // Choose rate limiter based on user role
  const userRole =
    req.user && "role" in req.user ? (req.user as any).role : null;

  if (userRole === "admin") {
    // Admin users get higher limits
    limiter = createRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      keyGenerator: generateKeyByUser,
    });
  } else if (userRole === "premium") {
    // Premium users get medium limits
    limiter = createRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 500,
      keyGenerator: generateKeyByUser,
    });
  } else {
    // Regular users get standard limits
    limiter = createRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 100,
      keyGenerator: generateKeyByUser,
    });
  }

  limiter(req, res, next);
}

// Rate limit middleware with custom headers
export function rateLimitWithHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const limiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: generateKeyByUser,
    handler: (req: Request, res: Response) => {
      // Add custom headers
      res.setHeader(HEADERS.X_RATE_LIMIT_LIMIT, "100");
      res.setHeader(HEADERS.X_RATE_LIMIT_REMAINING, "0");
      res.setHeader(
        HEADERS.X_RATE_LIMIT_RESET,
        new Date(Date.now() + 15 * 60 * 1000).toISOString()
      );

      rateLimitHandler(req, res);
    },
  });

  limiter(req, res, next);
}

// Rate limit middleware for specific paths
export function pathBasedRateLimiter(paths: Record<string, RateLimitConfig>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const path = req.path;
    const config = paths[path];

    if (config) {
      const limiter = createRateLimiter(config);
      limiter(req, res, next);
    } else {
      // Use default rate limiter for unmatched paths
      const defaultLimiter = createRateLimiter();
      defaultLimiter(req, res, next);
    }
  };
}

// Rate limit middleware for different HTTP methods
export function methodBasedRateLimiter(
  methods: Record<string, RateLimitConfig>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const method = req.method;
    const config = methods[method];

    if (config) {
      const limiter = createRateLimiter(config);
      limiter(req, res, next);
    } else {
      // Use default rate limiter for unmatched methods
      const defaultLimiter = createRateLimiter();
      defaultLimiter(req, res, next);
    }
  };
}

// Rate limit middleware with exponential backoff
export function exponentialBackoffRateLimiter(baseDelay: number = 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = generateKeyByUser(req);
    const attempts =
      parseInt(req.headers["x-rate-limit-attempts"] as string) || 0;

    if (attempts > 0) {
      const delay = baseDelay * Math.pow(2, attempts - 1);
      setTimeout(() => {
        next();
      }, delay);
    } else {
      next();
    }
  };
}

// Rate limit middleware with sliding window
export function slidingWindowRateLimiter(
  windowMs: number,
  maxRequests: number
) {
  const requests = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = generateKeyByUser(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this key
    const userRequests = requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      (timestamp) => timestamp > windowStart
    );

    // Check if limit exceeded
    if (validRequests.length >= maxRequests) {
      const error = new TooManyRequestsError("Rate limit exceeded");
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
        timestamp: new Date(),
      });
      return;
    }

    // Add current request
    validRequests.push(now);
    requests.set(key, validRequests);

    // Clean up old entries (optional, for memory management)
    if (requests.size > 10000) {
      const oldestKey = requests.keys().next().value;
      requests.delete(oldestKey);
    }

    next();
  };
}

export default {
  createRateLimiter,
  strictRateLimiter,
  standardRateLimiter,
  apiRateLimiter,
  loginRateLimiter,
  registrationRateLimiter,
  passwordResetRateLimiter,
  uploadRateLimiter,
  searchRateLimiter,
  serviceRateLimiter,
  dynamicRateLimiter,
  rateLimitWithHeaders,
  pathBasedRateLimiter,
  methodBasedRateLimiter,
  exponentialBackoffRateLimiter,
  slidingWindowRateLimiter,
};

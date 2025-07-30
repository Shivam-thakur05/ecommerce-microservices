import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import createLogger from "../../common/utils/logger";
import {
  UnauthorizedError,
  ForbiddenError,
  InvalidTokenError,
  TokenExpiredError,
} from "../../common/errors";
import { JWT_CONFIG, SERVICE_NAMES } from "../../common/constants";
import { UserRole } from "../../common/types";

const logger = createLogger("jwt-middleware");

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  service: string;
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    service: string;
  };
}

// JWT token generation
export function generateAccessToken(
  payload: Omit<JWTPayload, "iat" | "exp">
): string {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      algorithm: JWT_CONFIG.ALGORITHM,
      expiresIn: JWT_CONFIG.EXPIRES_IN.ACCESS_TOKEN,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    });
  } catch (error) {
    logger.error("Failed to generate access token", { error: error.message });
    throw new Error("Token generation failed");
  }
}

export function generateRefreshToken(
  payload: Omit<JWTPayload, "iat" | "exp">
): string {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      algorithm: JWT_CONFIG.ALGORITHM,
      expiresIn: JWT_CONFIG.EXPIRES_IN.REFRESH_TOKEN,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    });
  } catch (error) {
    logger.error("Failed to generate refresh token", { error: error.message });
    throw new Error("Token generation failed");
  }
}

export function generateResetPasswordToken(
  userId: string,
  email: string
): string {
  try {
    return jwt.sign(
      { userId, email, type: "reset_password" },
      process.env.JWT_SECRET!,
      {
        algorithm: JWT_CONFIG.ALGORITHM,
        expiresIn: JWT_CONFIG.EXPIRES_IN.RESET_PASSWORD,
        issuer: JWT_CONFIG.ISSUER,
        audience: JWT_CONFIG.AUDIENCE,
      }
    );
  } catch (error) {
    logger.error("Failed to generate reset password token", {
      error: error.message,
    });
    throw new Error("Token generation failed");
  }
}

export function generateEmailVerificationToken(
  userId: string,
  email: string
): string {
  try {
    return jwt.sign(
      { userId, email, type: "email_verification" },
      process.env.JWT_SECRET!,
      {
        algorithm: JWT_CONFIG.ALGORITHM,
        expiresIn: JWT_CONFIG.EXPIRES_IN.EMAIL_VERIFICATION,
        issuer: JWT_CONFIG.ISSUER,
        audience: JWT_CONFIG.AUDIENCE,
      }
    );
  } catch (error) {
    logger.error("Failed to generate email verification token", {
      error: error.message,
    });
    throw new Error("Token generation failed");
  }
}

// JWT token verification
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: [JWT_CONFIG.ALGORITHM],
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    }) as JWTPayload;

    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new TokenExpiredError();
    }
    if (error.name === "JsonWebTokenError") {
      throw new InvalidTokenError("Invalid token format");
    }
    if (error.name === "NotBeforeError") {
      throw new InvalidTokenError("Token not active yet");
    }

    logger.error("Token verification failed", { error: error.message });
    throw new InvalidTokenError("Token verification failed");
  }
}

// Extract token from request
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

// Main authentication middleware
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError("Access token required");
    }

    const decoded = verifyToken(token);

    // Validate token payload
    if (!decoded.userId || !decoded.email || !decoded.role) {
      throw new InvalidTokenError("Invalid token payload");
    }

    // Add user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      service: decoded.service,
    };

    logger.debug("Token authenticated successfully", {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      service: decoded.service,
    });

    next();
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof InvalidTokenError ||
      error instanceof TokenExpiredError
    ) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
        timestamp: new Date(),
      });
    } else {
      logger.error("Authentication middleware error", { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: "AUTHENTICATION_ERROR",
          message: "Authentication failed",
        },
        timestamp: new Date(),
      });
    }
  }
}

// Optional authentication middleware (doesn't fail if no token)
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);

    if (!decoded.userId || !decoded.email || !decoded.role) {
      return next();
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      service: decoded.service,
    };

    logger.debug("Optional authentication successful", {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    next();
  } catch (error) {
    // For optional auth, we just continue without user info
    logger.debug("Optional authentication failed, continuing without user", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next();
  }
}

// Role-based authorization middleware
export function requireRole(roles: UserRole | UserRole[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      if (!requiredRoles.includes(req.user.role)) {
        throw new ForbiddenError(
          `Access denied. Required roles: ${requiredRoles.join(", ")}`
        );
      }

      logger.debug("Role authorization successful", {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles,
      });

      next();
    } catch (error) {
      if (
        error instanceof UnauthorizedError ||
        error instanceof ForbiddenError
      ) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date(),
        });
      } else {
        logger.error("Role authorization error", { error: error.message });
        res.status(500).json({
          success: false,
          error: {
            code: "AUTHORIZATION_ERROR",
            message: "Authorization failed",
          },
          timestamp: new Date(),
        });
      }
    }
  };
}

// Service-specific authorization middleware
export function requireService(services: string | string[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const requiredServices = Array.isArray(services) ? services : [services];

      if (!requiredServices.includes(req.user.service)) {
        throw new ForbiddenError(
          `Access denied. Required services: ${requiredServices.join(", ")}`
        );
      }

      logger.debug("Service authorization successful", {
        userId: req.user.id,
        userService: req.user.service,
        requiredServices,
      });

      next();
    } catch (error) {
      if (
        error instanceof UnauthorizedError ||
        error instanceof ForbiddenError
      ) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date(),
        });
      } else {
        logger.error("Service authorization error", { error: error.message });
        res.status(500).json({
          success: false,
          error: {
            code: "AUTHORIZATION_ERROR",
            message: "Authorization failed",
          },
          timestamp: new Date(),
        });
      }
    }
  };
}

// Admin-only middleware
export const requireAdmin = requireRole(UserRole.ADMIN);

// User or admin middleware
export const requireUserOrAdmin = requireRole([UserRole.USER, UserRole.ADMIN]);

// Service-to-service authentication middleware
export function authenticateService(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      throw new UnauthorizedError(
        "API key required for service-to-service communication"
      );
    }

    // In a real implementation, you would validate the API key against a database
    // For now, we'll use a simple environment variable check
    const validApiKeys = process.env.API_KEYS?.split(",") || [];

    if (!validApiKeys.includes(apiKey)) {
      throw new UnauthorizedError("Invalid API key");
    }

    // Extract service name from API key or request headers
    const serviceName =
      (req.headers["x-service-name"] as string) || "unknown-service";

    req.user = {
      id: "service",
      email: `${serviceName}@service`,
      role: UserRole.ADMIN, // Services have admin privileges
      service: serviceName,
    };

    logger.debug("Service authentication successful", {
      service: serviceName,
      apiKey: apiKey.substring(0, 8) + "...",
    });

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
        timestamp: new Date(),
      });
    } else {
      logger.error("Service authentication error", { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: "SERVICE_AUTHENTICATION_ERROR",
          message: "Service authentication failed",
        },
        timestamp: new Date(),
      });
    }
  }
}

// Token refresh middleware
export function refreshToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const refreshToken =
      req.body.refreshToken || (req.headers["x-refresh-token"] as string);

    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token required");
    }

    const decoded = verifyToken(refreshToken);

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      service: decoded.service,
    });

    // Generate new refresh token
    const newRefreshToken = generateRefreshToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      service: decoded.service,
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: JWT_CONFIG.EXPIRES_IN.ACCESS_TOKEN,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof InvalidTokenError ||
      error instanceof TokenExpiredError
    ) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
        timestamp: new Date(),
      });
    } else {
      logger.error("Token refresh error", { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: "TOKEN_REFRESH_ERROR",
          message: "Token refresh failed",
        },
        timestamp: new Date(),
      });
    }
  }
}

// Token validation endpoint middleware
export function validateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_MISSING",
          message: "Token is missing",
        },
        timestamp: new Date(),
      });
    }

    const decoded = verifyToken(token);

    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          service: decoded.service,
        },
        expiresAt: new Date(decoded.exp * 1000),
      },
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: "TOKEN_INVALID",
        message: error instanceof Error ? error.message : "Token is invalid",
      },
      timestamp: new Date(),
    });
  }
}

export default {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireUserOrAdmin,
  authenticateService,
  refreshToken,
  validateToken,
  generateAccessToken,
  generateRefreshToken,
  generateResetPasswordToken,
  generateEmailVerificationToken,
  verifyToken,
};

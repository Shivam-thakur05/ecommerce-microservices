import bcrypt from "bcryptjs";
import createLogger from "../../../../shared/common/utils/logger";
import { UserService } from "./user.service";
import { User, UserRole } from "../../../../shared/common/types";
import {
  NotFoundError,
  InvalidCredentialsError,
  UserAlreadyExistsError,
  ValidationError,
} from "../../../../shared/common/errors";
import {
  generateAccessToken,
  generateRefreshToken,
  generateResetPasswordToken,
  generateEmailVerificationToken,
  verifyToken,
} from "../../../../shared/middleware/auth/jwt";
import { getDefaultConnection as getRedisConnection } from "../../../../shared/database/redis/connection";
import { getDefaultConnection as getRabbitMQConnection } from "../../../../shared/database/rabbitmq/connection";
import {
  CACHE_KEYS,
  DATABASE_CONFIG,
  EVENT_TYPES,
} from "../../../../shared/common/constants";

const logger = createLogger("auth-service");

export class AuthService {
  private redisConnection = getRedisConnection();
  private rabbitMQConnection = getRabbitMQConnection();

  constructor(private userService: UserService) {}

  // Register new user
  async register(userData: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
  }): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Create user
      const user = await this.userService.createUser(userData);

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        service: "user-service",
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        service: "user-service",
      });

      // Store refresh token in Redis
      await this.storeRefreshToken(user.id, refreshToken);

      // Publish user created event
      await this.publishUserEvent(EVENT_TYPES.USER.CREATED, user);

      logger.info("User registered successfully", {
        userId: user.id,
        email: user.email,
      });

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error("Failed to register user", { error: error.message });
      throw error;
    }
  }

  // Login user
  async login(
    email: string,
    password: string
  ): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Get user by email
      const user = await this.userService.getUserByEmail(email);

      // Verify password using repository
      const isPasswordValid = await this.userService.verifyPassword(
        user.id,
        password
      );
      if (!isPasswordValid) {
        throw new InvalidCredentialsError("Invalid email or password");
      }

      // Check if user is active
      if (!user.isActive) {
        throw new InvalidCredentialsError("Account is deactivated");
      }

      // Update last login
      await this.userService.updateLastLogin(user.id);

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        service: "user-service",
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        service: "user-service",
      });

      // Store refresh token in Redis
      await this.storeRefreshToken(user.id, refreshToken);

      // Publish login event
      await this.publishUserEvent(EVENT_TYPES.USER.LOGIN, user);

      logger.info("User logged in successfully", {
        userId: user.id,
        email: user.email,
      });

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error("Failed to login user", { email, error: error.message });
      throw error;
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const decoded = verifyToken(refreshToken);

      // Check if refresh token exists in Redis
      const storedToken = await this.getStoredRefreshToken(decoded.userId);
      if (!storedToken || storedToken !== refreshToken) {
        throw new InvalidCredentialsError("Invalid refresh token");
      }

      // Get user
      const user = await this.userService.getUserById(decoded.userId);

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        service: "user-service",
      });

      const newRefreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        service: "user-service",
      });

      // Store new refresh token
      await this.storeRefreshToken(user.id, newRefreshToken);

      logger.info("Token refreshed successfully", { userId: user.id });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error("Failed to refresh token", { error: error.message });
      throw error;
    }
  }

  // Logout user
  async logout(userId: string): Promise<void> {
    try {
      // Remove refresh token from Redis
      await this.removeStoredRefreshToken(userId);

      // Publish logout event
      await this.publishUserEvent(EVENT_TYPES.USER.LOGOUT, { id: userId });

      logger.info("User logged out successfully", { userId });
    } catch (error) {
      logger.error("Failed to logout user", { userId, error: error.message });
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.userService.getUserByEmail(email);

      // Generate reset token
      const resetToken = generateResetPasswordToken(user.id, user.email);

      // Store reset token in Redis with expiration
      const resetKey = `password_reset:${user.id}`;
      await this.redisConnection.set(resetKey, resetToken, 3600); // 1 hour

      // Publish password reset event
      await this.publishUserEvent(EVENT_TYPES.USER.PASSWORD_CHANGED, {
        userId: user.id,
        email: user.email,
        resetToken,
      });

      logger.info("Password reset requested", {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      // Don't reveal if user exists or not
      logger.info("Password reset requested for email", { email });
    }
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verify token
      const decoded = verifyToken(token);

      // Check if reset token exists in Redis
      const resetKey = `password_reset:${decoded.userId}`;
      const storedToken = await this.redisConnection.get(resetKey);

      if (!storedToken || storedToken !== token) {
        throw new InvalidCredentialsError("Invalid or expired reset token");
      }

      // Change password
      await this.userService.changePassword(decoded.userId, "", newPassword);

      // Remove reset token from Redis
      await this.redisConnection.del(resetKey);

      // Publish password changed event
      await this.publishUserEvent(EVENT_TYPES.USER.PASSWORD_CHANGED, {
        userId: decoded.userId,
        email: decoded.email,
      });

      logger.info("Password reset successfully", { userId: decoded.userId });
    } catch (error) {
      logger.error("Failed to reset password", { error: error.message });
      throw error;
    }
  }

  // Request email verification
  async requestEmailVerification(userId: string): Promise<void> {
    try {
      const user = await this.userService.getUserById(userId);

      if (user.isEmailVerified) {
        throw new ValidationError("Email is already verified");
      }

      // Generate verification token
      const verificationToken = generateEmailVerificationToken(
        user.id,
        user.email
      );

      // Store verification token in Redis
      const verificationKey = `email_verification:${user.id}`;
      await this.redisConnection.set(verificationKey, verificationToken, 86400); // 24 hours

      // Publish email verification event
      await this.publishUserEvent(EVENT_TYPES.USER.EMAIL_VERIFIED, {
        userId: user.id,
        email: user.email,
        verificationToken,
      });

      logger.info("Email verification requested", {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      logger.error("Failed to request email verification", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  // Verify email with token
  async verifyEmail(token: string): Promise<User> {
    try {
      // Verify token
      const decoded = verifyToken(token);

      // Check if verification token exists in Redis
      const verificationKey = `email_verification:${decoded.userId}`;
      const storedToken = await this.redisConnection.get(verificationKey);

      if (!storedToken || storedToken !== token) {
        throw new InvalidCredentialsError(
          "Invalid or expired verification token"
        );
      }

      // Verify email
      const user = await this.userService.verifyEmail(decoded.userId);

      // Remove verification token from Redis
      await this.redisConnection.del(verificationKey);

      // Publish email verified event
      await this.publishUserEvent(EVENT_TYPES.USER.EMAIL_VERIFIED, user);

      logger.info("Email verified successfully", { userId: user.id });

      return user;
    } catch (error) {
      logger.error("Failed to verify email", { error: error.message });
      throw error;
    }
  }

  // Validate token
  async validateToken(token: string): Promise<User> {
    try {
      const decoded = verifyToken(token);
      const user = await this.userService.getUserById(decoded.userId);

      if (!user.isActive) {
        throw new InvalidCredentialsError("Account is deactivated");
      }

      return user;
    } catch (error) {
      logger.error("Failed to validate token", { error: error.message });
      throw error;
    }
  }

  // Get user session
  async getUserSession(userId: string): Promise<{
    user: User;
    sessionId: string;
    lastActivity: Date;
  }> {
    try {
      const user = await this.userService.getUserById(userId);
      const sessionKey = CACHE_KEYS.USER.SESSION(userId);
      const sessionData = await this.redisConnection.get(sessionKey);

      if (!sessionData) {
        throw new NotFoundError("Session not found");
      }

      const session = JSON.parse(sessionData);

      return {
        user,
        sessionId: session.sessionId,
        lastActivity: new Date(session.lastActivity),
      };
    } catch (error) {
      logger.error("Failed to get user session", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  // Revoke all sessions for user
  async revokeAllSessions(userId: string): Promise<void> {
    try {
      const sessionKey = CACHE_KEYS.USER.SESSION(userId);
      await this.redisConnection.del(sessionKey);

      // Remove all refresh tokens
      await this.removeStoredRefreshToken(userId);

      logger.info("All sessions revoked for user", { userId });
    } catch (error) {
      logger.error("Failed to revoke sessions", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  // Redis operations for refresh tokens
  private async storeRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    try {
      const key = `refresh_token:${userId}`;
      await this.redisConnection.set(
        key,
        refreshToken,
        DATABASE_CONFIG.REDIS.TTL.LONG
      );
    } catch (error) {
      logger.error("Failed to store refresh token", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  private async getStoredRefreshToken(userId: string): Promise<string | null> {
    try {
      const key = `refresh_token:${userId}`;
      return await this.redisConnection.get(key);
    } catch (error) {
      logger.error("Failed to get stored refresh token", {
        userId,
        error: error.message,
      });
      return null;
    }
  }

  private async removeStoredRefreshToken(userId: string): Promise<void> {
    try {
      const key = `refresh_token:${userId}`;
      await this.redisConnection.del(key);
    } catch (error) {
      logger.error("Failed to remove stored refresh token", {
        userId,
        error: error.message,
      });
    }
  }

  // RabbitMQ event publishing
  private async publishUserEvent(eventType: string, data: any): Promise<void> {
    try {
      const event = {
        type: eventType,
        data,
        timestamp: new Date(),
        source: "user-service",
        correlationId: data.id || data.userId || "unknown",
        version: "1.0.0",
      };

      await this.rabbitMQConnection.publish({
        exchange: "user-events",
        routingKey: eventType,
        content: event,
      });

      logger.debug("User event published", {
        eventType,
        correlationId: event.correlationId,
      });
    } catch (error) {
      logger.error("Failed to publish user event", {
        eventType,
        error: error.message,
      });
      // Don't throw error for event publishing failures
    }
  }

  // Additional methods for AuthController

  /**
   * Get current user profile
   */
  async getCurrentUser(userId: string): Promise<User> {
    return this.userService.getUserById(userId);
  }

  /**
   * Update current user profile
   */
  async updateCurrentUser(userId: string, updateData: any): Promise<User> {
    return this.userService.updateUserProfile(userId, updateData);
  }

  /**
   * Delete current user account
   */
  async deleteCurrentUser(userId: string, password: string): Promise<void> {
    // Verify password before deletion
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isValidPassword = await this.userService.verifyPassword(
      userId,
      password
    );
    if (!isValidPassword) {
      throw new InvalidCredentialsError("Invalid password");
    }

    await this.userService.deleteUser(userId);

    // Revoke all sessions
    await this.revokeAllSessions(userId);

    // Publish user deleted event
    await this.publishUserEvent(EVENT_TYPES.USER.DELETED, { userId });
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await this.userService.changePassword(userId, currentPassword, newPassword);

    // Revoke all sessions except current one
    await this.revokeAllSessions(userId);

    // Publish password changed event
    await this.publishUserEvent(EVENT_TYPES.USER.PASSWORD_CHANGED, { userId });
  }
}

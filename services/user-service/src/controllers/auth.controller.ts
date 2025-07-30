import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";
import { UserRepository } from "../models/user.repository";
import { createLogger } from "../../../shared/common/utils/logger";
import { ErrorHandler } from "../../../shared/common/errors";
import {
  User,
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  EmailVerificationRequest,
  ApiResponse,
  AuthTokens,
  UserSession,
} from "../../../shared/common/types";

const logger = createLogger("AuthController");

export class AuthController {
  private authService: AuthService;

  constructor() {
    const userRepository = new UserRepository();
    const userService = new UserService(userRepository);
    this.authService = new AuthService(userService);
  }

  /**
   * Register a new user
   */
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const registerData: RegisterRequest = req.body;
      logger.info("User registration attempt", { email: registerData.email });

      const result = await this.authService.register(registerData);

      const response: ApiResponse<{
        user: User;
        tokens: AuthTokens;
      }> = {
        success: true,
        data: result,
        message:
          "User registered successfully. Please check your email for verification.",
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;
      logger.info("User login attempt", { email: loginData.email });

      const result = await this.authService.login(loginData);

      const response: ApiResponse<{
        user: User;
        tokens: AuthTokens;
      }> = {
        success: true,
        data: result,
        message: "Login successful",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;
      logger.info("Token refresh attempt");

      const tokens = await this.authService.refreshToken(refreshToken);

      const response: ApiResponse<AuthTokens> = {
        success: true,
        data: tokens,
        message: "Token refreshed successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const userId = (req as any).user?.id;

      logger.info("User logout attempt", { userId });

      await this.authService.logout(refreshToken);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: "Logout successful",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;
      logger.info("Password reset request", { email });

      await this.authService.requestPasswordReset(email);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: "Password reset email sent. Please check your email.",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const resetData: PasswordResetRequest = req.body;
      logger.info("Password reset attempt", { email: resetData.email });

      await this.authService.resetPassword(resetData);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: "Password reset successful",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request email verification
   */
  async requestEmailVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;
      logger.info("Email verification request", { email });

      await this.authService.requestEmailVerification(email);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: "Email verification sent. Please check your email.",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const verificationData: EmailVerificationRequest = req.body;
      logger.info("Email verification attempt", {
        email: verificationData.email,
      });

      await this.authService.verifyEmail(verificationData);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: "Email verified successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate token
   */
  async validateToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token } = req.body;
      logger.info("Token validation attempt");

      const payload = await this.authService.validateToken(token);

      const response: ApiResponse<{
        valid: boolean;
        payload?: any;
      }> = {
        success: true,
        data: {
          valid: true,
          payload,
        },
        message: "Token is valid",
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<{
        valid: boolean;
        payload?: any;
      }> = {
        success: true,
        data: {
          valid: false,
        },
        message: "Token is invalid",
      };

      res.status(200).json(response);
    }
  }

  /**
   * Get user session
   */
  async getUserSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      logger.info("Getting user session", { userId });

      const session = await this.authService.getUserSession(userId);

      const response: ApiResponse<UserSession> = {
        success: true,
        data: session,
        message: "User session retrieved successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllSessions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      logger.info("Revoking all sessions", { userId });

      await this.authService.revokeAllSessions(userId);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: "All sessions revoked successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password (authenticated)
   */
  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { currentPassword, newPassword } = req.body;
      logger.info("Password change attempt", { userId });

      await this.authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: "Password changed successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      logger.info("Getting current user profile", { userId });

      const user = await this.authService.getCurrentUser(userId);

      const response: ApiResponse<User> = {
        success: true,
        data: user,
        message: "Current user profile retrieved successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   */
  async updateCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const updateData = req.body;
      logger.info("Updating current user profile", { userId });

      const user = await this.authService.updateCurrentUser(userId, updateData);

      const response: ApiResponse<User> = {
        success: true,
        data: user,
        message: "Current user profile updated successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete current user account
   */
  async deleteCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { password } = req.body;
      logger.info("Deleting current user account", { userId });

      await this.authService.deleteCurrentUser(userId, password);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: "Account deleted successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check for auth service
   */
  async healthCheck(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info("Auth service health check");

      const response: ApiResponse<{
        status: string;
        timestamp: string;
        service: string;
      }> = {
        success: true,
        data: {
          status: "healthy",
          timestamp: new Date().toISOString(),
          service: "auth-service",
        },
        message: "Auth service is healthy",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

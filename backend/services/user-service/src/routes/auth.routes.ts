import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import {
  authenticateToken,
  optionalAuth,
} from "../../../shared/middleware/auth/jwt";
import { validate, authSchemas } from "../../../shared/middleware/validation";
import {
  loginRateLimiter,
  registrationRateLimiter,
  standardRateLimiter,
} from "../../../shared/middleware/rate-limiting";
import { createLogger } from "../../../shared/common/utils/logger";

const logger = createLogger("AuthRoutes");
const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: User already exists
 */
router.post(
  "/register",
  registrationRateLimiter,
  validate(authSchemas.register),
  authController.register.bind(authController)
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  loginRateLimiter,
  validate(authSchemas.login),
  authController.login.bind(authController)
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post(
  "/refresh",
  standardRateLimiter,
  validate(authSchemas.refreshToken),
  authController.refreshToken.bind(authController)
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post(
  "/logout",
  authenticateToken,
  validate(authSchemas.logout),
  authController.logout.bind(authController)
);

/**
 * @swagger
 * /api/auth/request-password-reset:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post(
  "/request-password-reset",
  standardRateLimiter,
  validate(authSchemas.requestPasswordReset),
  authController.requestPasswordReset.bind(authController)
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Bad request
 */
router.post(
  "/reset-password",
  standardRateLimiter,
  validate(authSchemas.resetPassword),
  authController.resetPassword.bind(authController)
);

/**
 * @swagger
 * /api/auth/request-email-verification:
 *   post:
 *     summary: Request email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verification sent
 */
router.post(
  "/request-email-verification",
  standardRateLimiter,
  validate(authSchemas.requestEmailVerification),
  authController.requestEmailVerification.bind(authController)
);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailVerificationRequest'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Bad request
 */
router.post(
  "/verify-email",
  standardRateLimiter,
  validate(authSchemas.verifyEmail),
  authController.verifyEmail.bind(authController)
);

/**
 * @swagger
 * /api/auth/validate-token:
 *   post:
 *     summary: Validate token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token validation result
 */
router.post(
  "/validate-token",
  standardRateLimiter,
  validate(authSchemas.validateToken),
  authController.validateToken.bind(authController)
);

/**
 * @swagger
 * /api/auth/session:
 *   get:
 *     summary: Get user session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User session retrieved successfully
 */
router.get(
  "/session",
  authenticateToken,
  authController.getUserSession.bind(authController)
);

/**
 * @swagger
 * /api/auth/revoke-all-sessions:
 *   post:
 *     summary: Revoke all sessions for a user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked successfully
 */
router.post(
  "/revoke-all-sessions",
  authenticateToken,
  authController.revokeAllSessions.bind(authController)
);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change password (authenticated)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/change-password",
  authenticateToken,
  validate(authSchemas.changePassword),
  authController.changePassword.bind(authController)
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile retrieved successfully
 */
router.get(
  "/me",
  authenticateToken,
  authController.getCurrentUser.bind(authController)
);

/**
 * @swagger
 * /api/auth/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Current user profile updated successfully
 */
router.put(
  "/me",
  authenticateToken,
  validate(authSchemas.updateCurrentUser),
  authController.updateCurrentUser.bind(authController)
);

/**
 * @swagger
 * /api/auth/me:
 *   delete:
 *     summary: Delete current user account
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete(
  "/me",
  authenticateToken,
  validate(authSchemas.deleteCurrentUser),
  authController.deleteCurrentUser.bind(authController)
);

/**
 * @swagger
 * /api/auth/health:
 *   get:
 *     summary: Health check for auth service
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Auth service is healthy
 */
router.get("/health", authController.healthCheck.bind(authController));

export default router;

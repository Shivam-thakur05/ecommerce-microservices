import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import {
  authenticateToken,
  requireRole,
  requireAdmin,
} from "../../../shared/middleware/auth/jwt";
import { validate, userSchemas } from "../../../shared/middleware/validation";
import { standardRateLimiter } from "../../../shared/middleware/rate-limiting";
import { createLogger } from "../../../shared/common/utils/logger";

const logger = createLogger("UserRoutes");
const router = Router();
const userController = new UserController();

// Apply rate limiting to all user routes
router.use(standardRateLimiter);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: User already exists
 */
router.post(
  "/",
  validate(userSchemas.createUser),
  userController.createUser.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get(
  "/:id",
  authenticateToken,
  requireRole(["user", "admin"]),
  userController.getUserById.bind(userController)
);

/**
 * @swagger
 * /api/users/email/{email}:
 *   get:
 *     summary: Get user by email
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get(
  "/email/:email",
  authenticateToken,
  requireAdmin,
  userController.getUserByEmail.bind(userController)
);

/**
 * @swagger
 * /api/users/username/{username}:
 *   get:
 *     summary: Get user by username
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get(
  "/username/:username",
  authenticateToken,
  requireRole(["user", "admin"]),
  userController.getUserByUsername.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 */
router.put(
  "/:id",
  authenticateToken,
  requireRole(["user", "admin"]),
  validate(userSchemas.updateUser),
  userController.updateUserProfile.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}/password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/:id/password",
  authenticateToken,
  requireRole(["user", "admin"]),
  validate(userSchemas.changePassword),
  userController.changePassword.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}/verify-email:
 *   post:
 *     summary: Verify user email
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verificationToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Bad request
 */
router.post(
  "/:id/verify-email",
  validate(userSchemas.verifyEmail),
  userController.verifyEmail.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}/verify-phone:
 *   post:
 *     summary: Verify user phone
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verificationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone verified successfully
 *       400:
 *         description: Bad request
 */
router.post(
  "/:id/verify-phone",
  validate(userSchemas.verifyPhone),
  userController.verifyPhone.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}/preferences:
 *   put:
 *     summary: Update user preferences
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreferences'
 *     responses:
 *       200:
 *         description: User preferences updated successfully
 *       400:
 *         description: Bad request
 */
router.put(
  "/:id/preferences",
  authenticateToken,
  requireRole(["user", "admin"]),
  validate(userSchemas.updatePreferences),
  userController.updateUserPreferences.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (soft delete)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  userController.deleteUser.bind(userController)
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get users with pagination and filters
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin, moderator]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get(
  "/",
  authenticateToken,
  requireAdmin,
  validate(userSchemas.getUsers),
  userController.getUsers.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}/addresses:
 *   post:
 *     summary: Add user address
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Address added successfully
 *       400:
 *         description: Bad request
 */
router.post(
  "/:id/addresses",
  authenticateToken,
  requireRole(["user", "admin"]),
  validate(userSchemas.addAddress),
  userController.addUserAddress.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}/addresses:
 *   get:
 *     summary: Get user addresses
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User addresses retrieved successfully
 */
router.get(
  "/:id/addresses",
  authenticateToken,
  requireRole(["user", "admin"]),
  userController.getUserAddresses.bind(userController)
);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Users search completed successfully
 */
router.get(
  "/search",
  authenticateToken,
  requireAdmin,
  validate(userSchemas.searchUsers),
  userController.searchUsers.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}/statistics:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 */
router.get(
  "/:id/statistics",
  authenticateToken,
  requireAdmin,
  userController.getUserStatistics.bind(userController)
);

/**
 * @swagger
 * /api/users/bulk-update:
 *   put:
 *     summary: Bulk update users
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               updates:
 *                 type: object
 *     responses:
 *       200:
 *         description: Bulk update completed
 */
router.put(
  "/bulk-update",
  authenticateToken,
  requireAdmin,
  validate(userSchemas.bulkUpdateUsers),
  userController.bulkUpdateUsers.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}/export:
 *   get:
 *     summary: Export user data
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: User data exported successfully
 */
router.get(
  "/:id/export",
  authenticateToken,
  requireAdmin,
  userController.exportUserData.bind(userController)
);

export default router;

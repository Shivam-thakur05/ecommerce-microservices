import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { UserRepository } from "../models/user.repository";
import { createLogger } from "../../../shared/common/utils/logger";
import { ErrorHandler } from "../../../shared/common/errors";
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserSearchFilters,
  PaginationParams,
  ApiResponse,
  UserStatistics,
} from "../../../shared/common/types";

const logger = createLogger("UserController");

export class UserController {
  private userService: UserService;

  constructor() {
    const userRepository = new UserRepository();
    this.userService = new UserService(userRepository);
  }

  /**
   * Create a new user
   */
  async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userData: CreateUserRequest = req.body;
      logger.info("Creating new user", { email: userData.email });

      const user = await this.userService.createUser(userData);

      const response: ApiResponse<User> = {
        success: true,
        data: user,
        message: "User created successfully",
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      logger.info("Getting user by ID", { userId: id });

      const user = await this.userService.getUserById(id);

      if (!user) {
        throw new ErrorHandler.NotFoundError("User not found");
      }

      const response: ApiResponse<User> = {
        success: true,
        data: user,
        message: "User retrieved successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.params;
      logger.info("Getting user by email", { email });

      const user = await this.userService.getUserByEmail(email);

      if (!user) {
        throw new ErrorHandler.NotFoundError("User not found");
      }

      const response: ApiResponse<User> = {
        success: true,
        data: user,
        message: "User retrieved successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { username } = req.params;
      logger.info("Getting user by username", { username });

      const user = await this.userService.getUserByUsername(username);

      if (!user) {
        throw new ErrorHandler.NotFoundError("User not found");
      }

      const response: ApiResponse<User> = {
        success: true,
        data: user,
        message: "User retrieved successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateUserRequest = req.body;
      logger.info("Updating user profile", { userId: id });

      const user = await this.userService.updateUserProfile(id, updateData);

      const response: ApiResponse<User> = {
        success: true,
        data: user,
        message: "User profile updated successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      logger.info("Changing user password", { userId: id });

      await this.userService.changePassword(id, currentPassword, newPassword);

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
   * Verify user email
   */
  async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { verificationToken } = req.body;
      logger.info("Verifying user email", { userId: id });

      await this.userService.verifyEmail(id, verificationToken);

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
   * Verify user phone
   */
  async verifyPhone(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { verificationCode } = req.body;
      logger.info("Verifying user phone", { userId: id });

      await this.userService.verifyPhone(id, verificationCode);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: "Phone verified successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const preferences = req.body;
      logger.info("Updating user preferences", { userId: id });

      const user = await this.userService.updateUserPreferences(
        id,
        preferences
      );

      const response: ApiResponse<User> = {
        success: true,
        data: user,
        message: "User preferences updated successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      logger.info("Deleting user", { userId: id });

      await this.userService.deleteUser(id);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: "User deleted successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get users with pagination and filters
   */
  async getUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;
      const filters: UserSearchFilters = req.query;

      const pagination: PaginationParams = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
      };

      logger.info("Getting users with filters", { pagination, filters });

      const result = await this.userService.getUsers(pagination, filters);

      const response: ApiResponse<{
        users: User[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }> = {
        success: true,
        data: {
          users: result.users,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / pagination.limit),
          },
        },
        message: "Users retrieved successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add user address
   */
  async addUserAddress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const address = req.body;
      logger.info("Adding user address", { userId: id });

      const user = await this.userService.addUserAddress(id, address);

      const response: ApiResponse<User> = {
        success: true,
        data: user,
        message: "Address added successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user addresses
   */
  async getUserAddresses(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      logger.info("Getting user addresses", { userId: id });

      const addresses = await this.userService.getUserAddresses(id);

      const response: ApiResponse<typeof addresses> = {
        success: true,
        data: addresses,
        message: "User addresses retrieved successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search users
   */
  async searchUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { query, page = 1, limit = 10 } = req.query;

      const pagination: PaginationParams = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      logger.info("Searching users", { query, pagination });

      const result = await this.userService.searchUsers(
        query as string,
        pagination
      );

      const response: ApiResponse<{
        users: User[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }> = {
        success: true,
        data: {
          users: result.users,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / pagination.limit),
          },
        },
        message: "Users search completed successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      logger.info("Getting user statistics", { userId: id });

      const statistics = await this.userService.getUserStatistics(id);

      const response: ApiResponse<UserStatistics> = {
        success: true,
        data: statistics,
        message: "User statistics retrieved successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userIds, updates } = req.body;
      logger.info("Bulk updating users", { userIds: userIds.length });

      const result = await this.userService.bulkUpdateUsers(userIds, updates);

      const response: ApiResponse<{
        updated: number;
        failed: number;
        errors: string[];
      }> = {
        success: true,
        data: result,
        message: "Bulk update completed",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export user data
   */
  async exportUserData(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { format = "json" } = req.query;
      logger.info("Exporting user data", { userId: id, format });

      const data = await this.userService.exportUserData(id);

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="user-${id}.csv"`
        );
        res.status(200).send(data);
      } else {
        const response: ApiResponse<any> = {
          success: true,
          data,
          message: "User data exported successfully",
        };
        res.status(200).json(response);
      }
    } catch (error) {
      next(error);
    }
  }
}

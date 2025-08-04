import { v4 as uuidv4 } from "uuid";
import createLogger from "../../../../shared/common/utils/logger";
import { UserRepository } from "../models/user.repository";
import {
  User,
  UserRole,
  UserPreferences,
  Address,
} from "../../../../shared/common/types";
import {
  NotFoundError,
  UserAlreadyExistsError,
  InvalidCredentialsError,
  ValidationError,
} from "../../../../shared/common/errors";
import { EVENT_TYPES } from "../../../../shared/common/constants";

const logger = createLogger("user-service");

export class UserService {
  constructor(private userRepository: UserRepository) {}

  // Create new user
  async createUser(userData: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    role?: UserRole;
  }): Promise<User> {
    try {
      // Check if user already exists
      const existingUserByEmail = await this.userRepository.getUserByEmail(
        userData.email
      );
      if (existingUserByEmail) {
        throw new UserAlreadyExistsError(userData.email);
      }

      const existingUserByUsername =
        await this.userRepository.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        throw new UserAlreadyExistsError(
          `Username ${userData.username} already exists`
        );
      }

      // Create user with default values
      const newUser = await this.userRepository.createUser({
        email: userData.email,
        username: userData.username,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        dateOfBirth: userData.dateOfBirth,
        isActive: true,
        isEmailVerified: false,
        isPhoneVerified: false,
        role: userData.role || UserRole.USER,
        preferences: {
          language: "en",
          currency: "USD",
          timezone: "UTC",
          marketingEmails: false,
          pushNotifications: false,
          smsNotifications: false,
        },
        addresses: [],
        avatar: undefined,
        lastLoginAt: undefined,
      } as any);

      logger.info("User created successfully", {
        userId: newUser.id,
        email: newUser.email,
      });

      return newUser;
    } catch (error) {
      logger.error("Failed to create user", { error: error.message });
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    try {
      const user = await this.userRepository.getUserById(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      return user;
    } catch (error) {
      logger.error("Failed to get user by ID", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User> {
    try {
      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      return user;
    } catch (error) {
      logger.error("Failed to get user by email", {
        email,
        error: error.message,
      });
      throw error;
    }
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<User> {
    try {
      const user = await this.userRepository.getUserByUsername(username);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      return user;
    } catch (error) {
      logger.error("Failed to get user by username", {
        username,
        error: error.message,
      });
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      dateOfBirth?: Date;
      avatar?: string;
      preferences?: Partial<UserPreferences>;
    }
  ): Promise<User> {
    try {
      const user = await this.getUserById(userId);

      // Validate phone number if provided
      if (
        updateData.phoneNumber &&
        !this.isValidPhoneNumber(updateData.phoneNumber)
      ) {
        throw new ValidationError("Invalid phone number format");
      }

      // Validate date of birth if provided
      if (
        updateData.dateOfBirth &&
        !this.isValidDateOfBirth(updateData.dateOfBirth)
      ) {
        throw new ValidationError("Invalid date of birth");
      }

      const updatedUser = await this.userRepository.updateUser(
        userId,
        updateData as any
      );

      logger.info("User profile updated successfully", { userId });

      return updatedUser;
    } catch (error) {
      logger.error("Failed to update user profile", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  // Change password
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Verify current password
      const isCurrentPasswordValid = await this.userRepository.verifyPassword(
        userId,
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        throw new InvalidCredentialsError("Current password is incorrect");
      }

      // Validate new password
      if (!this.isValidPassword(newPassword)) {
        throw new ValidationError("Password does not meet requirements");
      }

      await this.userRepository.changePassword(userId, newPassword);

      logger.info("Password changed successfully", { userId });
    } catch (error) {
      logger.error("Failed to change password", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  // Verify email
  async verifyEmail(userId: string): Promise<User> {
    try {
      const user = await this.getUserById(userId);

      if (user.isEmailVerified) {
        return user;
      }

      const updatedUser = await this.userRepository.updateUser(userId, {
        isEmailVerified: true,
      });

      logger.info("Email verified successfully", { userId });

      return updatedUser;
    } catch (error) {
      logger.error("Failed to verify email", { userId, error: error.message });
      throw error;
    }
  }

  // Verify phone
  async verifyPhone(userId: string): Promise<User> {
    try {
      const user = await this.getUserById(userId);

      if (user.isPhoneVerified) {
        return user;
      }

      const updatedUser = await this.userRepository.updateUser(userId, {
        isPhoneVerified: true,
      });

      logger.info("Phone verified successfully", { userId });

      return updatedUser;
    } catch (error) {
      logger.error("Failed to verify phone", { userId, error: error.message });
      throw error;
    }
  }

  // Update user preferences
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<User> {
    try {
      const user = await this.getUserById(userId);

      const updatedPreferences = {
        ...user.preferences,
        ...preferences,
      };

      const updatedUser = await this.userRepository.updateUser(userId, {
        preferences: updatedPreferences,
      });

      logger.info("User preferences updated successfully", { userId });

      return updatedUser;
    } catch (error) {
      logger.error("Failed to update user preferences", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  // Delete user (soft delete)
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.getUserById(userId); // Verify user exists
      await this.userRepository.deleteUser(userId);

      logger.info("User deleted successfully", { userId });
    } catch (error) {
      logger.error("Failed to delete user", { userId, error: error.message });
      throw error;
    }
  }

  // Get users with pagination and filters
  async getUsers(
    page: number = 1,
    limit: number = 20,
    filters: {
      role?: UserRole;
      search?: string;
      isActive?: boolean;
      isEmailVerified?: boolean;
    } = {}
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      return await this.userRepository.getUsers(page, limit, filters);
    } catch (error) {
      logger.error("Failed to get users", { error: error.message });
      throw error;
    }
  }

  // Add user address
  async addUserAddress(
    userId: string,
    addressData: {
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
  ): Promise<Address> {
    try {
      await this.getUserById(userId); // Verify user exists

      const address = await this.userRepository.addAddress(userId, addressData);

      logger.info("Address added successfully", {
        userId,
        addressId: address.id,
      });

      return address;
    } catch (error) {
      logger.error("Failed to add user address", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  // Get user addresses
  async getUserAddresses(userId: string): Promise<Address[]> {
    try {
      await this.getUserById(userId); // Verify user exists
      return await this.userRepository.getUserAddresses(userId);
    } catch (error) {
      logger.error("Failed to get user addresses", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  // Update last login
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.userRepository.updateUser(userId, {
        lastLoginAt: new Date(),
      });

      logger.debug("Last login updated", { userId });
    } catch (error) {
      logger.error("Failed to update last login", {
        userId,
        error: error.message,
      });
      // Don't throw error for this operation as it's not critical
    }
  }

  // Verify password
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      return await this.userRepository.verifyPassword(userId, password);
    } catch (error) {
      logger.error("Failed to verify password", {
        userId,
        error: error.message,
      });
      return false;
    }
  }

  // Search users
  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      return await this.userRepository.getUsers(page, limit, { search: query });
    } catch (error) {
      logger.error("Failed to search users", { query, error: error.message });
      throw error;
    }
  }

  // Get user statistics
  async getUserStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    usersByRole: Record<UserRole, number>;
  }> {
    try {
      const allUsers = await this.userRepository.getUsers(1, 1000);

      const statistics = {
        totalUsers: allUsers.total,
        activeUsers: allUsers.users.filter((u) => u.isActive).length,
        verifiedUsers: allUsers.users.filter((u) => u.isEmailVerified).length,
        usersByRole: {} as Record<UserRole, number>,
      };

      // Count users by role
      Object.values(UserRole).forEach((role) => {
        statistics.usersByRole[role] = allUsers.users.filter(
          (u) => u.role === role
        ).length;
      });

      return statistics;
    } catch (error) {
      logger.error("Failed to get user statistics", { error: error.message });
      throw error;
    }
  }

  // Validation methods
  private isValidPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  private isValidDateOfBirth(dateOfBirth: Date): boolean {
    const now = new Date();
    const age = now.getFullYear() - dateOfBirth.getFullYear();
    return age >= 13 && age <= 120;
  }

  private isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // Bulk operations
  async bulkUpdateUsers(
    userIds: string[],
    updateData: Partial<User>
  ): Promise<User[]> {
    try {
      const updatedUsers: User[] = [];

      for (const userId of userIds) {
        try {
          const updatedUser = await this.userRepository.updateUser(
            userId,
            updateData
          );
          updatedUsers.push(updatedUser);
        } catch (error) {
          logger.warn("Failed to update user in bulk operation", {
            userId,
            error: error.message,
          });
        }
      }

      logger.info("Bulk update completed", {
        totalRequested: userIds.length,
        successful: updatedUsers.length,
      });

      return updatedUsers;
    } catch (error) {
      logger.error("Failed to bulk update users", { error: error.message });
      throw error;
    }
  }

  // Export user data
  async exportUserData(userId: string): Promise<{
    user: User;
    addresses: Address[];
    exportDate: Date;
  }> {
    try {
      const user = await this.getUserById(userId);
      const addresses = await this.getUserAddresses(userId);

      return {
        user,
        addresses,
        exportDate: new Date(),
      };
    } catch (error) {
      logger.error("Failed to export user data", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }
}

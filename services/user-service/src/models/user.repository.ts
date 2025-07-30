import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import createLogger from "../../../../shared/common/utils/logger";
import { getDefaultConnection } from "../../../../shared/database/postgres/connection";
import { getDefaultConnection as getRedisConnection } from "../../../../shared/database/redis/connection";
import {
  User,
  UserRole,
  UserPreferences,
  Address,
} from "../../../../shared/common/types";
import {
  NotFoundError,
  UserAlreadyExistsError,
  DatabaseQueryError,
  ValidationError,
} from "../../../../shared/common/errors";
import {
  CACHE_KEYS,
  DATABASE_CONFIG,
} from "../../../../shared/common/constants";

const logger = createLogger("user-repository");

export class UserRepository {
  private redisConnection = getRedisConnection();
  private postgresConnection = getDefaultConnection();

  // Create user
  async createUser(
    userData: Omit<User, "id" | "createdAt" | "updatedAt">
  ): Promise<User> {
    try {
      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const query = `
        INSERT INTO users (
          id, email, username, password_hash, first_name, last_name, 
          phone_number, date_of_birth, is_active, is_email_verified, 
          is_phone_verified, role, preferences, avatar, last_login_at, 
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;

      const preferences = userData.preferences || {
        language: "en",
        currency: "USD",
        timezone: "UTC",
        marketingEmails: false,
        pushNotifications: false,
        smsNotifications: false,
      };

      const values = [
        userId,
        userData.email,
        userData.username,
        hashedPassword,
        userData.firstName,
        userData.lastName,
        userData.phoneNumber,
        userData.dateOfBirth,
        userData.isActive,
        userData.isEmailVerified,
        userData.isPhoneVerified,
        userData.role,
        JSON.stringify(preferences),
        userData.avatar,
        userData.lastLoginAt,
        new Date(),
        new Date(),
      ];

      const result = await this.postgresConnection.queryOne(query, values);

      if (!result) {
        throw new DatabaseQueryError("Failed to create user");
      }

      const user = this.mapDatabaseUserToUser(result);

      // Cache user data
      await this.cacheUser(user);

      logger.info("User created successfully", {
        userId: user.id,
        email: user.email,
      });

      return user;
    } catch (error: any) {
      if (error.code === "23505") {
        // PostgreSQL unique constraint violation
        throw new UserAlreadyExistsError(userData.email);
      }
      logger.error("Failed to create user", { error: error.message });
      throw new DatabaseQueryError(`Failed to create user: ${error.message}`);
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      // Try to get from cache first
      const cachedUser = await this.getCachedUser(userId);
      if (cachedUser) {
        return cachedUser;
      }

      const query = "SELECT * FROM users WHERE id = $1 AND is_active = true";
      const result = await this.postgresConnection.queryOne(query, [userId]);

      if (!result) {
        return null;
      }

      const user = this.mapDatabaseUserToUser(result);

      // Cache user data
      await this.cacheUser(user);

      return user;
    } catch (error) {
      logger.error("Failed to get user by ID", {
        userId,
        error: error.message,
      });
      throw new DatabaseQueryError(`Failed to get user: ${error.message}`);
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const query = "SELECT * FROM users WHERE email = $1 AND is_active = true";
      const result = await this.postgresConnection.queryOne(query, [email]);

      if (!result) {
        return null;
      }

      return this.mapDatabaseUserToUser(result);
    } catch (error) {
      logger.error("Failed to get user by email", {
        email,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `Failed to get user by email: ${error.message}`
      );
    }
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const query =
        "SELECT * FROM users WHERE username = $1 AND is_active = true";
      const result = await this.postgresConnection.queryOne(query, [username]);

      if (!result) {
        return null;
      }

      return this.mapDatabaseUserToUser(result);
    } catch (error) {
      logger.error("Failed to get user by username", {
        username,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `Failed to get user by username: ${error.message}`
      );
    }
  }

  // Update user
  async updateUser(userId: string, updateData: Partial<User>): Promise<User> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build dynamic update query
      if (updateData.email !== undefined) {
        updateFields.push(`email = $${paramIndex++}`);
        values.push(updateData.email);
      }
      if (updateData.username !== undefined) {
        updateFields.push(`username = $${paramIndex++}`);
        values.push(updateData.username);
      }
      if (updateData.firstName !== undefined) {
        updateFields.push(`first_name = $${paramIndex++}`);
        values.push(updateData.firstName);
      }
      if (updateData.lastName !== undefined) {
        updateFields.push(`last_name = $${paramIndex++}`);
        values.push(updateData.lastName);
      }
      if (updateData.phoneNumber !== undefined) {
        updateFields.push(`phone_number = $${paramIndex++}`);
        values.push(updateData.phoneNumber);
      }
      if (updateData.dateOfBirth !== undefined) {
        updateFields.push(`date_of_birth = $${paramIndex++}`);
        values.push(updateData.dateOfBirth);
      }
      if (updateData.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(updateData.isActive);
      }
      if (updateData.isEmailVerified !== undefined) {
        updateFields.push(`is_email_verified = $${paramIndex++}`);
        values.push(updateData.isEmailVerified);
      }
      if (updateData.isPhoneVerified !== undefined) {
        updateFields.push(`is_phone_verified = $${paramIndex++}`);
        values.push(updateData.isPhoneVerified);
      }
      if (updateData.role !== undefined) {
        updateFields.push(`role = $${paramIndex++}`);
        values.push(updateData.role);
      }
      if (updateData.preferences !== undefined) {
        updateFields.push(`preferences = $${paramIndex++}`);
        values.push(JSON.stringify(updateData.preferences));
      }
      if (updateData.avatar !== undefined) {
        updateFields.push(`avatar = $${paramIndex++}`);
        values.push(updateData.avatar);
      }
      if (updateData.lastLoginAt !== undefined) {
        updateFields.push(`last_login_at = $${paramIndex++}`);
        values.push(updateData.lastLoginAt);
      }

      if (updateFields.length === 0) {
        return user;
      }

      updateFields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());
      values.push(userId);

      const query = `
        UPDATE users 
        SET ${updateFields.join(", ")} 
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.postgresConnection.queryOne(query, values);

      if (!result) {
        throw new DatabaseQueryError("Failed to update user");
      }

      const updatedUser = this.mapDatabaseUserToUser(result);

      // Update cache
      await this.cacheUser(updatedUser);

      logger.info("User updated successfully", { userId: updatedUser.id });

      return updatedUser;
    } catch (error) {
      logger.error("Failed to update user", { userId, error: error.message });
      throw new DatabaseQueryError(`Failed to update user: ${error.message}`);
    }
  }

  // Delete user (soft delete)
  async deleteUser(userId: string): Promise<void> {
    try {
      const query =
        "UPDATE users SET is_active = false, updated_at = $1 WHERE id = $2";
      const result = await this.postgresConnection.query(query, [
        new Date(),
        userId,
      ]);

      if (result.length === 0) {
        throw new NotFoundError("User not found");
      }

      // Remove from cache
      await this.removeCachedUser(userId);

      logger.info("User deleted successfully", { userId });
    } catch (error) {
      logger.error("Failed to delete user", { userId, error: error.message });
      throw new DatabaseQueryError(`Failed to delete user: ${error.message}`);
    }
  }

  // Change password
  async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      const query =
        "UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3";
      const result = await this.postgresConnection.query(query, [
        hashedPassword,
        new Date(),
        userId,
      ]);

      if (result.length === 0) {
        throw new NotFoundError("User not found");
      }

      // Remove from cache to force refresh
      await this.removeCachedUser(userId);

      logger.info("Password changed successfully", { userId });
    } catch (error) {
      logger.error("Failed to change password", {
        userId,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `Failed to change password: ${error.message}`
      );
    }
  }

  // Verify password
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      const query = "SELECT password_hash FROM users WHERE id = $1";
      const result = await this.postgresConnection.queryOne(query, [userId]);

      if (!result) {
        return false;
      }

      return await bcrypt.compare(password, result.password_hash);
    } catch (error) {
      logger.error("Failed to verify password", {
        userId,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `Failed to verify password: ${error.message}`
      );
    }
  }

  // Get users with pagination
  async getUsers(
    page: number = 1,
    limit: number = 20,
    filters: any = {}
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      let whereClause = "WHERE is_active = true";
      const values: any[] = [];
      let paramIndex = 1;

      if (filters.role) {
        whereClause += ` AND role = $${paramIndex++}`;
        values.push(filters.role);
      }

      if (filters.search) {
        whereClause += ` AND (email ILIKE $${paramIndex} OR username ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex})`;
        values.push(`%${filters.search}%`);
        paramIndex++;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
      const countResult = await this.postgresConnection.queryOne(
        countQuery,
        values
      );
      const total = parseInt(countResult.count);

      // Get users
      const offset = (page - 1) * limit;
      const query = `
        SELECT * FROM users 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      values.push(limit, offset);

      const results = await this.postgresConnection.query(query, values);
      const users = results.map(this.mapDatabaseUserToUser);

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error("Failed to get users", { error: error.message });
      throw new DatabaseQueryError(`Failed to get users: ${error.message}`);
    }
  }

  // Add address
  async addAddress(
    userId: string,
    address: Omit<Address, "id" | "createdAt" | "updatedAt">
  ): Promise<Address> {
    try {
      const addressId = uuidv4();

      const query = `
        INSERT INTO user_addresses (
          id, user_id, type, first_name, last_name, company, street, 
          apartment, city, state, zip_code, country, phone_number, 
          is_default, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;

      const values = [
        addressId,
        userId,
        address.type,
        address.firstName,
        address.lastName,
        address.company,
        address.street,
        address.apartment,
        address.city,
        address.state,
        address.zipCode,
        address.country,
        address.phoneNumber,
        address.isDefault,
        new Date(),
        new Date(),
      ];

      const result = await this.postgresConnection.queryOne(query, values);

      if (!result) {
        throw new DatabaseQueryError("Failed to add address");
      }

      const newAddress = this.mapDatabaseAddressToAddress(result);

      // Remove from cache to force refresh
      await this.removeCachedUser(userId);

      logger.info("Address added successfully", { userId, addressId });

      return newAddress;
    } catch (error) {
      logger.error("Failed to add address", { userId, error: error.message });
      throw new DatabaseQueryError(`Failed to add address: ${error.message}`);
    }
  }

  // Get user addresses
  async getUserAddresses(userId: string): Promise<Address[]> {
    try {
      const query =
        "SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC";
      const results = await this.postgresConnection.query(query, [userId]);

      return results.map(this.mapDatabaseAddressToAddress);
    } catch (error) {
      logger.error("Failed to get user addresses", {
        userId,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `Failed to get user addresses: ${error.message}`
      );
    }
  }

  // Cache operations
  private async cacheUser(user: User): Promise<void> {
    try {
      const key = CACHE_KEYS.USER.PROFILE(user.id);
      await this.redisConnection.set(
        key,
        JSON.stringify(user),
        DATABASE_CONFIG.REDIS.TTL.MEDIUM
      );
    } catch (error) {
      logger.warn("Failed to cache user", {
        userId: user.id,
        error: error.message,
      });
    }
  }

  private async getCachedUser(userId: string): Promise<User | null> {
    try {
      const key = CACHE_KEYS.USER.PROFILE(userId);
      const cached = await this.redisConnection.get(key);

      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      logger.warn("Failed to get cached user", {
        userId,
        error: error.message,
      });
      return null;
    }
  }

  private async removeCachedUser(userId: string): Promise<void> {
    try {
      const key = CACHE_KEYS.USER.PROFILE(userId);
      await this.redisConnection.del(key);
    } catch (error) {
      logger.warn("Failed to remove cached user", {
        userId,
        error: error.message,
      });
    }
  }

  // Database mapping functions
  private mapDatabaseUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      phoneNumber: dbUser.phone_number,
      dateOfBirth: dbUser.date_of_birth,
      isActive: dbUser.is_active,
      isEmailVerified: dbUser.is_email_verified,
      isPhoneVerified: dbUser.is_phone_verified,
      role: dbUser.role as UserRole,
      preferences: dbUser.preferences ? JSON.parse(dbUser.preferences) : {},
      addresses: [], // Will be loaded separately if needed
      avatar: dbUser.avatar,
      lastLoginAt: dbUser.last_login_at,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };
  }

  private mapDatabaseAddressToAddress(dbAddress: any): Address {
    return {
      id: dbAddress.id,
      type: dbAddress.type,
      firstName: dbAddress.first_name,
      lastName: dbAddress.last_name,
      company: dbAddress.company,
      street: dbAddress.street,
      apartment: dbAddress.apartment,
      city: dbAddress.city,
      state: dbAddress.state,
      zipCode: dbAddress.zip_code,
      country: dbAddress.country,
      phoneNumber: dbAddress.phone_number,
      isDefault: dbAddress.is_default,
      createdAt: dbAddress.created_at,
      updatedAt: dbAddress.updated_at,
    };
  }
}

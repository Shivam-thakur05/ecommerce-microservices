import mongoose, {
  Connection,
  ConnectOptions,
  Model,
  Document,
} from "mongoose";
import createLogger from "../../common/utils/logger";
import {
  DatabaseConnectionError,
  DatabaseQueryError,
} from "../../common/errors";
import { DATABASE_CONFIG } from "../../common/constants";

const logger = createLogger("mongo-connection");

interface MongoConfig extends ConnectOptions {
  uri: string;
  dbName?: string;
  maxPoolSize?: number;
  minPoolSize?: number;
  maxIdleTimeMS?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
  connectTimeoutMS?: number;
}

class MongoConnection {
  private connection: Connection | null = null;
  private config: MongoConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000;

  constructor(config: MongoConfig) {
    this.config = {
      ...DATABASE_CONFIG.MONGODB,
      ...config,
      maxPoolSize: config.maxPoolSize || 10,
      minPoolSize: config.minPoolSize || 2,
      maxIdleTimeMS: config.maxIdleTimeMS || 30000,
      serverSelectionTimeoutMS: config.serverSelectionTimeoutMS || 5000,
      socketTimeoutMS: config.socketTimeoutMS || 45000,
      connectTimeoutMS: config.connectTimeoutMS || 10000,
    };
  }

  async connect(): Promise<void> {
    try {
      if (this.connection) {
        await this.disconnect();
      }

      // Set up mongoose event listeners
      mongoose.connection.on("connected", () => {
        logger.info("MongoDB connection established successfully");
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      mongoose.connection.on("error", (error) => {
        logger.error("MongoDB connection error", { error: error.message });
        this.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        logger.warn("MongoDB connection disconnected");
        this.isConnected = false;
      });

      mongoose.connection.on("reconnected", () => {
        logger.info("MongoDB connection reconnected");
        this.isConnected = true;
      });

      // Connect to MongoDB
      await mongoose.connect(this.config.uri, this.config);
      this.connection = mongoose.connection;

      logger.info("MongoDB connection established successfully", {
        uri: this.config.uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"), // Hide credentials in logs
        dbName: this.config.dbName,
      });
    } catch (error) {
      logger.error("Failed to connect to MongoDB", { error: error.message });
      throw new DatabaseConnectionError(
        `MongoDB connection failed: ${error.message}`
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      this.isConnected = false;
      logger.info("MongoDB connection closed");
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.connection) {
        return false;
      }

      // Ping the database
      await this.connection.db.admin().ping();
      return true;
    } catch (error) {
      logger.error("MongoDB health check failed", { error: error.message });
      return false;
    }
  }

  async getConnection(): Promise<Connection> {
    if (!this.connection || !this.isConnected) {
      await this.connect();
    }

    if (!this.connection) {
      throw new DatabaseConnectionError("MongoDB connection not available");
    }

    return this.connection;
  }

  async getDatabase() {
    const connection = await this.getConnection();
    return connection.db;
  }

  async createModel<T extends Document>(
    modelName: string,
    schema: mongoose.Schema
  ): Promise<Model<T>> {
    const connection = await this.getConnection();

    // Check if model already exists
    if (connection.models[modelName]) {
      return connection.models[modelName] as Model<T>;
    }

    return connection.model<T>(modelName, schema);
  }

  async getCollection(collectionName: string) {
    const db = await this.getDatabase();
    return db.collection(collectionName);
  }

  async transaction<T>(
    callback: (session: mongoose.ClientSession) => Promise<T>
  ): Promise<T> {
    const connection = await this.getConnection();
    const session = await connection.startSession();

    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await callback(session);
      });
      return result!;
    } finally {
      await session.endSession();
    }
  }

  async aggregate<T = any>(
    collectionName: string,
    pipeline: any[],
    options?: any
  ): Promise<T[]> {
    try {
      const collection = await this.getCollection(collectionName);
      const start = Date.now();

      const result = await collection.aggregate(pipeline, options).toArray();

      const duration = Date.now() - start;
      logger.debug("MongoDB aggregation executed", {
        collection: collectionName,
        pipeline,
        duration: `${duration}ms`,
        resultCount: result.length,
      });

      return result;
    } catch (error) {
      logger.error("MongoDB aggregation failed", {
        collection: collectionName,
        pipeline,
        error: error.message,
      });
      throw new DatabaseQueryError(`Aggregation failed: ${error.message}`);
    }
  }

  async find<T = any>(
    collectionName: string,
    filter: any = {},
    options?: any
  ): Promise<T[]> {
    try {
      const collection = await this.getCollection(collectionName);
      const start = Date.now();

      const result = await collection.find(filter, options).toArray();

      const duration = Date.now() - start;
      logger.debug("MongoDB find executed", {
        collection: collectionName,
        filter,
        duration: `${duration}ms`,
        resultCount: result.length,
      });

      return result;
    } catch (error) {
      logger.error("MongoDB find failed", {
        collection: collectionName,
        filter,
        error: error.message,
      });
      throw new DatabaseQueryError(`Find operation failed: ${error.message}`);
    }
  }

  async findOne<T = any>(
    collectionName: string,
    filter: any = {},
    options?: any
  ): Promise<T | null> {
    try {
      const collection = await this.getCollection(collectionName);
      const start = Date.now();

      const result = await collection.findOne(filter, options);

      const duration = Date.now() - start;
      logger.debug("MongoDB findOne executed", {
        collection: collectionName,
        filter,
        duration: `${duration}ms`,
        found: !!result,
      });

      return result;
    } catch (error) {
      logger.error("MongoDB findOne failed", {
        collection: collectionName,
        filter,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `FindOne operation failed: ${error.message}`
      );
    }
  }

  async insertOne<T = any>(
    collectionName: string,
    document: any
  ): Promise<{ insertedId: string; document: T }> {
    try {
      const collection = await this.getCollection(collectionName);
      const start = Date.now();

      const result = await collection.insertOne(document);

      const duration = Date.now() - start;
      logger.debug("MongoDB insertOne executed", {
        collection: collectionName,
        duration: `${duration}ms`,
        insertedId: result.insertedId,
      });

      return {
        insertedId: result.insertedId.toString(),
        document: { ...document, _id: result.insertedId },
      };
    } catch (error) {
      logger.error("MongoDB insertOne failed", {
        collection: collectionName,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `InsertOne operation failed: ${error.message}`
      );
    }
  }

  async updateOne(
    collectionName: string,
    filter: any,
    update: any,
    options?: any
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    try {
      const collection = await this.getCollection(collectionName);
      const start = Date.now();

      const result = await collection.updateOne(filter, update, options);

      const duration = Date.now() - start;
      logger.debug("MongoDB updateOne executed", {
        collection: collectionName,
        filter,
        duration: `${duration}ms`,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      });

      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      };
    } catch (error) {
      logger.error("MongoDB updateOne failed", {
        collection: collectionName,
        filter,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `UpdateOne operation failed: ${error.message}`
      );
    }
  }

  async deleteOne(
    collectionName: string,
    filter: any
  ): Promise<{ deletedCount: number }> {
    try {
      const collection = await this.getCollection(collectionName);
      const start = Date.now();

      const result = await collection.deleteOne(filter);

      const duration = Date.now() - start;
      logger.debug("MongoDB deleteOne executed", {
        collection: collectionName,
        filter,
        duration: `${duration}ms`,
        deletedCount: result.deletedCount,
      });

      return { deletedCount: result.deletedCount };
    } catch (error) {
      logger.error("MongoDB deleteOne failed", {
        collection: collectionName,
        filter,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `DeleteOne operation failed: ${error.message}`
      );
    }
  }

  async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new DatabaseConnectionError("Max reconnection attempts reached");
    }

    this.reconnectAttempts++;
    logger.warn(
      `Attempting to reconnect to MongoDB (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    try {
      await this.disconnect();
      await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay));
      await this.connect();
    } catch (error) {
      logger.error("Reconnection failed", { error: error.message });
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.connection !== null;
  }

  getConfig(): MongoConfig {
    return { ...this.config };
  }

  async getStats(): Promise<{
    collections: number;
    indexes: number;
    dataSize: number;
    storageSize: number;
  }> {
    try {
      const db = await this.getDatabase();
      const stats = await db.stats();

      return {
        collections: stats.collections,
        indexes: stats.indexes,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
      };
    } catch (error) {
      logger.error("Failed to get MongoDB stats", { error: error.message });
      throw new DatabaseQueryError(`Failed to get stats: ${error.message}`);
    }
  }
}

// Factory function to create connection
export function createMongoConnection(config: MongoConfig): MongoConnection {
  return new MongoConnection(config);
}

// Default connection instance
let defaultConnection: MongoConnection | null = null;

export function getDefaultConnection(): MongoConnection {
  if (!defaultConnection) {
    const config: MongoConfig = {
      uri:
        process.env.MONGODB_URL ||
        "mongodb://admin:admin123@localhost:27017/microservices?authSource=admin",
      dbName: process.env.MONGODB_DB || "microservices",
    };
    defaultConnection = createMongoConnection(config);
  }
  return defaultConnection;
}

export default MongoConnection;

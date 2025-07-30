import { Pool, PoolClient, PoolConfig } from "pg";
import createLogger from "../../common/utils/logger";
import {
  DatabaseConnectionError,
  DatabaseQueryError,
} from "../../common/errors";
import { DATABASE_CONFIG } from "../../common/constants";

const logger = createLogger("postgres-connection");

interface PostgresConfig extends PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  min?: number;
  idle?: number;
  acquire?: number;
  evict?: number;
}

class PostgresConnection {
  private pool: Pool | null = null;
  private config: PostgresConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000;

  constructor(config: PostgresConfig) {
    this.config = {
      ...DATABASE_CONFIG.POSTGRES,
      ...config,
      ssl: config.ssl || false,
      max: config.max || DATABASE_CONFIG.POSTGRES.POOL_MAX,
      min: config.min || DATABASE_CONFIG.POSTGRES.POOL_MIN,
      idle: config.idle || DATABASE_CONFIG.POSTGRES.POOL_IDLE,
      acquire: config.acquire || 60000,
      evict: config.evict || 30000,
    };
  }

  async connect(): Promise<void> {
    try {
      if (this.pool) {
        await this.disconnect();
      }

      this.pool = new Pool(this.config);

      // Set up event listeners
      this.pool.on("connect", (client: PoolClient) => {
        logger.info("New client connected to PostgreSQL");
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.pool.on("error", (err: Error) => {
        logger.error("Unexpected error on idle client", { error: err.message });
        this.isConnected = false;
      });

      this.pool.on("remove", () => {
        logger.info("Client removed from pool");
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query("SELECT NOW()");
      client.release();

      logger.info("PostgreSQL connection established successfully", {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
      });
    } catch (error) {
      logger.error("Failed to connect to PostgreSQL", { error: error.message });
      throw new DatabaseConnectionError(
        `PostgreSQL connection failed: ${error.message}`
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      logger.info("PostgreSQL connection pool closed");
    }
  }

  async getClient(): Promise<PoolClient> {
    if (!this.pool || !this.isConnected) {
      await this.connect();
    }

    try {
      return await this.pool!.connect();
    } catch (error) {
      logger.error("Failed to get client from pool", { error: error.message });
      throw new DatabaseConnectionError(
        `Failed to get client: ${error.message}`
      );
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const client = await this.getClient();

    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;

      logger.debug("Database query executed", {
        query: text,
        params,
        duration: `${duration}ms`,
        rowCount: result.rowCount,
      });

      return result.rows;
    } catch (error) {
      logger.error("Database query failed", {
        query: text,
        params,
        error: error.message,
      });
      throw new DatabaseQueryError(`Query failed: ${error.message}`);
    } finally {
      client.release();
    }
  }

  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();

    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query("SELECT 1");
      return true;
    } catch (error) {
      logger.error("PostgreSQL health check failed", { error: error.message });
      return false;
    }
  }

  async getPoolStats(): Promise<{
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  }> {
    if (!this.pool) {
      return { totalCount: 0, idleCount: 0, waitingCount: 0 };
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new DatabaseConnectionError("Max reconnection attempts reached");
    }

    this.reconnectAttempts++;
    logger.warn(
      `Attempting to reconnect to PostgreSQL (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
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
    return this.isConnected && this.pool !== null;
  }

  getConfig(): PostgresConfig {
    return { ...this.config };
  }
}

// Factory function to create connection
export function createPostgresConnection(
  config: PostgresConfig
): PostgresConnection {
  return new PostgresConnection(config);
}

// Default connection instance
let defaultConnection: PostgresConnection | null = null;

export function getDefaultConnection(): PostgresConnection {
  if (!defaultConnection) {
    const config: PostgresConfig = {
      host: process.env.POSTGRES_HOST || "localhost",
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
      database: process.env.POSTGRES_DB || "microservices",
      user: process.env.POSTGRES_USER || "postgres",
      password: process.env.POSTGRES_PASSWORD || "postgres123",
      ssl: process.env.NODE_ENV === "production",
    };
    defaultConnection = createPostgresConnection(config);
  }
  return defaultConnection;
}

export default PostgresConnection;

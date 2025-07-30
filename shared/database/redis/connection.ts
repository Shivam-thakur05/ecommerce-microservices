import Redis, { RedisOptions, ClusterOptions, Cluster } from "ioredis";
import createLogger from "../../common/utils/logger";
import { CacheError } from "../../common/errors";
import { DATABASE_CONFIG } from "../../common/constants";

const logger = createLogger("redis-connection");

interface RedisConfig extends RedisOptions {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

interface ClusterConfig extends ClusterOptions {
  nodes: Array<{ host: string; port: number }>;
  password?: string;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

class RedisConnection {
  private client: Redis | Cluster | null = null;
  private config: RedisConfig | ClusterConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000;
  private isCluster: boolean = false;

  constructor(config: RedisConfig | ClusterConfig) {
    this.config = {
      ...DATABASE_CONFIG.REDIS,
      ...config,
      keyPrefix: config.keyPrefix || DATABASE_CONFIG.REDIS.KEY_PREFIX,
      retryDelayOnFailover: config.retryDelayOnFailover || 100,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      enableReadyCheck: config.enableReadyCheck !== false,
      lazyConnect: config.lazyConnect !== false,
    };

    this.isCluster = "nodes" in config;
  }

  async connect(): Promise<void> {
    try {
      if (this.client) {
        await this.disconnect();
      }

      if (this.isCluster) {
        this.client = new Redis.Cluster(
          (this.config as ClusterConfig).nodes,
          this.config as ClusterConfig
        );
      } else {
        this.client = new Redis(this.config as RedisConfig);
      }

      // Set up event listeners
      this.client.on("connect", () => {
        logger.info("Redis connection established");
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on("ready", () => {
        logger.info("Redis client ready");
        this.isConnected = true;
      });

      this.client.on("error", (error) => {
        logger.error("Redis connection error", { error: error.message });
        this.isConnected = false;
      });

      this.client.on("close", () => {
        logger.warn("Redis connection closed");
        this.isConnected = false;
      });

      this.client.on("reconnecting", () => {
        logger.info("Redis reconnecting...");
      });

      // Wait for connection to be ready
      await this.client.ping();

      logger.info("Redis connection established successfully", {
        host: this.isCluster ? "cluster" : (this.config as RedisConfig).host,
        port: this.isCluster ? "cluster" : (this.config as RedisConfig).port,
        isCluster: this.isCluster,
      });
    } catch (error) {
      logger.error("Failed to connect to Redis", { error: error.message });
      throw new CacheError(`Redis connection failed: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info("Redis connection closed");
    }
  }

  async getClient(): Promise<Redis | Cluster> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }

    if (!this.client) {
      throw new CacheError("Redis client not available");
    }

    return this.client;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.ping();
      return true;
    } catch (error) {
      logger.error("Redis health check failed", { error: error.message });
      return false;
    }
  }

  // String operations
  async set(key: string, value: string, ttl?: number): Promise<"OK"> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.set(
        key,
        value,
        ...(ttl ? ["EX", ttl] : []) as any  // eslint-disable-line @typescript-eslint/no-explicit-any
      );
      
      const duration = Date.now() - start;
      logger.debug("Redis SET executed", {
        key,
        ttl,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      logger.error("Redis SET failed", { key, error: error.message });
      throw new CacheError(`SET operation failed: ${error.message}`);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.get(key);

      const duration = Date.now() - start;
      logger.debug("Redis GET executed", {
        key,
        duration: `${duration}ms`,
        found: result !== null,
      });

      return result;
    } catch (error) {
      logger.error("Redis GET failed", { key, error: error.message });
      throw new CacheError(`GET operation failed: ${error.message}`);
    }
  }

  async del(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.del(key);

      const duration = Date.now() - start;
      logger.debug("Redis DEL executed", {
        key,
        duration: `${duration}ms`,
        deleted: result,
      });

      return result;
    } catch (error) {
      logger.error("Redis DEL failed", { key, error: error.message });
      throw new CacheError(`DEL operation failed: ${error.message}`);
    }
  }

  async exists(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.exists(key);

      const duration = Date.now() - start;
      logger.debug("Redis EXISTS executed", {
        key,
        duration: `${duration}ms`,
        exists: result > 0,
      });

      return result;
    } catch (error) {
      logger.error("Redis EXISTS failed", { key, error: error.message });
      throw new CacheError(`EXISTS operation failed: ${error.message}`);
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.expire(key, seconds);

      const duration = Date.now() - start;
      logger.debug("Redis EXPIRE executed", {
        key,
        seconds,
        duration: `${duration}ms`,
        success: result > 0,
      });

      return result;
    } catch (error) {
      logger.error("Redis EXPIRE failed", {
        key,
        seconds,
        error: error.message,
      });
      throw new CacheError(`EXPIRE operation failed: ${error.message}`);
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.hset(key, field, value);

      const duration = Date.now() - start;
      logger.debug("Redis HSET executed", {
        key,
        field,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      logger.error("Redis HSET failed", { key, field, error: error.message });
      throw new CacheError(`HSET operation failed: ${error.message}`);
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.hget(key, field);

      const duration = Date.now() - start;
      logger.debug("Redis HGET executed", {
        key,
        field,
        duration: `${duration}ms`,
        found: result !== null,
      });

      return result;
    } catch (error) {
      logger.error("Redis HGET failed", { key, field, error: error.message });
      throw new CacheError(`HGET operation failed: ${error.message}`);
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.hgetall(key);

      const duration = Date.now() - start;
      logger.debug("Redis HGETALL executed", {
        key,
        duration: `${duration}ms`,
        fieldCount: Object.keys(result).length,
      });

      return result;
    } catch (error) {
      logger.error("Redis HGETALL failed", { key, error: error.message });
      throw new CacheError(`HGETALL operation failed: ${error.message}`);
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.lpush(key, ...values);

      const duration = Date.now() - start;
      logger.debug("Redis LPUSH executed", {
        key,
        values: values.length,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      logger.error("Redis LPUSH failed", { key, error: error.message });
      throw new CacheError(`LPUSH operation failed: ${error.message}`);
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.rpop(key);

      const duration = Date.now() - start;
      logger.debug("Redis RPOP executed", {
        key,
        duration: `${duration}ms`,
        found: result !== null,
      });

      return result;
    } catch (error) {
      logger.error("Redis RPOP failed", { key, error: error.message });
      throw new CacheError(`RPOP operation failed: ${error.message}`);
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.sadd(key, ...members);

      const duration = Date.now() - start;
      logger.debug("Redis SADD executed", {
        key,
        members: members.length,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      logger.error("Redis SADD failed", { key, error: error.message });
      throw new CacheError(`SADD operation failed: ${error.message}`);
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.smembers(key);

      const duration = Date.now() - start;
      logger.debug("Redis SMEMBERS executed", {
        key,
        duration: `${duration}ms`,
        memberCount: result.length,
      });

      return result;
    } catch (error) {
      logger.error("Redis SMEMBERS failed", { key, error: error.message });
      throw new CacheError(`SMEMBERS operation failed: ${error.message}`);
    }
  }

  // JSON operations (if RedisJSON is available)
  async jsonSet(key: string, path: string, value: any): Promise<"OK"> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await (client as any).call(
        "JSON.SET",
        key,
        path,
        JSON.stringify(value)
      );

      const duration = Date.now() - start;
      logger.debug("Redis JSON.SET executed", {
        key,
        path,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      logger.error("Redis JSON.SET failed", {
        key,
        path,
        error: error.message,
      });
      throw new CacheError(`JSON.SET operation failed: ${error.message}`);
    }
  }

  async jsonGet(key: string, path: string = "."): Promise<any> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await (client as any).call("JSON.GET", key, path);

      const duration = Date.now() - start;
      logger.debug("Redis JSON.GET executed", {
        key,
        path,
        duration: `${duration}ms`,
        found: result !== null,
      });

      return result ? JSON.parse(result) : null;
    } catch (error) {
      logger.error("Redis JSON.GET failed", {
        key,
        path,
        error: error.message,
      });
      throw new CacheError(`JSON.GET operation failed: ${error.message}`);
    }
  }

  // Utility methods
  async flushdb(): Promise<"OK"> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.flushdb();

      const duration = Date.now() - start;
      logger.info("Redis FLUSHDB executed", {
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      logger.error("Redis FLUSHDB failed", { error: error.message });
      throw new CacheError(`FLUSHDB operation failed: ${error.message}`);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const client = await this.getClient();
      const start = Date.now();

      const result = await client.keys(pattern);

      const duration = Date.now() - start;
      logger.debug("Redis KEYS executed", {
        pattern,
        duration: `${duration}ms`,
        keyCount: result.length,
      });

      return result;
    } catch (error) {
      logger.error("Redis KEYS failed", { pattern, error: error.message });
      throw new CacheError(`KEYS operation failed: ${error.message}`);
    }
  }

  async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new CacheError("Max reconnection attempts reached");
    }

    this.reconnectAttempts++;
    logger.warn(
      `Attempting to reconnect to Redis (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
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
    return this.isConnected && this.client !== null;
  }

  getConfig(): RedisConfig | ClusterConfig {
    return { ...this.config };
  }

  async getInfo(): Promise<Record<string, any>> {
    try {
      const client = await this.getClient();
      const info = await client.info();

      const infoObj: Record<string, any> = {};
      info.split("\r\n").forEach((line) => {
        if (line.includes(":")) {
          const [key, value] = line.split(":");
          infoObj[key] = value;
        }
      });

      return infoObj;
    } catch (error) {
      logger.error("Failed to get Redis info", { error: error.message });
      throw new CacheError(`Failed to get info: ${error.message}`);
    }
  }
}

// Factory function to create connection
export function createRedisConnection(
  config: RedisConfig | ClusterConfig
): RedisConnection {
  return new RedisConnection(config);
}

// Default connection instance
let defaultConnection: RedisConnection | null = null;

export function getDefaultConnection(): RedisConnection {
  if (!defaultConnection) {
    const config: RedisConfig = {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
      keyPrefix: process.env.REDIS_KEY_PREFIX || "ms:",
    };
    defaultConnection = createRedisConnection(config);
  }
  return defaultConnection;
}

export default RedisConnection;

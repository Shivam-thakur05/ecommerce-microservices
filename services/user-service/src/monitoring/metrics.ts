import { createLogger } from "../../../shared/common/utils/logger";
import { getDefaultConnection as getPostgresConnection } from "../../../shared/database/postgres/connection";
import { getDefaultConnection as getRedisConnection } from "../../../shared/database/redis/connection";
import { getDefaultConnection as getRabbitMQConnection } from "../../../shared/database/rabbitmq/connection";

const logger = createLogger("Metrics");

export class Metrics {
  private postgres: any;
  private redis: any;
  private rabbitmq: any;
  private metrics: Map<string, any>;

  constructor() {
    this.postgres = getPostgresConnection();
    this.redis = getRedisConnection();
    this.rabbitmq = getRabbitMQConnection();
    this.metrics = new Map();
    this.initializeMetrics();
  }

  /**
   * Initialize metrics collection
   */
  private initializeMetrics(): void {
    try {
      // Initialize basic metrics
      this.metrics.set("requests_total", 0);
      this.metrics.set("requests_duration", []);
      this.metrics.set("errors_total", 0);
      this.metrics.set("users_total", 0);
      this.metrics.set("users_active", 0);
      this.metrics.set("auth_attempts", 0);
      this.metrics.set("auth_success", 0);
      this.metrics.set("auth_failures", 0);
      this.metrics.set("database_operations", 0);
      this.metrics.set("cache_hits", 0);
      this.metrics.set("cache_misses", 0);
      this.metrics.set("event_published", 0);
      this.metrics.set("event_consumed", 0);

      logger.info("Metrics initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize metrics", { error });
    }
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(metricName: string, value: number = 1): void {
    try {
      const currentValue = this.metrics.get(metricName) || 0;
      this.metrics.set(metricName, currentValue + value);
    } catch (error) {
      logger.error("Failed to increment counter", { metricName, error });
    }
  }

  /**
   * Record a duration metric
   */
  recordDuration(metricName: string, duration: number): void {
    try {
      const durations = this.metrics.get(metricName) || [];
      durations.push(duration);

      // Keep only last 1000 durations to prevent memory issues
      if (durations.length > 1000) {
        durations.splice(0, durations.length - 1000);
      }

      this.metrics.set(metricName, durations);
    } catch (error) {
      logger.error("Failed to record duration", {
        metricName,
        duration,
        error,
      });
    }
  }

  /**
   * Set a gauge metric
   */
  setGauge(metricName: string, value: number): void {
    try {
      this.metrics.set(metricName, value);
    } catch (error) {
      logger.error("Failed to set gauge", { metricName, value, error });
    }
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): any {
    try {
      const metrics: any = {};

      for (const [key, value] of this.metrics.entries()) {
        if (Array.isArray(value)) {
          // Calculate statistics for duration metrics
          metrics[key] = {
            count: value.length,
            sum: value.reduce((a, b) => a + b, 0),
            average:
              value.length > 0
                ? value.reduce((a, b) => a + b, 0) / value.length
                : 0,
            min: value.length > 0 ? Math.min(...value) : 0,
            max: value.length > 0 ? Math.max(...value) : 0,
            p95: this.calculatePercentile(value, 95),
            p99: this.calculatePercentile(value, 99),
          };
        } else {
          metrics[key] = value;
        }
      }

      return metrics;
    } catch (error) {
      logger.error("Failed to get all metrics", { error });
      return {};
    }
  }

  /**
   * Calculate percentile for duration metrics
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Get Prometheus format metrics
   */
  getPrometheusMetrics(): string {
    try {
      const metrics = this.getAllMetrics();
      let prometheusMetrics = "";

      // Add service info
      prometheusMetrics += `# HELP user_service_info Information about the user service\n`;
      prometheusMetrics += `# TYPE user_service_info gauge\n`;
      prometheusMetrics += `user_service_info{version="${process.env.npm_package_version || "1.0.0"}"} 1\n\n`;

      // Add counter metrics
      prometheusMetrics += `# HELP user_service_requests_total Total number of requests\n`;
      prometheusMetrics += `# TYPE user_service_requests_total counter\n`;
      prometheusMetrics += `user_service_requests_total ${metrics.requests_total || 0}\n\n`;

      prometheusMetrics += `# HELP user_service_errors_total Total number of errors\n`;
      prometheusMetrics += `# TYPE user_service_errors_total counter\n`;
      prometheusMetrics += `user_service_errors_total ${metrics.errors_total || 0}\n\n`;

      prometheusMetrics += `# HELP user_service_users_total Total number of users\n`;
      prometheusMetrics += `# TYPE user_service_users_total gauge\n`;
      prometheusMetrics += `user_service_users_total ${metrics.users_total || 0}\n\n`;

      prometheusMetrics += `# HELP user_service_users_active Active users\n`;
      prometheusMetrics += `# TYPE user_service_users_active gauge\n`;
      prometheusMetrics += `user_service_users_active ${metrics.users_active || 0}\n\n`;

      prometheusMetrics += `# HELP user_service_auth_attempts_total Total authentication attempts\n`;
      prometheusMetrics += `# TYPE user_service_auth_attempts_total counter\n`;
      prometheusMetrics += `user_service_auth_attempts_total ${metrics.auth_attempts || 0}\n\n`;

      prometheusMetrics += `# HELP user_service_auth_success_total Successful authentications\n`;
      prometheusMetrics += `# TYPE user_service_auth_success_total counter\n`;
      prometheusMetrics += `user_service_auth_success_total ${metrics.auth_success || 0}\n\n`;

      prometheusMetrics += `# HELP user_service_auth_failures_total Failed authentications\n`;
      prometheusMetrics += `# TYPE user_service_auth_failures_total counter\n`;
      prometheusMetrics += `user_service_auth_failures_total ${metrics.auth_failures || 0}\n\n`;

      // Add duration metrics
      if (metrics.requests_duration) {
        prometheusMetrics += `# HELP user_service_request_duration_seconds Request duration in seconds\n`;
        prometheusMetrics += `# TYPE user_service_request_duration_seconds histogram\n`;
        prometheusMetrics += `user_service_request_duration_seconds_count ${metrics.requests_duration.count}\n`;
        prometheusMetrics += `user_service_request_duration_seconds_sum ${metrics.requests_duration.sum / 1000}\n`;
        prometheusMetrics += `user_service_request_duration_seconds_bucket{le="0.1"} ${this.countInBucket(metrics.requests_duration, 100)}\n`;
        prometheusMetrics += `user_service_request_duration_seconds_bucket{le="0.5"} ${this.countInBucket(metrics.requests_duration, 500)}\n`;
        prometheusMetrics += `user_service_request_duration_seconds_bucket{le="1"} ${this.countInBucket(metrics.requests_duration, 1000)}\n`;
        prometheusMetrics += `user_service_request_duration_seconds_bucket{le="5"} ${this.countInBucket(metrics.requests_duration, 5000)}\n`;
        prometheusMetrics += `user_service_request_duration_seconds_bucket{le="+Inf"} ${metrics.requests_duration.count}\n\n`;
      }

      // Add database metrics
      prometheusMetrics += `# HELP user_service_database_operations_total Total database operations\n`;
      prometheusMetrics += `# TYPE user_service_database_operations_total counter\n`;
      prometheusMetrics += `user_service_database_operations_total ${metrics.database_operations || 0}\n\n`;

      // Add cache metrics
      prometheusMetrics += `# HELP user_service_cache_hits_total Total cache hits\n`;
      prometheusMetrics += `# TYPE user_service_cache_hits_total counter\n`;
      prometheusMetrics += `user_service_cache_hits_total ${metrics.cache_hits || 0}\n\n`;

      prometheusMetrics += `# HELP user_service_cache_misses_total Total cache misses\n`;
      prometheusMetrics += `# TYPE user_service_cache_misses_total counter\n`;
      prometheusMetrics += `user_service_cache_misses_total ${metrics.cache_misses || 0}\n\n`;

      // Add event metrics
      prometheusMetrics += `# HELP user_service_events_published_total Total events published\n`;
      prometheusMetrics += `# TYPE user_service_events_published_total counter\n`;
      prometheusMetrics += `user_service_events_published_total ${metrics.event_published || 0}\n\n`;

      prometheusMetrics += `# HELP user_service_events_consumed_total Total events consumed\n`;
      prometheusMetrics += `# TYPE user_service_events_consumed_total counter\n`;
      prometheusMetrics += `user_service_events_consumed_total ${metrics.event_consumed || 0}\n\n`;

      return prometheusMetrics;
    } catch (error) {
      logger.error("Failed to generate Prometheus metrics", { error });
      return "";
    }
  }

  /**
   * Count values in a bucket for histogram
   */
  private countInBucket(durationMetrics: any, maxValue: number): number {
    if (!durationMetrics || !Array.isArray(durationMetrics)) return 0;
    return durationMetrics.filter((d: number) => d <= maxValue).length;
  }

  /**
   * Update user count metrics
   */
  async updateUserMetrics(): Promise<void> {
    try {
      // This would typically query the database for actual counts
      // For now, we'll use placeholder values
      this.setGauge("users_total", 1000);
      this.setGauge("users_active", 750);
    } catch (error) {
      logger.error("Failed to update user metrics", { error });
    }
  }

  /**
   * Record request metrics
   */
  recordRequest(duration: number, success: boolean = true): void {
    try {
      this.incrementCounter("requests_total");
      this.recordDuration("requests_duration", duration);

      if (!success) {
        this.incrementCounter("errors_total");
      }
    } catch (error) {
      logger.error("Failed to record request metrics", { error });
    }
  }

  /**
   * Record authentication metrics
   */
  recordAuthAttempt(success: boolean): void {
    try {
      this.incrementCounter("auth_attempts");

      if (success) {
        this.incrementCounter("auth_success");
      } else {
        this.incrementCounter("auth_failures");
      }
    } catch (error) {
      logger.error("Failed to record auth metrics", { error });
    }
  }

  /**
   * Record database operation
   */
  recordDatabaseOperation(): void {
    try {
      this.incrementCounter("database_operations");
    } catch (error) {
      logger.error("Failed to record database operation", { error });
    }
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(hit: boolean): void {
    try {
      if (hit) {
        this.incrementCounter("cache_hits");
      } else {
        this.incrementCounter("cache_misses");
      }
    } catch (error) {
      logger.error("Failed to record cache operation", { error });
    }
  }

  /**
   * Record event metrics
   */
  recordEvent(published: boolean): void {
    try {
      if (published) {
        this.incrementCounter("event_published");
      } else {
        this.incrementCounter("event_consumed");
      }
    } catch (error) {
      logger.error("Failed to record event metrics", { error });
    }
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): any {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          heapUsedPercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      };
    } catch (error) {
      logger.error("Failed to get system metrics", { error });
      return {};
    }
  }

  /**
   * Get database metrics
   */
  async getDatabaseMetrics(): Promise<any> {
    try {
      const postgresStats = this.postgres.getPoolStats();
      const redisInfo = await this.redis.getInfo();
      const rabbitmqInfo = await this.rabbitmq.getConsumers();

      return {
        postgres: {
          totalCount: postgresStats.totalCount,
          idleCount: postgresStats.idleCount,
          waitingCount: postgresStats.waitingCount,
        },
        redis: {
          connected_clients: redisInfo.connected_clients,
          used_memory: redisInfo.used_memory_human,
          keyspace_hits: redisInfo.keyspace_hits,
          keyspace_misses: redisInfo.keyspace_misses,
        },
        rabbitmq: {
          consumers: rabbitmqInfo.length,
        },
      };
    } catch (error) {
      logger.error("Failed to get database metrics", { error });
      return {};
    }
  }

  /**
   * Reset metrics (for testing or periodic cleanup)
   */
  resetMetrics(): void {
    try {
      this.initializeMetrics();
      logger.info("Metrics reset successfully");
    } catch (error) {
      logger.error("Failed to reset metrics", { error });
    }
  }

  /**
   * Cleanup metrics
   */
  async cleanup(): Promise<void> {
    try {
      logger.info("Cleaning up metrics");
      this.metrics.clear();
    } catch (error) {
      logger.error("Failed to cleanup metrics", { error });
    }
  }
}

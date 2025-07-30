import { createLogger } from "../../../shared/common/utils/logger";
import { getDefaultConnection as getPostgresConnection } from "../../../shared/database/postgres/connection";
import { getDefaultConnection as getRedisConnection } from "../../../shared/database/redis/connection";
import { getDefaultConnection as getRabbitMQConnection } from "../../../shared/database/rabbitmq/connection";
import { HealthCheckResult, HealthStatus } from "../../../shared/common/types";

const logger = createLogger("HealthChecks");

export class HealthChecks {
  private postgres: any;
  private redis: any;
  private rabbitmq: any;

  constructor() {
    this.postgres = getPostgresConnection();
    this.redis = getRedisConnection();
    this.rabbitmq = getRabbitMQConnection();
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = {
      service: await this.checkServiceHealth(),
      postgres: await this.checkPostgresHealth(),
      redis: await this.checkRedisHealth(),
      rabbitmq: await this.checkRabbitMQHealth(),
      memory: await this.checkMemoryHealth(),
      disk: await this.checkDiskHealth(),
    };

    const overallStatus = this.determineOverallStatus(checks);
    const duration = Date.now() - startTime;

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: "user-service",
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
      checks,
      duration,
    };

    logger.info("Health check completed", {
      status: overallStatus,
      duration,
      checks: Object.keys(checks).map((key) => ({ [key]: checks[key].status })),
    });

    return result;
  }

  /**
   * Check service health
   */
  private async checkServiceHealth(): Promise<{
    status: HealthStatus;
    details: any;
  }> {
    try {
      const details = {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
      };

      return {
        status: HealthStatus.HEALTHY,
        details,
      };
    } catch (error) {
      logger.error("Service health check failed", { error });
      return {
        status: HealthStatus.UNHEALTHY,
        details: { error: error.message },
      };
    }
  }

  /**
   * Check PostgreSQL health
   */
  private async checkPostgresHealth(): Promise<{
    status: HealthStatus;
    details: any;
  }> {
    try {
      if (!this.postgres.isHealthy()) {
        return {
          status: HealthStatus.UNHEALTHY,
          details: { error: "PostgreSQL connection is not healthy" },
        };
      }

      // Perform a simple query to test connectivity
      const result = await this.postgres.queryOne("SELECT 1 as test");

      if (!result) {
        return {
          status: HealthStatus.UNHEALTHY,
          details: { error: "PostgreSQL query test failed" },
        };
      }

      const poolStats = this.postgres.getPoolStats();
      const details = {
        connected: this.postgres.isConnected(),
        poolStats,
        config: this.postgres.getConfig(),
      };

      return {
        status: HealthStatus.HEALTHY,
        details,
      };
    } catch (error) {
      logger.error("PostgreSQL health check failed", { error });
      return {
        status: HealthStatus.UNHEALTHY,
        details: { error: error.message },
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth(): Promise<{
    status: HealthStatus;
    details: any;
  }> {
    try {
      if (!this.redis.isHealthy()) {
        return {
          status: HealthStatus.UNHEALTHY,
          details: { error: "Redis connection is not healthy" },
        };
      }

      // Perform a simple ping test
      const pingResult = await this.redis.getClient().ping();

      if (pingResult !== "PONG") {
        return {
          status: HealthStatus.UNHEALTHY,
          details: { error: "Redis ping test failed" },
        };
      }

      const info = await this.redis.getInfo();
      const details = {
        connected: this.redis.isConnected(),
        info: {
          version: info.redis_version,
          uptime: info.uptime_in_seconds,
          connected_clients: info.connected_clients,
          used_memory: info.used_memory_human,
          keyspace_hits: info.keyspace_hits,
          keyspace_misses: info.keyspace_misses,
        },
        config: this.redis.getConfig(),
      };

      return {
        status: HealthStatus.HEALTHY,
        details,
      };
    } catch (error) {
      logger.error("Redis health check failed", { error });
      return {
        status: HealthStatus.UNHEALTHY,
        details: { error: error.message },
      };
    }
  }

  /**
   * Check RabbitMQ health
   */
  private async checkRabbitMQHealth(): Promise<{
    status: HealthStatus;
    details: any;
  }> {
    try {
      if (!this.rabbitmq.isHealthy()) {
        return {
          status: HealthStatus.UNHEALTHY,
          details: { error: "RabbitMQ connection is not healthy" },
        };
      }

      // Perform a simple health check
      const healthCheck = await this.rabbitmq.healthCheck();

      if (!healthCheck) {
        return {
          status: HealthStatus.UNHEALTHY,
          details: { error: "RabbitMQ health check failed" },
        };
      }

      const details = {
        connected: this.rabbitmq.isConnected(),
        config: this.rabbitmq.getConfig(),
      };

      return {
        status: HealthStatus.HEALTHY,
        details,
      };
    } catch (error) {
      logger.error("RabbitMQ health check failed", { error });
      return {
        status: HealthStatus.UNHEALTHY,
        details: { error: error.message },
      };
    }
  }

  /**
   * Check memory health
   */
  private async checkMemoryHealth(): Promise<{
    status: HealthStatus;
    details: any;
  }> {
    try {
      const memUsage = process.memoryUsage();
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      // Consider unhealthy if heap usage is above 90%
      const isHealthy = heapUsedPercent < 90;

      const details = {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        heapUsedPercent: Math.round(heapUsedPercent * 100) / 100,
        threshold: 90,
      };

      return {
        status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        details,
      };
    } catch (error) {
      logger.error("Memory health check failed", { error });
      return {
        status: HealthStatus.UNHEALTHY,
        details: { error: error.message },
      };
    }
  }

  /**
   * Check disk health
   */
  private async checkDiskHealth(): Promise<{
    status: HealthStatus;
    details: any;
  }> {
    try {
      // This is a simplified disk check
      // In production, you might want to check actual disk space
      const details = {
        message: "Disk health check not implemented",
        note: "Consider implementing actual disk space monitoring",
      };

      return {
        status: HealthStatus.HEALTHY,
        details,
      };
    } catch (error) {
      logger.error("Disk health check failed", { error });
      return {
        status: HealthStatus.UNHEALTHY,
        details: { error: error.message },
      };
    }
  }

  /**
   * Determine overall health status based on individual checks
   */
  private determineOverallStatus(checks: any): HealthStatus {
    const statuses = Object.values(checks).map((check: any) => check.status);

    if (statuses.every((status) => status === HealthStatus.HEALTHY)) {
      return HealthStatus.HEALTHY;
    }

    if (statuses.some((status) => status === HealthStatus.UNHEALTHY)) {
      return HealthStatus.UNHEALTHY;
    }

    return HealthStatus.DEGRADED;
  }

  /**
   * Check if service is ready (for Kubernetes readiness probe)
   */
  async isReady(): Promise<boolean> {
    try {
      const healthCheck = await this.performHealthCheck();
      return healthCheck.status === HealthStatus.HEALTHY;
    } catch (error) {
      logger.error("Readiness check failed", { error });
      return false;
    }
  }

  /**
   * Check if service is alive (for Kubernetes liveness probe)
   */
  async isAlive(): Promise<boolean> {
    try {
      // For liveness probe, we only check basic service health
      const serviceCheck = await this.checkServiceHealth();
      return serviceCheck.status === HealthStatus.HEALTHY;
    } catch (error) {
      logger.error("Liveness check failed", { error });
      return false;
    }
  }

  /**
   * Get detailed health metrics
   */
  async getMetrics(): Promise<any> {
    try {
      const healthCheck = await this.performHealthCheck();

      return {
        ...healthCheck,
        metrics: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error("Failed to get health metrics", { error });
      throw error;
    }
  }

  /**
   * Cleanup health checks
   */
  async cleanup(): Promise<void> {
    try {
      logger.info("Cleaning up health checks");
      // No specific cleanup needed for health checks
    } catch (error) {
      logger.error("Failed to cleanup health checks", { error });
    }
  }
}

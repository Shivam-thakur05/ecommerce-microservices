import { Router } from "express";
import { createLogger } from "../../../shared/common/utils/logger";
import { getDefaultConnection } from "../../../shared/database/postgres/connection";
import { getDefaultConnection as getRedisConnection } from "../../../shared/database/redis/connection";
import { getDefaultConnection as getRabbitMQConnection } from "../../../shared/database/rabbitmq/connection";
import { ApiResponse } from "../../../shared/common/types";

const logger = createLogger("HealthRoutes");
const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get("/", async (req, res) => {
  try {
    const response: ApiResponse<{
      status: string;
      timestamp: string;
      service: string;
      version: string;
      uptime: number;
    }> = {
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "user-service",
        version: process.env.npm_package_version || "1.0.0",
        uptime: process.uptime(),
      },
      message: "User service is healthy",
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Health check failed", { error });
    res.status(503).json({
      success: false,
      data: null,
      message: "Service is unhealthy",
      error: "Health check failed",
    });
  }
});

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed health check with database connections
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health status
 */
router.get("/detailed", async (req, res) => {
  try {
    const healthChecks = {
      service: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
      databases: {
        postgres: "unknown",
        redis: "unknown",
        rabbitmq: "unknown",
      },
    };

    // Check PostgreSQL connection
    try {
      const postgres = getDefaultConnection();
      if (postgres.isHealthy()) {
        healthChecks.databases.postgres = "healthy";
      } else {
        healthChecks.databases.postgres = "unhealthy";
      }
    } catch (error) {
      logger.error("PostgreSQL health check failed", { error });
      healthChecks.databases.postgres = "unhealthy";
    }

    // Check Redis connection
    try {
      const redis = getRedisConnection();
      if (redis.isHealthy()) {
        healthChecks.databases.redis = "healthy";
      } else {
        healthChecks.databases.redis = "unhealthy";
      }
    } catch (error) {
      logger.error("Redis health check failed", { error });
      healthChecks.databases.redis = "unhealthy";
    }

    // Check RabbitMQ connection
    try {
      const rabbitmq = getRabbitMQConnection();
      if (rabbitmq.isHealthy()) {
        healthChecks.databases.rabbitmq = "healthy";
      } else {
        healthChecks.databases.rabbitmq = "unhealthy";
      }
    } catch (error) {
      logger.error("RabbitMQ health check failed", { error });
      healthChecks.databases.rabbitmq = "unhealthy";
    }

    // Determine overall health
    const allHealthy = Object.values(healthChecks.databases).every(
      (status) => status === "healthy"
    );
    const overallStatus = allHealthy ? "healthy" : "degraded";

    const response: ApiResponse<typeof healthChecks> = {
      success: true,
      data: healthChecks,
      message: `Service is ${overallStatus}`,
    };

    res.status(allHealthy ? 200 : 503).json(response);
  } catch (error) {
    logger.error("Detailed health check failed", { error });
    res.status(503).json({
      success: false,
      data: null,
      message: "Service is unhealthy",
      error: "Detailed health check failed",
    });
  }
});

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Readiness check for Kubernetes
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get("/ready", async (req, res) => {
  try {
    // Check if all required services are ready
    const postgres = getDefaultConnection();
    const redis = getRedisConnection();
    const rabbitmq = getRabbitMQConnection();

    const isReady =
      postgres.isHealthy() && redis.isHealthy() && rabbitmq.isHealthy();

    if (isReady) {
      res.status(200).json({
        success: true,
        data: { status: "ready" },
        message: "Service is ready",
      });
    } else {
      res.status(503).json({
        success: false,
        data: { status: "not ready" },
        message: "Service is not ready",
      });
    }
  } catch (error) {
    logger.error("Readiness check failed", { error });
    res.status(503).json({
      success: false,
      data: { status: "not ready" },
      message: "Service is not ready",
      error: "Readiness check failed",
    });
  }
});

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Liveness check for Kubernetes
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get("/live", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { status: "alive" },
      message: "Service is alive",
    });
  } catch (error) {
    logger.error("Liveness check failed", { error });
    res.status(503).json({
      success: false,
      data: { status: "not alive" },
      message: "Service is not alive",
      error: "Liveness check failed",
    });
  }
});

/**
 * @swagger
 * /api/health/metrics:
 *   get:
 *     summary: Service metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service metrics
 */
router.get("/metrics", async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      service: "user-service",
      uptime: process.uptime(),
      memory: {
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external,
      },
      cpu: process.cpuUsage(),
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    const response: ApiResponse<typeof metrics> = {
      success: true,
      data: metrics,
      message: "Service metrics retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Metrics collection failed", { error });
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to collect metrics",
      error: "Metrics collection failed",
    });
  }
});

export default router;

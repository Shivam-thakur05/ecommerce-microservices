import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { createLogger } from "../../../shared/common/utils/logger";

const logger = createLogger("Swagger");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Service API",
      version: "1.0.0",
      description: "API documentation for the User Service microservice",
      contact: {
        name: "API Support",
        email: "support@microservices.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
      {
        url: "https://api.microservices.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
      schemas: {
        // User schemas
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            username: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phone: { type: "string" },
            dateOfBirth: { type: "string", format: "date" },
            gender: { type: "string", enum: ["male", "female", "other"] },
            role: { type: "string", enum: ["user", "admin", "moderator"] },
            status: {
              type: "string",
              enum: ["active", "inactive", "suspended"],
            },
            emailVerified: { type: "boolean" },
            phoneVerified: { type: "boolean" },
            lastLoginAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateUserRequest: {
          type: "object",
          required: ["email", "password", "firstName", "lastName"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
            username: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phone: { type: "string" },
            dateOfBirth: { type: "string", format: "date" },
            gender: { type: "string", enum: ["male", "female", "other"] },
          },
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            phone: { type: "string" },
            dateOfBirth: { type: "string", format: "date" },
            gender: { type: "string", enum: ["male", "female", "other"] },
          },
        },
        Address: {
          type: "object",
          required: ["street", "city", "state", "zipCode", "country"],
          properties: {
            id: { type: "string", format: "uuid" },
            type: {
              type: "string",
              enum: ["home", "work", "billing", "shipping"],
            },
            street: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zipCode: { type: "string" },
            country: { type: "string" },
            isDefault: { type: "boolean" },
          },
        },
        UserPreferences: {
          type: "object",
          properties: {
            language: { type: "string", default: "en" },
            timezone: { type: "string" },
            currency: { type: "string" },
            emailNotifications: { type: "boolean", default: true },
            smsNotifications: { type: "boolean", default: false },
            pushNotifications: { type: "boolean", default: true },
            marketingEmails: { type: "boolean", default: false },
            twoFactorEnabled: { type: "boolean", default: false },
          },
        },
        UserStatistics: {
          type: "object",
          properties: {
            totalOrders: { type: "number" },
            totalSpent: { type: "number" },
            averageOrderValue: { type: "number" },
            lastOrderDate: { type: "string", format: "date-time" },
            loginCount: { type: "number" },
            daysSinceLastLogin: { type: "number" },
            emailOpenRate: { type: "number" },
            clickThroughRate: { type: "number" },
          },
        },

        // Authentication schemas
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
            rememberMe: { type: "boolean", default: false },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["email", "password", "firstName", "lastName"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
            username: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phone: { type: "string" },
            dateOfBirth: { type: "string", format: "date" },
            gender: { type: "string", enum: ["male", "female", "other"] },
            acceptTerms: { type: "boolean", default: true },
          },
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            expiresIn: { type: "number" },
            tokenType: { type: "string", default: "Bearer" },
          },
        },
        PasswordResetRequest: {
          type: "object",
          required: ["email", "token", "newPassword"],
          properties: {
            email: { type: "string", format: "email" },
            token: { type: "string" },
            newPassword: { type: "string", minLength: 8 },
          },
        },
        EmailVerificationRequest: {
          type: "object",
          required: ["email", "token"],
          properties: {
            email: { type: "string", format: "email" },
            token: { type: "string" },
          },
        },
        UserSession: {
          type: "object",
          properties: {
            userId: { type: "string", format: "uuid" },
            sessionId: { type: "string" },
            ipAddress: { type: "string" },
            userAgent: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            lastActivity: { type: "string", format: "date-time" },
            isActive: { type: "boolean" },
          },
        },

        // API Response schemas
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
            message: { type: "string" },
            error: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        PaginationResponse: {
          type: "object",
          properties: {
            users: {
              type: "array",
              items: { $ref: "#/components/schemas/User" },
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "number" },
                limit: { type: "number" },
                total: { type: "number" },
                totalPages: { type: "number" },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", default: false },
            message: { type: "string" },
            error: { type: "string" },
            code: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
      },
    },
    tags: [
      {
        name: "Users",
        description: "User management operations",
      },
      {
        name: "Authentication",
        description: "Authentication and authorization operations",
      },
      {
        name: "Health",
        description: "Health check and monitoring endpoints",
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./src/models/*.ts"],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  try {
    // Serve Swagger UI
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(specs, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "User Service API Documentation",
        customfavIcon: "/favicon.ico",
        swaggerOptions: {
          docExpansion: "list",
          filter: true,
          showRequestDuration: true,
          tryItOutEnabled: true,
        },
      })
    );

    // Serve OpenAPI specification as JSON
    app.get("/api-docs.json", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(specs);
    });

    // Serve OpenAPI specification as YAML
    app.get("/api-docs.yaml", (req, res) => {
      res.setHeader("Content-Type", "text/yaml");
      res.send(specs);
    });

    logger.info("Swagger documentation setup completed");
  } catch (error) {
    logger.error("Failed to setup Swagger documentation", { error });
  }
}

export function getSwaggerSpecs() {
  return specs;
}

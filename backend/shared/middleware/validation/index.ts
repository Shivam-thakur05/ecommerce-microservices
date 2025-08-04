import { Request, Response, NextFunction } from "express";
import createLogger from "../../common/utils/logger";
import { ValidationError, BadRequestError } from "../../common/errors";

const logger = createLogger("validation-middleware");

// Basic validation middleware
export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Basic validation for required fields
    if (req.method === "POST" || req.method === "PUT") {
      if (!req.body || Object.keys(req.body).length === 0) {
        throw new BadRequestError("Request body is required");
      }
    }

    next();
  } catch (error) {
    logger.error("Validation error", { error });
    next(error);
  }
}

// Validate required fields
export function validateRequiredFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const missingFields: string[] = [];

      for (const field of fields) {
        if (!req.body[field]) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        throw new BadRequestError(
          `Missing required fields: ${missingFields.join(", ")}`
        );
      }

      next();
    } catch (error) {
      logger.error("Required fields validation error", { error });
      next(error);
    }
  };
}

// Validate email format
export function validateEmail(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const email = req.body.email;
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestError("Invalid email format");
      }
    }
    next();
  } catch (error) {
    logger.error("Email validation error", { error });
    next(error);
  }
}

// Validate UUID format
export function validateUUID(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const uuid = req.params.id;
    if (uuid) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uuid)) {
        throw new BadRequestError("Invalid UUID format");
      }
    }
    next();
  } catch (error) {
    logger.error("UUID validation error", { error });
    next(error);
  }
}

// Sanitize input
export function sanitizeInput(data: any): any {
  if (typeof data === "string") {
    return data.trim().replace(/[<>]/g, "");
  }
  if (typeof data === "object" && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return data;
}

// Sanitize request
export function sanitize(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (req.body) {
      req.body = sanitizeInput(req.body);
    }
    if (req.query) {
      req.query = sanitizeInput(req.query);
    }
    if (req.params) {
      req.params = sanitizeInput(req.params);
    }
    next();
  } catch (error) {
    logger.error("Sanitization error", { error });
    next(error);
  }
}

// Validate file upload
export function validateFileUpload(
  allowedTypes: string[],
  maxSize: number,
  maxFiles: number = 1
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        throw new BadRequestError("No files uploaded");
      }

      const files = Array.isArray(req.files) ? req.files : [req.files];

      if (files.length > maxFiles) {
        throw new BadRequestError(`Maximum ${maxFiles} files allowed`);
      }

      for (const file of files) {
        const fileObj = file as any;
        if (!allowedTypes.includes(fileObj.mimetype)) {
          throw new BadRequestError(
            `File type ${fileObj.mimetype} not allowed`
          );
        }

        if (fileObj.size > maxSize) {
          throw new BadRequestError(
            `File size ${fileObj.size} exceeds maximum ${maxSize}`
          );
        }
      }

      next();
    } catch (error) {
      logger.error("File upload validation error", { error });
      next(error);
    }
  };
}

// Validate pagination
export function validatePagination(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page < 1) {
      throw new BadRequestError("Page must be greater than 0");
    }

    if (limit < 1 || limit > 100) {
      throw new BadRequestError("Limit must be between 1 and 100");
    }

    req.query.page = page.toString();
    req.query.limit = limit.toString();

    next();
  } catch (error) {
    logger.error("Pagination validation error", { error });
    next(error);
  }
}

// Validate search query
export function validateSearchQuery(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const query = req.query.q as string;
    if (query && query.length < 2) {
      throw new BadRequestError("Search query must be at least 2 characters");
    }
    next();
  } catch (error) {
    logger.error("Search query validation error", { error });
    next(error);
  }
}

export default {
  validateRequest,
  validateRequiredFields,
  validateEmail,
  validateUUID,
  sanitize,
  validateFileUpload,
  validatePagination,
  validateSearchQuery,
};

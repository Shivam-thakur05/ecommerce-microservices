import winston from 'winston';
import { format } from 'winston';

const { combine, timestamp, errors, json, colorize, printf } = format;

// Custom format for development
const developmentFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logger instance
const createLogger = (serviceName: string) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const formats = isDevelopment
    ? combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        developmentFormat
      )
    : combine(
        timestamp(),
        errors({ stack: true }),
        json()
      );

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: formats,
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: `logs/${serviceName}-combined.log`,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  });
};

// Request logger middleware
export const requestLogger = (logger: winston.Logger) => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    });
    
    next();
  };
};

// Error logger
export const errorLogger = (logger: winston.Logger) => {
  return (error: Error, req: any, res: any, next: any) => {
    logger.error('Unhandled Error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
    next(error);
  };
};

export default createLogger; 
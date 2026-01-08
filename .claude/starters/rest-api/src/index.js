/**
 * Server Entry Point
 * Express server with middleware and graceful shutdown
 */

import express from 'express';
import { config } from './config/index.js';
import { routes } from './api/routes.js';
import { errorHandler } from './api/middleware/error.js';
import { methodOverride } from './api/middleware/method-override.js';
import { logger } from './lib/logger.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start
    });
  });
  next();
});

// Routes
app.use(routes);

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

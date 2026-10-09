'use strict';

/**
 * Builds the Express app. It never calls listen(), so the same app serves
 * local development (server.js) and Vercel (api/index.js).
 */

const express = require('express');
const env = require('./config/env');
const { REQUEST_BODY_LIMIT } = require('./config/constants');
const logger = require('./utils/logger');
const { sendSuccess } = require('./utils/helpers');
const { corsMiddleware } = require('./middleware/cors');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const resumeRoutes = require('./routes/resumeRoutes');
const roleRoutes = require('./routes/roleRoutes');
const aiRoutes = require('./routes/aiRoutes');

function securityHeaders(req, res, next) {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Cache-Control', 'no-store');
  next();
}

function requestLogger(req, res, next) {
  const startedAt = Date.now();
  res.on('finish', () => {
    logger.info('request.completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });
  next();
}

const app = express();

app.disable('x-powered-by');
// Vercel (and most hosts) put one proxy in front; needed for correct client IPs in rate limiting.
app.set('trust proxy', env.isProduction ? 1 : false);

app.use(securityHeaders);
app.use(corsMiddleware);
app.use(requestLogger);
app.use(express.json({ limit: REQUEST_BODY_LIMIT }));

app.get('/api/health', (req, res) => sendSuccess(res, { status: 'ok' }));

app.use('/api', apiLimiter);
app.use('/api', resumeRoutes);
app.use('/api', roleRoutes);
app.use('/api', aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

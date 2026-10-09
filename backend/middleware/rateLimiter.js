'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const AppError = require('../utils/AppError');

// Counters live in memory, so on serverless platforms they are per instance.
// That still blunts abuse; use a shared store (e.g. Redis) for strict limits.
function createLimiter(limit) {
  return rateLimit({
    windowMs: env.rateLimit.windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res, next) => next(new AppError('Too many requests. Please try again later.', 429, 'RATE_LIMITED')),
  });
}

module.exports = {
  apiLimiter: createLimiter(env.rateLimit.max),
  // Stricter: every request here calls Gemini.
  aiLimiter: createLimiter(env.rateLimit.aiMax),
};

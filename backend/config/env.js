'use strict';

// Loads backend/.env locally. On Vercel the variables come from project settings.
require('dotenv').config({ quiet: true });

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toList = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

module.exports = Object.freeze({
  nodeEnv,
  isProduction,
  port: toPositiveInt(process.env.PORT, 5000),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModels: toList(process.env.GEMINI_MODELS),
  allowedOrigins: toList(process.env.ALLOWED_ORIGINS),
  logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  rateLimit: Object.freeze({
    windowMs: toPositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toPositiveInt(process.env.RATE_LIMIT_MAX, 100),
    aiMax: toPositiveInt(process.env.AI_RATE_LIMIT_MAX, 30),
  }),
});

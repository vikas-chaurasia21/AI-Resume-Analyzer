'use strict';

// Local / always-on entrypoint. Vercel uses api/index.js instead.

const app = require('./index');
const env = require('./config/env');
const logger = require('./utils/logger');

if (!env.geminiApiKey) {
  logger.warn('config.missing_gemini_key', { hint: 'Set GEMINI_API_KEY in backend/.env. AI endpoints will fail until then.' });
}

const server = app.listen(env.port, () => {
  logger.info('server.started', { port: env.port, environment: env.nodeEnv });
});

function shutdown(signal) {
  logger.info('server.stopping', { signal });
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

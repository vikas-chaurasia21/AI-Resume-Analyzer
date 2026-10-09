'use strict';

const cors = require('cors');
const env = require('../config/env');

/**
 * Allowed browser origins come from ALLOWED_ORIGINS. In development an empty
 * list allows everything; in production an empty list allows no browser origin.
 * Requests without an Origin header (curl, server-to-server) are not CORS requests.
 */
function isOriginAllowed(origin) {
  if (!origin) return true;
  if (env.allowedOrigins.length > 0) return env.allowedOrigins.includes(origin);
  return !env.isProduction;
}

const corsMiddleware = cors({
  origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 600,
});

module.exports = { corsMiddleware, isOriginAllowed };

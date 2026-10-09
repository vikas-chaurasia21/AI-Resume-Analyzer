'use strict';

const env = require('../config/env');

const LEVELS = { silent: -1, error: 0, warn: 1, info: 2, debug: 3 };
const threshold = LEVELS[env.logLevel] ?? LEVELS.info;

const serializeError = (error) => ({
  name: error.name,
  message: error.message,
  code: error.code,
  stack: error.stack,
});

function formatPretty(entry) {
  const { timestamp, level, message, error, ...meta } = entry;
  const extra = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  const stack = error ? `\n${error.stack || error.message}` : '';
  return `${timestamp} ${level.toUpperCase().padEnd(5)} ${message}${extra}${stack}`;
}

function write(level, message, meta = {}) {
  if (LEVELS[level] > threshold) return;

  const { error, ...rest } = meta;
  const entry = { timestamp: new Date().toISOString(), level, message, ...rest };
  if (error) entry.error = serializeError(error);

  const line = env.isProduction ? JSON.stringify(entry) : formatPretty(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

// Never pass resume text in `meta`: it is personal data. Log lengths instead.
module.exports = {
  error: (message, meta) => write('error', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  info: (message, meta) => write('info', message, meta),
  debug: (message, meta) => write('debug', message, meta),
};

'use strict';

const env = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function notFoundHandler(req, res, next) {
  next(new AppError('Route not found.', 404, 'NOT_FOUND'));
}

/** Maps framework/body-parser errors to safe AppErrors; unknown errors become a generic 500. */
function toAppError(error) {
  if (error instanceof AppError) return error;

  if (error.type === 'entity.parse.failed') {
    return new AppError('Request body contains invalid JSON.', 400, 'INVALID_JSON');
  }
  if (error.type === 'entity.too.large') {
    return new AppError('Request body is too large.', 413, 'PAYLOAD_TOO_LARGE');
  }
  if (error.status >= 400 && error.status < 500) {
    return new AppError('Invalid request.', error.status, 'INVALID_REQUEST');
  }
  return new AppError('An unexpected error occurred.', 500, 'INTERNAL_ERROR');
}

// Express recognizes error handlers by their 4-argument signature.
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const appError = toAppError(error);
  const logMethod = appError.statusCode >= 500 ? 'error' : 'warn';
  logger[logMethod]('request.failed', {
    method: req.method,
    path: req.path,
    status: appError.statusCode,
    code: appError.code,
    error,
  });

  const body = { success: false, error: { message: appError.message, code: appError.code } };
  if (!env.isProduction && appError.details) body.error.details = appError.details;

  return res.status(appError.statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler, toAppError };

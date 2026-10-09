'use strict';

const AppError = require('../utils/AppError');
const { validateResumeRequest } = require('../validators/resumeValidator');

/** Validates req.body and exposes the sanitized values as req.validated. */
function validateResume(req, res, next) {
  req.validated = validateResumeRequest(req.body);
  next();
}

/** Responds 405 with an Allow header for any method the route does not support. */
function methodNotAllowed(allowedMethods) {
  return (req, res, next) => {
    res.set('Allow', allowedMethods.join(', '));
    next(new AppError(`Method ${req.method} is not allowed on this endpoint.`, 405, 'METHOD_NOT_ALLOWED'));
  };
}

module.exports = { validateResume, methodNotAllowed };

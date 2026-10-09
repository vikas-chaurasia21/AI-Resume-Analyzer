'use strict';

const AppError = require('../utils/AppError');
const { sanitizeText } = require('../utils/helpers');
const { RESUME_LIMITS, MAX_ROLE_NAME_LENGTH } = require('../config/constants');

/**
 * Validates and sanitizes the body shared by all analysis endpoints.
 * Returns { resumeText, targetRole } or throws an AppError (HTTP 4xx).
 */
function validateResumeRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request body must be a JSON object.', 400, 'INVALID_REQUEST');
  }

  const { resumeText, detectedRole } = body;

  if (resumeText === undefined || resumeText === null || (typeof resumeText === 'string' && !resumeText.trim())) {
    throw new AppError('Resume text is required.', 400, 'MISSING_RESUME_TEXT');
  }
  if (typeof resumeText !== 'string') {
    throw new AppError('Resume text must be a string.', 400, 'INVALID_RESUME_TEXT');
  }

  const cleaned = sanitizeText(resumeText);

  if (cleaned.length < RESUME_LIMITS.minChars) {
    throw new AppError('Resume text is too short to analyze.', 400, 'RESUME_TOO_SHORT');
  }
  if (cleaned.length > RESUME_LIMITS.maxChars) {
    throw new AppError(
      `Resume text is too long (maximum ${RESUME_LIMITS.maxChars} characters).`,
      413,
      'RESUME_TOO_LONG',
    );
  }

  const targetRole =
    typeof detectedRole === 'string'
      ? detectedRole.replace(/\s+/g, ' ').trim().slice(0, MAX_ROLE_NAME_LENGTH) || undefined
      : undefined;

  return { resumeText: cleaned, targetRole };
}

module.exports = { validateResumeRequest };

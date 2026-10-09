'use strict';

const gemini = require('../config/gemini');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { retry } = require('../utils/retry');

const RETRYABLE_STATUS_CODES = [429, 503];
const RETRYABLE_MESSAGE_PARTS = ['503', 'overloaded', '429', 'rate limit', 'unavailable'];

/** Temporary failures (overload / rate limit) are worth retrying. */
function isRetryableGeminiError(error) {
  if (error && RETRYABLE_STATUS_CODES.includes(error.status)) return true;
  const message = String((error && error.message) || '').toLowerCase();
  return RETRYABLE_MESSAGE_PARTS.some((part) => message.includes(part));
}

/** Converts any Gemini failure into a client-safe AppError. */
function toAppError(error) {
  if (error instanceof AppError) return error;

  const message = String((error && error.message) || '').toLowerCase();
  const isRateLimited = (error && error.status === 429) || message.includes('429') || message.includes('rate limit');

  if (isRateLimited) {
    return new AppError('The AI service is receiving too many requests. Please try again shortly.', 429, 'AI_RATE_LIMITED');
  }
  if (isRetryableGeminiError(error)) {
    return new AppError('The AI service is currently busy (high demand). Please try again in a few seconds.', 503, 'AI_UNAVAILABLE');
  }
  return new AppError('The AI service could not process this request.', 502, 'AI_UPSTREAM_ERROR');
}

async function callModel(client, modelName, prompt, { json }) {
  const model = client.getGenerativeModel({
    model: modelName,
    ...(json && { generationConfig: { responseMimeType: 'application/json' } }),
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text || !text.trim()) {
    throw new AppError('The AI returned an empty response.', 502, 'AI_EMPTY_RESPONSE');
  }
  return text;
}

/**
 * Generates text with retry per model and fallback across models.
 * Each model gets `maxAttemptsPerModel` tries for temporary errors; any final
 * failure moves on to the next model. Throws an AppError when all models fail.
 *
 * @param {string} prompt
 * @param {{ json?: boolean }} [options] json: ask Gemini to answer with JSON only
 */
async function generateText(prompt, { json = false } = {}) {
  const client = gemini.getGeminiClient();
  let lastError;

  for (const modelName of gemini.models) {
    try {
      const text = await retry(() => callModel(client, modelName, prompt, { json }), {
        maxAttempts: gemini.maxAttemptsPerModel,
        baseDelayMs: gemini.retryBaseDelayMs,
        shouldRetry: isRetryableGeminiError,
        onRetry: ({ attempt, delayMs, error }) =>
          logger.warn('gemini.retry', { model: modelName, attempt, delayMs, reason: error.message }),
      });

      logger.info('gemini.success', { model: modelName });
      return text;
    } catch (error) {
      lastError = error;
      logger.warn('gemini.model_failed', { model: modelName, error });
    }
  }

  throw toAppError(lastError);
}

module.exports = { generateText, isRetryableGeminiError, toAppError };

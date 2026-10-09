'use strict';

const { sleep } = require('./helpers');

/**
 * Runs `fn` up to `maxAttempts` times with linear backoff
 * (baseDelayMs, 2x, 3x...). Stops immediately when `shouldRetry` returns false.
 */
async function retry(fn, { maxAttempts = 3, baseDelayMs = 1500, shouldRetry = () => true, onRetry } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !shouldRetry(error)) throw error;

      const delayMs = baseDelayMs * attempt;
      if (onRetry) onRetry({ attempt, delayMs, error });
      await sleep(delayMs);
    }
  }

  throw lastError;
}

module.exports = { retry };

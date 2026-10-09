'use strict';

const AppError = require('./AppError');

const stripCodeFences = (text) => text.replace(/```(?:json)?/gi, '').trim();

function tryParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Parses JSON from an LLM reply, tolerating code fences and surrounding prose. */
function parseJsonResponse(rawText) {
  const cleaned = stripCodeFences(String(rawText || ''));

  const direct = tryParse(cleaned);
  if (direct !== undefined) return direct;

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    const extracted = tryParse(cleaned.slice(start, end + 1));
    if (extracted !== undefined) return extracted;
  }

  throw new AppError('The AI returned a response that could not be read. Please try again.', 502, 'AI_INVALID_JSON');
}

module.exports = { parseJsonResponse };

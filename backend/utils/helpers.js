'use strict';

const { AI_LIST_LIMITS } = require('../config/constants');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

/** Lowercases and treats hyphens/underscores/extra spaces as one space. */
function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Keeps only short, non-empty, unique strings. Used on untrusted AI output. */
function toCleanStringArray(value, options = {}) {
  const { maxItems = AI_LIST_LIMITS.maxItems, maxItemLength = AI_LIST_LIMITS.maxItemLength } = options;
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const result = [];

  for (const item of value) {
    if (typeof item !== 'string') continue;
    const cleaned = item.replace(/\s+/g, ' ').trim();
    const key = cleaned.toLowerCase();
    if (!cleaned || cleaned.length > maxItemLength || seen.has(key)) continue;

    seen.add(key);
    result.push(cleaned);
    if (result.length >= maxItems) break;
  }

  return result;
}

/** Removes control characters and normalizes line endings and blank lines. */
function sanitizeText(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { sleep, sendSuccess, normalizeKey, escapeRegExp, toCleanStringArray, sanitizeText };

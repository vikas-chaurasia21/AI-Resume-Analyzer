'use strict';

const env = require('./env');
const AppError = require('../utils/AppError');

const DEFAULT_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

let client = null;

// Created lazily so the module can be imported without the SDK or a key
// (tests, health checks) and so a missing key yields a clean API error.
function getGeminiClient() {
  if (!env.geminiApiKey) {
    throw new AppError('AI service is not configured.', 500, 'CONFIG_ERROR');
  }
  if (!client) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    client = new GoogleGenerativeAI(env.geminiApiKey);
  }
  return client;
}

module.exports = {
  // Tried in order; the next model is used when one fails after its retries.
  models: env.geminiModels.length > 0 ? env.geminiModels : DEFAULT_MODELS,
  maxAttemptsPerModel: 3,
  retryBaseDelayMs: 1500,
  getGeminiClient,
};

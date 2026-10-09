'use strict';

process.env.LOG_LEVEL = 'silent';
const test = require('node:test');
const assert = require('node:assert/strict');
const gemini = require('../config/gemini');
const geminiService = require('../services/geminiService');
const { retry } = require('../utils/retry');
const { parseJsonResponse } = require('../utils/jsonParser');

function fakeClient(behaviorByModel, calls) {
  return {
    getGenerativeModel: ({ model }) => ({
      generateContent: async () => {
        calls.push(model);
        return { response: { text: () => behaviorByModel[model]() } };
      },
    }),
  };
}

test('falls back to the next model when one fails', async (t) => {
  const calls = [];
  const client = fakeClient(
    {
      'gemini-2.5-flash': () => { throw new Error('model not found'); },
      'gemini-2.0-flash': () => 'hello from 2.0',
      'gemini-1.5-flash': () => 'unused',
    },
    calls,
  );
  t.mock.method(gemini, 'getGeminiClient', () => client);

  assert.equal(await geminiService.generateText('prompt'), 'hello from 2.0');
  assert.deepEqual(calls, ['gemini-2.5-flash', 'gemini-2.0-flash']);
});

test('default model chain is preserved', () => {
  assert.deepEqual(gemini.models, ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']);
});

test('classifies retryable errors and maps them to safe API errors', () => {
  const { isRetryableGeminiError, toAppError } = geminiService;
  assert.equal(isRetryableGeminiError(new Error('[503 Service Unavailable] overloaded')), true);
  assert.equal(isRetryableGeminiError({ status: 429, message: 'x' }), true);
  assert.equal(isRetryableGeminiError(new Error('invalid argument')), false);

  assert.equal(toAppError({ status: 429, message: 'quota' }).code, 'AI_RATE_LIMITED');
  assert.equal(toAppError(new Error('503 overloaded')).code, 'AI_UNAVAILABLE');
  const generic = toAppError(new Error('secret internal detail'));
  assert.equal(generic.code, 'AI_UPSTREAM_ERROR');
  assert.ok(!generic.message.includes('secret'));
});

test('retry retries only while allowed, with backoff', async () => {
  let attempts = 0;
  const value = await retry(
    async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('503');
      return 'ok';
    },
    { maxAttempts: 3, baseDelayMs: 1 },
  );
  assert.equal(value, 'ok');
  assert.equal(attempts, 3);

  let calls = 0;
  await assert.rejects(
    retry(async () => { calls += 1; throw new Error('fatal'); }, { maxAttempts: 3, baseDelayMs: 1, shouldRetry: () => false }),
    /fatal/,
  );
  assert.equal(calls, 1);
});

test('parseJsonResponse handles fences and surrounding prose', () => {
  assert.deepEqual(parseJsonResponse('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseJsonResponse('Here you go: {"a":1} Hope it helps'), { a: 1 });
  assert.throws(() => parseJsonResponse('no json'), { code: 'AI_INVALID_JSON' });
});

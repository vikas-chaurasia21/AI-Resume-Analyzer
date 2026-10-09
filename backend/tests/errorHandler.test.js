'use strict';

process.env.LOG_LEVEL = 'silent';
process.env.NODE_ENV = 'production';
const test = require('node:test');
const assert = require('node:assert/strict');
const { errorHandler } = require('../middleware/errorHandler');
const AppError = require('../utils/AppError');

function run(error) {
  const res = {
    headersSent: false,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  errorHandler(error, { method: 'POST', path: '/api/x' }, res, () => {});
  return res;
}

test('returns the consistent error shape for AppErrors', () => {
  const res = run(new AppError('Nope', 400, 'BAD'));
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { success: false, error: { message: 'Nope', code: 'BAD' } });
});

test('hides internals of unexpected errors', () => {
  const res = run(new Error('db password is hunter2'));
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error.code, 'INTERNAL_ERROR');
  assert.ok(!JSON.stringify(res.body).includes('hunter2'));
});

test('maps body-parser errors', () => {
  assert.equal(run(Object.assign(new Error('x'), { type: 'entity.parse.failed', status: 400 })).body.error.code, 'INVALID_JSON');
  assert.equal(run(Object.assign(new Error('x'), { type: 'entity.too.large', status: 413 })).statusCode, 413);
});

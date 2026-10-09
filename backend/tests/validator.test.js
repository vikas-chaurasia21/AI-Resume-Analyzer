'use strict';

process.env.LOG_LEVEL = 'silent';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateResumeRequest } = require('../validators/resumeValidator');
const { RESUME_LIMITS } = require('../config/constants');

const codeOf = (body) => {
  try {
    validateResumeRequest(body);
    return null;
  } catch (error) {
    return error.code;
  }
};

test('rejects bad bodies and missing text', () => {
  assert.equal(codeOf(undefined), 'INVALID_REQUEST');
  assert.equal(codeOf([]), 'INVALID_REQUEST');
  assert.equal(codeOf({}), 'MISSING_RESUME_TEXT');
  assert.equal(codeOf({ resumeText: '   ' }), 'MISSING_RESUME_TEXT');
});

test('rejects wrong types and bad lengths', () => {
  assert.equal(codeOf({ resumeText: 123 }), 'INVALID_RESUME_TEXT');
  assert.equal(codeOf({ resumeText: { a: 1 } }), 'INVALID_RESUME_TEXT');
  assert.equal(codeOf({ resumeText: 'too short' }), 'RESUME_TOO_SHORT');
  assert.equal(codeOf({ resumeText: 'a'.repeat(RESUME_LIMITS.maxChars + 1) }), 'RESUME_TOO_LONG');
});

test('sanitizes valid text and optional role', () => {
  const result = validateResumeRequest({
    resumeText: 'Line one\u0000 of a resume\r\n\r\n\r\n\r\nLine two is here',
    detectedRole: '  Data   Analyst ',
  });
  assert.equal(result.resumeText, 'Line one  of a resume\n\nLine two is here');
  assert.equal(result.targetRole, 'Data Analyst');
});

test('ignores a non-string role', () => {
  const result = validateResumeRequest({ resumeText: 'a valid resume text here', detectedRole: { x: 1 } });
  assert.equal(result.targetRole, undefined);
});

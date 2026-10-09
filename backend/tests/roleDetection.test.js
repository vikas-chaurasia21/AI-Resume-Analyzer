'use strict';

process.env.LOG_LEVEL = 'silent';
const test = require('node:test');
const assert = require('node:assert/strict');
const geminiService = require('../services/geminiService');
const roleDetection = require('../services/roleDetectionService');

const validReply = {
  detectedRole: 'Backend Developer',
  confidence: 88,
  confidenceLevel: 'ignored',
  alternativeRoles: ['Software Engineer', 'backend developer', 'Software Engineer', 42],
  reason: 'Node and SQL projects.',
  skills: ['Node', 'SQL'],
  importantSections: ['Projects'],
  actionWords: ['Built'],
  atsKeywords: ['REST'],
};

test('normalizeConfidence clamps, rounds and coerces', () => {
  const { normalizeConfidence } = roleDetection;
  assert.equal(normalizeConfidence(87.6), 88);
  assert.equal(normalizeConfidence(150), 100);
  assert.equal(normalizeConfidence(-5), 0);
  assert.equal(normalizeConfidence('85%'), 85);
  assert.equal(normalizeConfidence(0.85), 85);
  assert.equal(normalizeConfidence('high'), null);
  assert.equal(normalizeConfidence(NaN), null);
  assert.equal(normalizeConfidence(undefined), null);
});

test('getConfidenceLevel uses 90/75/60 thresholds', () => {
  const { getConfidenceLevel } = roleDetection;
  assert.equal(getConfidenceLevel(100), 'Very High');
  assert.equal(getConfidenceLevel(90), 'Very High');
  assert.equal(getConfidenceLevel(89), 'High');
  assert.equal(getConfidenceLevel(75), 'High');
  assert.equal(getConfidenceLevel(74), 'Moderate');
  assert.equal(getConfidenceLevel(60), 'Moderate');
  assert.equal(getConfidenceLevel(59), 'Low');
  assert.equal(getConfidenceLevel(0), 'Low');
});

test('normalizeRoleResponse computes level itself and cleans lists', () => {
  const result = roleDetection.normalizeRoleResponse(validReply);
  assert.equal(result.confidenceLevel, 'High');
  assert.equal(result.confidenceType, 'ai-estimated');
  assert.deepEqual(result.alternativeRoles, ['Software Engineer']);
});

test('normalizeRoleResponse rejects malformed replies', () => {
  const { normalizeRoleResponse } = roleDetection;
  for (const bad of [null, [], 'text', {}, { detectedRole: 'X' }, { detectedRole: '', confidence: 50 }, { detectedRole: 'X', confidence: 'n/a' }]) {
    assert.throws(() => normalizeRoleResponse(bad), { code: 'AI_INVALID_ROLE_RESPONSE' });
  }
});

test('detectRole parses a fenced JSON reply from Gemini', async (t) => {
  t.mock.method(geminiService, 'generateText', async () => '```json\n' + JSON.stringify(validReply) + '\n```');
  const result = await roleDetection.detectRole('resume text');
  assert.equal(result.detectedRole, 'Backend Developer');
});

test('detectRole fails cleanly on non-JSON replies', async (t) => {
  t.mock.method(geminiService, 'generateText', async () => 'Sorry, I cannot do that.');
  await assert.rejects(roleDetection.detectRole('resume text'), { code: 'AI_INVALID_JSON', statusCode: 502 });
});

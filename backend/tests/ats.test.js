'use strict';

process.env.LOG_LEVEL = 'silent';
const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeResume, matchTerms, calculateScores } = require('../services/atsService');

test('matches whole words only', () => {
  const { found } = matchTerms('Experienced in JavaScript and many projects', ['Java', 'JavaScript', 'OS']);
  assert.deepEqual(found, ['JavaScript']);
});

test('matches aliases and punctuation-heavy terms', () => {
  const text = 'Built APIs with Node.js, MySQL and C++. Studied Operating Systems.';
  const { found, missing } = matchTerms(text, ['Node', 'SQL', 'C++', 'OS', 'Docker']);
  assert.deepEqual(found, ['Node', 'SQL', 'C++', 'OS']);
  assert.deepEqual(missing, ['Docker']);
});

test('multi-word terms tolerate irregular whitespace', () => {
  assert.deepEqual(matchTerms('Tools: Power   BI', ['Power BI']).found, ['Power BI']);
});

test('applies 50/30/20 weights', () => {
  const profile = { skills: ['Java', 'JavaScript'], sections: ['Education', 'Skills'], actionWords: ['Built', 'Led'] };
  const result = analyzeResume('Education: BTech. Skills: JavaScript. Built apps.', profile);

  assert.equal(result.skillScore, 25);
  assert.equal(result.sectionScore, 30);
  assert.equal(result.actionScore, 10);
  assert.equal(result.atsScore, 65);
  assert.deepEqual(result.foundSkills, ['JavaScript']);
  assert.deepEqual(result.missingSkills, ['Java']);
  assert.deepEqual(result.missingActionWords, ['Led']);
});

test('empty profile lists score zero without NaN', () => {
  const result = analyzeResume('Some resume text here', { skills: [], sections: [], actionWords: [] });
  assert.equal(result.atsScore, 0);
});

test('perfect coverage is 100', () => {
  const scores = calculateScores({
    skills: { found: 4, total: 4 },
    sections: { found: 5, total: 5 },
    actions: { found: 3, total: 3 },
  });
  assert.equal(scores.atsScore, 100);
});

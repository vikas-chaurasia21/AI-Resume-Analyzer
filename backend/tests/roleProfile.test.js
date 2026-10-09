'use strict';

process.env.LOG_LEVEL = 'silent';
const test = require('node:test');
const assert = require('node:assert/strict');
const { findRoleProfile, getSupportedRoles } = require('../profiles/roleProfile');

test('preserves the five curated roles', () => {
  assert.deepEqual(getSupportedRoles(), [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Data Analyst',
    'Electrical Engineer',
  ]);
});

test('finds roles case-insensitively and by alias', () => {
  assert.equal(findRoleProfile('data analyst').roleName, 'Data Analyst');
  assert.equal(findRoleProfile('SDE').roleName, 'Software Engineer');
  assert.equal(findRoleProfile('Software Developer').roleName, 'Software Engineer');
  assert.equal(findRoleProfile('Front-End Developer').roleName, 'Frontend Developer');
  assert.equal(findRoleProfile('  backend   engineer ').roleName, 'Backend Developer');
  assert.equal(findRoleProfile('Electrical Engineering').roleName, 'Electrical Engineer');
});

test('returns null for unknown or empty roles', () => {
  assert.equal(findRoleProfile('Product Manager'), null);
  assert.equal(findRoleProfile(''), null);
  assert.equal(findRoleProfile(undefined), null);
});

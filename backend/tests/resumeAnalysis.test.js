'use strict';

process.env.LOG_LEVEL = 'silent';
const test = require('node:test');
const assert = require('node:assert/strict');
const roleDetectionService = require('../services/roleDetectionService');
const resumeAnalysis = require('../services/resumeAnalysisService');

const baseRole = {
  detectedRole: 'Frontend Developer',
  confidence: 80,
  confidenceLevel: 'High',
  confidenceType: 'ai-estimated',
  alternativeRoles: [],
  reason: 'r',
  skills: [],
  importantSections: [],
  actionWords: [],
  atsKeywords: [],
};

const RESUME = 'Education\nSkills: HTML, CSS, JavaScript, React, Git\nProjects: Built a dashboard. Developed a UI.';

test('uses the curated profile when the role is known', async (t) => {
  t.mock.method(roleDetectionService, 'detectRole', async () => ({ ...baseRole, detectedRole: 'front-end developer' }));
  const result = await resumeAnalysis.analyzeResume(RESUME);

  assert.equal(result.normalizedRole, 'Frontend Developer');
  assert.equal(result.profileSource, 'curated');
  assert.equal(result.roleProfileFound, true);
  assert.deepEqual(result.ats.foundSkills, ['HTML', 'CSS', 'JavaScript', 'React', 'Git']);
  assert.ok(result.ats.missingSkills.includes('Redux'));
  assert.ok(result.roleKeywords.length > 0);
});

test('builds an AI-generated profile for unknown roles', async (t) => {
  t.mock.method(roleDetectionService, 'detectRole', async () => ({
    ...baseRole,
    detectedRole: 'Product Manager',
    skills: ['Roadmapping', 'JavaScript'],
    atsKeywords: ['stakeholders'],
  }));
  const result = await resumeAnalysis.analyzeResume(RESUME);

  assert.equal(result.profileSource, 'ai-generated');
  assert.equal(result.roleProfileFound, false);
  assert.deepEqual(result.roleProfile.skills, ['Roadmapping', 'JavaScript']);
  assert.deepEqual(result.roleProfile.sections, ['Education', 'Experience', 'Projects', 'Skills', 'Certifications']);
  assert.deepEqual(result.ats.foundSkills, ['JavaScript']);
  assert.deepEqual(result.roleKeywords, ['stakeholders']);
});

test('response contains every required ATS field', async (t) => {
  t.mock.method(roleDetectionService, 'detectRole', async () => baseRole);
  const { ats } = await resumeAnalysis.analyzeResume(RESUME);
  for (const key of [
    'atsScore', 'skillScore', 'sectionScore', 'actionScore', 'foundSkills', 'missingSkills',
    'foundSections', 'missingSections', 'foundActionWords', 'missingActionWords',
  ]) {
    assert.ok(key in ats, `missing ${key}`);
  }
});

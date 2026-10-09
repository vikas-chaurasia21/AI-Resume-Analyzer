'use strict';

const roleDetectionService = require('./roleDetectionService');
const atsService = require('./atsService');
const { findRoleProfile, DEFAULT_SECTIONS, DEFAULT_ACTION_WORDS } = require('../profiles/roleProfile');
const { PROFILE_SOURCE } = require('../config/constants');

/** Profile for roles without a curated entry, built from the AI's own output. */
function buildFallbackProfile(role) {
  return {
    skills: role.skills,
    sections: role.importantSections.length > 0 ? role.importantSections : DEFAULT_SECTIONS,
    actionWords: role.actionWords.length > 0 ? role.actionWords : DEFAULT_ACTION_WORDS,
    keywords: role.atsKeywords,
  };
}

/** Prefers the curated profile; falls back to an AI-generated one. */
function resolveRoleProfile(role) {
  const curated = findRoleProfile(role.detectedRole);

  if (curated) {
    return { roleName: curated.roleName, profile: curated.profile, profileSource: PROFILE_SOURCE.CURATED };
  }
  return {
    roleName: role.detectedRole,
    profile: buildFallbackProfile(role),
    profileSource: PROFILE_SOURCE.AI_GENERATED,
  };
}

/**
 * Full pipeline: detect role -> pick profile -> deterministic role-specific ATS.
 * AI feedback is requested separately (see aiFeedbackService).
 */
async function analyzeResume(resumeText) {
  const role = await roleDetectionService.detectRole(resumeText);
  const { roleName, profile, profileSource } = resolveRoleProfile(role);
  const ats = atsService.analyzeResume(resumeText, profile);

  return {
    detectedRole: role.detectedRole,
    normalizedRole: roleName,
    confidence: role.confidence,
    confidenceLevel: role.confidenceLevel,
    confidenceType: role.confidenceType,
    alternativeRoles: role.alternativeRoles,
    reason: role.reason,
    roleProfileFound: profileSource === PROFILE_SOURCE.CURATED,
    profileSource,
    roleProfile: {
      skills: profile.skills,
      sections: profile.sections,
      actionWords: profile.actionWords,
    },
    roleKeywords: role.atsKeywords.length > 0 ? role.atsKeywords : profile.keywords || [],
    ats,
  };
}

module.exports = { analyzeResume, resolveRoleProfile, buildFallbackProfile };

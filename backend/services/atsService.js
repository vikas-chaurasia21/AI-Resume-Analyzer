'use strict';

/**
 * Deterministic, explainable ATS scoring. No AI is involved.
 *   score = skills coverage * 50 + sections coverage * 30 + action-word coverage * 20
 */

const { SCORING_WEIGHTS } = require('../config/constants');
const { escapeRegExp } = require('../utils/helpers');
const { getTermAliases } = require('../profiles/roleProfile');

/**
 * Whole-word, case-insensitive pattern for a term and its aliases.
 * Plain substring matching would make "OS" match "projects" and "Java" match "JavaScript".
 */
function buildTermPattern(term) {
  const variants = [term, ...getTermAliases(term)].map((variant) =>
    escapeRegExp(variant.trim()).replace(/\s+/g, '\\s+'),
  );
  return new RegExp(`(?<![a-z0-9])(?:${variants.join('|')})(?![a-z0-9])`, 'i');
}

function matchTerms(text, terms) {
  const found = [];
  const missing = [];

  for (const term of terms) {
    (buildTermPattern(term).test(text) ? found : missing).push(term);
  }

  return { found, missing };
}

const cleanTerms = (list) => (Array.isArray(list) ? list.filter((t) => typeof t === 'string' && t.trim()) : []);

const weightedCoverage = (found, total, weight) => (total > 0 ? (found / total) * weight : 0);

/** Each argument is { found, total }. The overall score is rounded once from the unrounded parts. */
function calculateScores({ skills, sections, actions }) {
  const skillScore = weightedCoverage(skills.found, skills.total, SCORING_WEIGHTS.skills);
  const sectionScore = weightedCoverage(sections.found, sections.total, SCORING_WEIGHTS.sections);
  const actionScore = weightedCoverage(actions.found, actions.total, SCORING_WEIGHTS.actions);

  return {
    atsScore: Math.round(skillScore + sectionScore + actionScore),
    skillScore: Math.round(skillScore),
    sectionScore: Math.round(sectionScore),
    actionScore: Math.round(actionScore),
  };
}

/** @param {{ skills: string[], sections: string[], actionWords: string[] }} profile */
function analyzeResume(resumeText, profile) {
  const skills = matchTerms(resumeText, cleanTerms(profile.skills));
  const sections = matchTerms(resumeText, cleanTerms(profile.sections));
  const actions = matchTerms(resumeText, cleanTerms(profile.actionWords));

  const scores = calculateScores({
    skills: { found: skills.found.length, total: skills.found.length + skills.missing.length },
    sections: { found: sections.found.length, total: sections.found.length + sections.missing.length },
    actions: { found: actions.found.length, total: actions.found.length + actions.missing.length },
  });

  return {
    ...scores,
    foundSkills: skills.found,
    missingSkills: skills.missing,
    foundSections: sections.found,
    missingSections: sections.missing,
    foundActionWords: actions.found,
    missingActionWords: actions.missing,
  };
}

module.exports = { analyzeResume, matchTerms, calculateScores };

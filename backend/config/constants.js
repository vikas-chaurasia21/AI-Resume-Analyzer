'use strict';

// ATS weights must add up to 100. Changing them changes every score.
const SCORING_WEIGHTS = Object.freeze({ skills: 50, sections: 30, actions: 20 });

// Ordered from highest to lowest threshold.
const CONFIDENCE_LEVELS = Object.freeze([
  { min: 90, label: 'Very High' },
  { min: 75, label: 'High' },
  { min: 60, label: 'Moderate' },
  { min: 0, label: 'Low' },
]);

const RESUME_LIMITS = Object.freeze({ minChars: 20, maxChars: 30000 });
const REQUEST_BODY_LIMIT = '200kb';

const MAX_ROLE_NAME_LENGTH = 100;
const MAX_REASON_LENGTH = 500;
const AI_LIST_LIMITS = Object.freeze({ maxItems: 30, maxItemLength: 80 });
const MAX_ALTERNATIVE_ROLES = 5;

const PROFILE_SOURCE = Object.freeze({ CURATED: 'curated', AI_GENERATED: 'ai-generated' });

module.exports = {
  SCORING_WEIGHTS,
  CONFIDENCE_LEVELS,
  RESUME_LIMITS,
  REQUEST_BODY_LIMIT,
  MAX_ROLE_NAME_LENGTH,
  MAX_REASON_LENGTH,
  AI_LIST_LIMITS,
  MAX_ALTERNATIVE_ROLES,
  PROFILE_SOURCE,
};

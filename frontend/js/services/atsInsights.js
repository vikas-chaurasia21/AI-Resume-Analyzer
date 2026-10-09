const GOOD_SKILL_COVERAGE = 0.6;
const GOOD_ACTION_WORD_COVERAGE = 0.5;
const MAX_SUGGESTED_ITEMS = 5;

/**
 * Plain-language strengths, weaknesses and suggestions derived only from the
 * deterministic ATS result (no AI), so they always agree with the score.
 */
export function buildInsights(ats, roleName) {
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  const totalSkills = ats.foundSkills.length + ats.missingSkills.length;
  if (totalSkills > 0) {
    const summary = `${ats.foundSkills.length} of ${totalSkills} key ${roleName} skills`;
    if (ats.foundSkills.length / totalSkills >= GOOD_SKILL_COVERAGE) strengths.push(`Covers ${summary}.`);
    else weaknesses.push(`Only ${summary} were found.`);
  }
  if (ats.missingSkills.length > 0) {
    suggestions.push(`If you have experience with them, mention: ${ats.missingSkills.slice(0, MAX_SUGGESTED_ITEMS).join(', ')}.`);
  }

  if (ats.foundSections.length > 0) strengths.push(`Includes sections: ${ats.foundSections.join(', ')}.`);
  if (ats.missingSections.length > 0) {
    weaknesses.push(`Missing sections: ${ats.missingSections.join(', ')}.`);
    suggestions.push(`Add a section for: ${ats.missingSections.join(', ')}.`);
  }

  const totalActionWords = ats.foundActionWords.length + ats.missingActionWords.length;
  if (totalActionWords > 0) {
    if (ats.foundActionWords.length / totalActionWords >= GOOD_ACTION_WORD_COVERAGE) {
      strengths.push(`Uses strong action verbs (${ats.foundActionWords.length} found).`);
    } else {
      weaknesses.push('Few strong action verbs were found.');
      suggestions.push(`Start bullet points with action verbs such as ${ats.missingActionWords.slice(0, 4).join(', ')}.`);
    }
  }

  if (suggestions.length === 0) suggestions.push('Great! Your resume covers the key areas for this role.');

  return { strengths, weaknesses, suggestions };
}

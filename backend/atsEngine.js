function detectSkills(resumeText, skills) {
    const text = resumeText.toLowerCase();

    return skills.filter((skill) =>
        text.includes(skill.toLowerCase())
    );
}

function detectSections(resumeText, sections) {
    const text = resumeText.toLowerCase();

    const foundSections = [];
    const missingSections = [];

    for (const section of sections) {
        if (text.includes(section.toLowerCase())) {
            foundSections.push(section);
        } else {
            missingSections.push(section);
        }
    }

    return {
        foundSections,
        missingSections
    };
}

function detectActionWords(resumeText, actionWords) {
    const text = resumeText.toLowerCase();

    return actionWords.filter((word) =>
        text.includes(word.toLowerCase())
    );
}

function generateATSScore(
    foundSkills,
    foundSections,
    foundActionWords,
    profile
) {
    const totalSkills = profile.skills.length;
    const totalSections = profile.sections.length;
    const totalActionWords = profile.actionWords.length;

    const skillScore =
        totalSkills > 0
            ? (foundSkills.length / totalSkills) * 50
            : 0;

    const sectionScore =
        totalSections > 0
            ? (foundSections.length / totalSections) * 30
            : 0;

    const actionScore =
        totalActionWords > 0
            ? (foundActionWords.length / totalActionWords) * 20
            : 0;

    const atsScore =
        skillScore +
        sectionScore +
        actionScore;

    return {
        atsScore: Math.round(atsScore),
        skillScore: Math.round(skillScore),
        sectionScore: Math.round(sectionScore),
        actionScore: Math.round(actionScore)
    };
}

function analyzeResumeForRole(
  resumeText,
  profile
) {
  const foundSkills = detectSkills(
    resumeText,
    profile.skills
  );

  const sectionResult = detectSections(
    resumeText,
    profile.sections
  );

  const foundActionWords =
    detectActionWords(
      resumeText,
      profile.actionWords
    );

  const score =
    generateATSScore(
      foundSkills,
      sectionResult.foundSections,
      foundActionWords,
      profile
    );

  return {
    foundSkills,
    foundSections:
      sectionResult.foundSections,
    missingSections:
      sectionResult.missingSections,
    foundActionWords,
    ...score,
  };
}

module.exports = {
    analyzeResumeForRole
};
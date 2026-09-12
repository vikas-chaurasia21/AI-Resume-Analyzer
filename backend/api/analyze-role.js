const { GoogleGenerativeAI } = require("@google/generative-ai");

const roleProfiles = require("../roleProfiles");
const { analyzeResumeForRole } = require("../atsEngine");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

// ======================================================
// HELPER: SLEEP
// ======================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ======================================================
// HELPER: RETRYABLE ERROR CHECK
// ======================================================

function isRetryableError(error) {
  const message = (error.message || "").toLowerCase();

  return (
    message.includes("503") ||
    message.includes("overloaded") ||
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("unavailable")
  );
}

// ======================================================
// HELPER: CALL GEMINI WITH RETRY
// ======================================================

async function callModelWithRetry(
  modelName,
  prompt,
  maxRetries = 3
) {
  const model = genAI.getGenerativeModel({
    model: modelName,
  });

  let lastError = null;

  for (
    let attempt = 1;
    attempt <= maxRetries;
    attempt++
  ) {
    try {
      console.log(
        `Trying model "${modelName}", attempt ${attempt}...`
      );

      const result =
        await model.generateContent(prompt);

      const response =
        await result.response;

      return response.text();

    } catch (error) {
      lastError = error;

      console.log(
        `Model "${modelName}" attempt ${attempt} failed: ${error.message}`
      );

      if (
        isRetryableError(error) &&
        attempt < maxRetries
      ) {
        const waitTime = attempt * 1500;

        console.log(
          `Waiting ${waitTime}ms before retry...`
        );

        await sleep(waitTime);

        continue;
      }

      if (!isRetryableError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

// ======================================================
// HELPER: GEMINI MODEL FALLBACK
// ======================================================

async function getAIResponseWithFallback(prompt) {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response =
        await callModelWithRetry(
          modelName,
          prompt,
          3
        );

      console.log(
        `Success with model: ${modelName}`
      );

      return response;

    } catch (error) {
      lastError = error;

      console.log(
        `Model "${modelName}" failed. Trying next model...`
      );
    }
  }

  throw lastError;
}

// ======================================================
// HELPER: CLEAN JSON RESPONSE
// ======================================================

function cleanJSON(text) {
  let cleaned = text.trim();

  cleaned = cleaned.replace(
    /```json/gi,
    ""
  );

  cleaned = cleaned.replace(
    /```/g,
    ""
  );

  return cleaned.trim();
}

// ======================================================
// HELPER: ROLE PROFILE LOOKUP
// ======================================================

function getRoleProfile(detectedRole) {
  if (!detectedRole) {
    return null;
  }

  const role =
    detectedRole
      .toLowerCase()
      .trim();

  // ====================================================
  // Direct exact matching
  // ====================================================

  for (const profileRole in roleProfiles) {
    if (
      profileRole.toLowerCase() === role
    ) {
      return {
        roleName: profileRole,
        profile: roleProfiles[profileRole],
      };
    }
  }

  // ====================================================
  // Common aliases
  // ====================================================

  const roleAliases = {
    "software engineer":
      "Software Engineer",

    "software developer":
      "Software Engineer",

    "sde":
      "Software Engineer",

    "frontend developer":
      "Frontend Developer",

    "front end developer":
      "Frontend Developer",

    "frontend engineer":
      "Frontend Developer",

    "backend developer":
      "Backend Developer",

    "back end developer":
      "Backend Developer",

    "backend engineer":
      "Backend Developer",

    "data analyst":
      "Data Analyst",

    "electrical engineer":
      "Electrical Engineer",

    "electrical engineering":
      "Electrical Engineer",
  };

  const matchedRole =
    roleAliases[role];

  if (
    matchedRole &&
    roleProfiles[matchedRole]
  ) {
    return {
      roleName: matchedRole,
      profile:
        roleProfiles[matchedRole],
    };
  }

  return null;
}

// ======================================================
// HELPER: BUILD FALLBACK ROLE PROFILE
// ======================================================
//
// Agar curated profile nahi mila,
// toh AI ke detected skills / sections /
// action words ko temporary profile ke roop mein use karenge.
//
// Isse uncommon roles bhi completely fail nahi honge.
// ======================================================

function buildFallbackProfile(roleData) {
  const skills =
    Array.isArray(roleData.skills)
      ? roleData.skills
      : [];

  const sections =
    Array.isArray(
      roleData.importantSections
    )
      ? roleData.importantSections
      : [
          "Education",
          "Experience",
          "Projects",
          "Skills",
          "Certifications",
        ];

  const actionWords =
    Array.isArray(
      roleData.actionWords
    )
      ? roleData.actionWords
      : [
          "Developed",
          "Designed",
          "Implemented",
          "Managed",
          "Created",
        ];

  return {
    skills,
    sections,
    actionWords,
  };
}

// ======================================================
// HELPER: CONFIDENCE LEVEL
// ======================================================

function getConfidenceLevel(
  confidence
) {
  if (confidence >= 90) {
    return "Very High";
  }

  if (confidence >= 75) {
    return "High";
  }

  if (confidence >= 60) {
    return "Moderate";
  }

  return "Low";
}

// ======================================================
// VERCEL SERVERLESS FUNCTION
//
// POST /api/analyze-role
// ======================================================

module.exports = async function handler(
  req,
  res
) {
  // ====================================================
  // CORS
  // ====================================================

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // ====================================================
  // PRE-FLIGHT
  // ====================================================

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ====================================================
  // ONLY POST ALLOWED
  // ====================================================

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  console.log(
    "========== ROLE ANALYSIS REQUEST =========="
  );

  try {
    // ==================================================
    // GET RESUME TEXT
    // ==================================================

    const resumeText =
      req.body?.resumeText;

    if (!resumeText) {
      return res.status(400).json({
        error:
          "Resume text is required.",
      });
    }

    console.log(
      "Resume text length:",
      resumeText.length
    );

    // ==================================================
    // GEMINI PROMPT
    // ==================================================

    const prompt = `
You are an expert resume analyzer and career-role classifier.

Your task is to identify the MOST LIKELY JOB ROLE represented by this resume.

The resume can belong to ANY professional, technical,
creative, business, engineering or academic role.

Do NOT assume the resume is for software engineering.

Examples include:

Software Engineer
Software Developer
Frontend Developer
Backend Developer
Full Stack Developer
Data Analyst
Data Scientist
Machine Learning Engineer
AI Engineer
DevOps Engineer
Cloud Engineer
Cybersecurity Engineer
QA Engineer
Product Manager
Business Analyst
UI/UX Designer
Financial Analyst
Digital Marketing
HR
Sales
Mechanical Engineer
Civil Engineer
Electrical Engineer
Electronics Engineer
Researcher
Teacher
Consultant
Architect
Operations
etc.

Analyze the ACTUAL resume content.

Look at:

1. Skills
2. Tools
3. Programming languages
4. Projects
5. Work experience
6. Education
7. Certifications
8. Job titles
9. Responsibilities
10. Overall career direction

Determine:

- Most likely role
- Confidence percentage
- Alternative possible roles
- Skills relevant to the detected role
- Important resume sections
- Useful action words
- Important role-related ATS keywords

IMPORTANT:

Do not invent skills that are not supported by the resume.

The "skills" field should contain skills that are relevant
to the detected role.

The "importantSections" field should contain sections that
matter for the detected role.

The "actionWords" field should contain useful action-oriented
words for that role.

Confidence:

90-100 = Very strong evidence
75-89 = Strong evidence
60-74 = Moderate evidence
Below 60 = Weak / uncertain evidence

If the resume is ambiguous, reduce confidence.

Return ONLY valid JSON.

Use exactly this structure:

{
  "detectedRole": "string",
  "confidence": 0,
  "confidenceLevel": "Very High",
  "alternativeRoles": [
    "string",
    "string"
  ],
  "reason": "short explanation",
  "skills": [
    "skill1",
    "skill2"
  ],
  "importantSections": [
    "Education",
    "Experience",
    "Projects",
    "Skills"
  ],
  "actionWords": [
    "Built",
    "Developed",
    "Designed"
  ],
  "atsKeywords": [
    "keyword1",
    "keyword2"
  ]
}

Resume:

${resumeText}
`;

    // ==================================================
    // GEMINI CALL
    // ==================================================

    const rawResponse =
      await getAIResponseWithFallback(
        prompt
      );

    console.log(
      "Raw Gemini role response:",
      rawResponse
    );

    // ==================================================
    // CLEAN RESPONSE
    // ==================================================

    const cleanedResponse =
      cleanJSON(rawResponse);

    // ==================================================
    // PARSE JSON
    // ==================================================

    let roleData;

    try {
      roleData = JSON.parse(
        cleanedResponse
      );
    } catch (error) {
      console.log(
        "JSON parsing failed:",
        error.message
      );

      return res.status(500).json({
        error:
          "AI returned invalid role analysis.",
        rawResponse,
      });
    }

    // ==================================================
    // BASIC VALIDATION
    // ==================================================

    if (
      !roleData.detectedRole ||
      typeof roleData.confidence !==
        "number"
    ) {
      return res.status(500).json({
        error:
          "AI returned incomplete role analysis.",
      });
    }

    // ==================================================
    // NORMALIZE CONFIDENCE
    // ==================================================

    roleData.confidence =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            roleData.confidence
          )
        )
      );

    roleData.confidenceLevel =
      getConfidenceLevel(
        roleData.confidence
      );

    // ==================================================
    // FIND CURATED ROLE PROFILE
    // ==================================================

    const roleProfileResult =
      getRoleProfile(
        roleData.detectedRole
      );

    let roleName;
    let roleProfile;
    let profileSource;

    // ==================================================
    // CURATED PROFILE FOUND
    // ==================================================

    if (roleProfileResult) {
      roleName =
        roleProfileResult.roleName;

      roleProfile =
        roleProfileResult.profile;

      profileSource = "curated";
    }

    // ==================================================
    // CURATED PROFILE NOT FOUND
    // ==================================================
    // Use AI-generated role criteria as fallback.
    // ==================================================

    else {
      roleName =
        roleData.detectedRole;

      roleProfile =
        buildFallbackProfile(
          roleData
        );

      profileSource =
        "ai-generated";
    }

    console.log(
      "Detected Role:",
      roleName
    );

    console.log(
      "Profile Source:",
      profileSource
    );

    console.log(
      "Confidence:",
      roleData.confidence
    );

    // ==================================================
    // ROLE-SPECIFIC ATS
    // ==================================================

    const atsResult =
      analyzeResumeForRole(
        resumeText,
        roleProfile
      );

    // ==================================================
    // MISSING SKILLS
    // ==================================================

    const foundSkillsLower =
      atsResult.foundSkills.map(
        (skill) =>
          skill.toLowerCase()
      );

    const missingSkills =
      roleProfile.skills.filter(
        (skill) =>
          !foundSkillsLower.includes(
            skill.toLowerCase()
          )
      );

    // ==================================================
    // MISSING ACTION WORDS
    // ==================================================

    const foundActionWordsLower =
      atsResult.foundActionWords.map(
        (word) =>
          word.toLowerCase()
      );

    const missingActionWords =
      roleProfile.actionWords.filter(
        (word) =>
          !foundActionWordsLower.includes(
            word.toLowerCase()
          )
      );

    // ==================================================
    // FINAL ROLE ANALYSIS RESPONSE
    // ==================================================

    const finalResponse = {
      detectedRole:
        roleData.detectedRole,

      normalizedRole:
        roleName,

      confidence:
        roleData.confidence,

      confidenceLevel:
        roleData.confidenceLevel,

      alternativeRoles:
        Array.isArray(
          roleData.alternativeRoles
        )
          ? roleData.alternativeRoles
          : [],

      reason:
        roleData.reason ||
        "Role detected from resume content.",

      roleProfileFound:
        Boolean(roleProfileResult),

      profileSource,

      atsAvailable: true,

      roleProfile: {
        skills: roleProfile.skills,
        sections: roleProfile.sections,
        actionWords:
          roleProfile.actionWords,
      },

      roleKeywords:
        Array.isArray(
          roleData.atsKeywords
        )
          ? roleData.atsKeywords
          : [],

      ats: {
        atsScore:
          atsResult.atsScore,

        skillScore:
          atsResult.skillScore,

        sectionScore:
          atsResult.sectionScore,

        actionScore:
          atsResult.actionScore,

        foundSkills:
          atsResult.foundSkills,

        missingSkills,

        foundSections:
          atsResult.foundSections,

        missingSections:
          atsResult.missingSections,

        foundActionWords:
          atsResult.foundActionWords,

        missingActionWords,
      },
    };

    console.log(
      "Final ATS Score:",
      finalResponse.ats.atsScore
    );

    console.log(
      "=============================================="
    );

    return res.status(200).json(
      finalResponse
    );

  } catch (error) {
    console.log(
      "Role Analysis Error:",
      error.message
    );

    const isOverload =
      isRetryableError(error);

    return res.status(500).json({
      error: isOverload
        ? "AI service is currently busy. Please try again in a few seconds."
        : error.message,
    });
  }
};
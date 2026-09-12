// ======================================================
// PDF.JS CONFIGURATION
// ======================================================

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

// ======================================================
// DOM ELEMENTS
// ======================================================

const analyzeBtn = document.querySelector("#analyzeBtn");
const resultBox = document.querySelector("#resultBox");
const resumeFile = document.querySelector("#resumeFile");
const downloadBtn = document.querySelector("#downloadBtn");

// ======================================================
// GLOBAL REPORT TEXT
// ======================================================

let reportText = "";

// ======================================================
// SKILL DETECTION
// ======================================================

function detectSkills(resumeText, skillCategories) {
  const foundSkills = [];
  const foundCategories = [];

  // Case-insensitive comparison
  const text = resumeText.toLowerCase();

  for (const category in skillCategories) {
    let categoryFound = false;

    for (const skill of skillCategories[category]) {
      if (text.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
        categoryFound = true;
      }
    }

    if (categoryFound) {
      foundCategories.push(category);
    }
  }

  return {
    foundSkills,
    foundCategories,
  };
}

// ======================================================
// MISSING SKILLS
// ======================================================

function detectMissingSkills(skillCategories, foundSkills) {
  const missingSkills = [];

  const foundSkillsLower = foundSkills.map((skill) => skill.toLowerCase());

  for (const category in skillCategories) {
    for (const skill of skillCategories[category]) {
      if (!foundSkillsLower.includes(skill.toLowerCase())) {
        missingSkills.push(skill);
      }
    }
  }

  return missingSkills;
}

// ======================================================
// SECTION DETECTION
// ======================================================

function detectSections(resumeText, requiredSections) {
  const foundSections = [];
  const missingSections = [];

  const text = resumeText.toLowerCase();

  for (const section of requiredSections) {
    if (text.includes(section.toLowerCase())) {
      foundSections.push(section);
    } else {
      missingSections.push(section);
    }
  }

  return {
    foundSections,
    missingSections,
  };
}

// ======================================================
// ACTION WORD DETECTION
// ======================================================

function detectActionWords(resumeText, actionWords) {
  const foundActionWords = [];

  const text = resumeText.toLowerCase();

  for (const word of actionWords) {
    if (text.includes(word.toLowerCase())) {
      foundActionWords.push(word);
    }
  }

  return foundActionWords;
}

// ======================================================
// TOTAL SKILL COUNT
// ======================================================

function getTotalSkillCount(skillCategories) {
  let total = 0;

  for (const category in skillCategories) {
    total += skillCategories[category].length;
  }

  return total;
}

// ======================================================
// ATS SCORE
// ======================================================

function generateATSScore(
  foundSkills,
  foundSections,
  foundActionWords,
  skillCategories,
  requiredSections,
  actionWords,
) {
  const totalSkills = getTotalSkillCount(skillCategories);

  const skillScore =
    totalSkills > 0
      ? (foundSkills.length / totalSkills) * 50
      : 0;

  const sectionScore =
    requiredSections.length > 0
      ? (foundSections.length / requiredSections.length) * 35
      : 0;

  const actionScore =
    actionWords.length > 0
      ? (foundActionWords.length / actionWords.length) * 15
      : 0;

  return {
    atsScore: Math.round(skillScore + sectionScore + actionScore),

    skillScore: Math.round(skillScore),

    sectionScore: Math.round(sectionScore),

    actionScore: Math.round(actionScore),
  };
}

// ======================================================
// SCORE BAR COLOR
// ======================================================

function getBarColor(atsScore) {
  if (atsScore >= 90) {
    return "#22c55e";
  }

  if (atsScore >= 70) {
    return "#eab308";
  }

  return "#ef4444";
}

// ======================================================
// STATUS
// ======================================================

function getStatus(atsScore) {
  if (atsScore >= 90) {
    return "Excellent Resume 🟢";
  }

  if (atsScore >= 70) {
    return "Good Resume 🟡";
  }

  return "Needs Improvements 🔴";
}

// ======================================================
// SUGGESTIONS
// ======================================================

function generateSuggestions(foundCategories) {
  const suggestion = [];

  if (!foundCategories.includes("backend")) {
    suggestion.push("Add backend skills.");
  }

  if (!foundCategories.includes("tools")) {
    suggestion.push("Mention Git/GitHub experience.");
  }

  if (!foundCategories.includes("databases")) {
    suggestion.push(
      "Add at least one database skill like SQL, MongoDB or PostgreSQL.",
    );
  }

  if (!foundCategories.includes("fundamentals")) {
    suggestion.push(
      "Mention CS fundamentals such as DSA, OOP, DBMS, OS or CN.",
    );
  }

  return suggestion;
}

// ======================================================
// SKILLS HTML
// ======================================================

function generateSkillsHTML(foundSkills) {
  let skillsHTML = "";

  for (const skill of foundSkills) {
    skillsHTML += `
      <span class="skill-badge">${skill}</span>
    `;
  }

  return skillsHTML;
}

// ======================================================
// MISSING SKILLS HTML
// ======================================================

function generateMissingSkillsHTML(missingSkills) {
  let missingSkillsHTML = "";

  for (const skill of missingSkills) {
    missingSkillsHTML += `
      <span class="missing-skill-badge">
        ${skill}
      </span>
    `;
  }

  return missingSkillsHTML;
}

// ======================================================
// SECTIONS HTML
// ======================================================

function generateSectionsHTML(requiredSections, foundSections) {
  let sectionsHTML = "";

  for (const section of requiredSections) {
    if (foundSections.includes(section)) {
      sectionsHTML += `
        <span class="section-found">
          ✅ ${section}
        </span>
      `;
    } else {
      sectionsHTML += `
        <span class="section-missing">
          ❌ ${section}
        </span>
      `;
    }
  }

  return sectionsHTML;
}

// ======================================================
// ACTION WORDS HTML
// ======================================================

function generateActionWordsHTML(foundActionWords) {
  let actionWordsHTML = "";

  for (const word of foundActionWords) {
    actionWordsHTML += `
      <span class="action-badge">
        ${word}
      </span>
    `;
  }

  return actionWordsHTML;
}

// ======================================================
// STRENGTHS & WEAKNESSES
// ======================================================

function generateStrengthsWeaknesses(foundCategories) {
  const strengths = [];
  const weaknesses = [];

  if (foundCategories.includes("frontend")) {
    strengths.push("Strong frontend skills found.");
  } else {
    weaknesses.push("Frontend skills are missing.");
  }

  if (foundCategories.includes("backend")) {
    strengths.push("Backend skills found.");
  } else {
    weaknesses.push("Backend skills are missing.");
  }

  if (foundCategories.includes("databases")) {
    strengths.push("Database knowledge found.");
  } else {
    weaknesses.push("Database skills are missing.");
  }

  if (foundCategories.includes("tools")) {
    strengths.push("Tools like Git/GitHub are mentioned.");
  } else {
    weaknesses.push("Tools like Git/GitHub are missing.");
  }

  if (foundCategories.includes("fundamentals")) {
    strengths.push("CS fundamentals are mentioned.");
  } else {
    weaknesses.push("CS fundamentals are missing.");
  }

  return {
    strengths,
    weaknesses,
  };
}

// ======================================================
// STRENGTHS & WEAKNESSES HTML
// ======================================================

function generateStrengthWeakness(strengths, weaknesses) {
  let strengthsHTML = "";

  for (const strength of strengths) {
    strengthsHTML += `
      <p>✅ ${strength}</p>
    `;
  }

  let weaknessesHTML = "";

  for (const weakness of weaknesses) {
    weaknessesHTML += `
      <p>❌ ${weakness}</p>
    `;
  }

  return {
    strengthsHTML,
    weaknessesHTML,
  };
}

// ======================================================
// AI FEEDBACK
// ======================================================

async function getAIFeedback(resumeText) {
  console.log("========== AI REQUEST ==========");
  console.log("Sending text to AI:", resumeText);
  console.log("Resume text length:", resumeText.length);

  /*
    LOCAL TESTING:
    Backend should run on localhost:5000

    DEPLOYED VERSION:
    Change this URL according to your Vercel setup.
  */

  const response = await fetch(
    "https://ai-resume-analyzer-backend-vv21.vercel.app/api/analyze-ai",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resumeText: resumeText,
      }),
    },
  );

  console.log("Response status:", response.status);

  // Get response as text first.
  // This prevents JSON parsing errors when backend
  // sends an HTML error page.
  const responseText = await response.text();

  console.log("Raw backend response:", responseText);

  let data;

  try {
    data = JSON.parse(responseText);
  } catch (error) {
    throw new Error(
      `Backend returned invalid JSON. Status: ${response.status}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
        data.message ||
        `Backend error: ${response.status}`,
    );
  }

  if (!data.aiFeedback) {
    throw new Error("AI feedback was not returned by backend.");
  }

  return data.aiFeedback;
}

// ======================================================
// RESUME TEXT EXTRACTION
// ======================================================

async function extractResumeText(file) {
  console.log("========== FILE EXTRACTION ==========");
  console.log("File name:", file.name);
  console.log("File type:", file.type);

  // ====================================================
  // PDF
  // ====================================================

  if (file.type === "application/pdf") {
    console.log("Extracting PDF...");

    const arrayBuffer = await file.arrayBuffer();

    const typedArray = new Uint8Array(arrayBuffer);

    const pdf = await pdfjsLib
      .getDocument(typedArray)
      .promise;

    let resumeText = "";

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      const page = await pdf.getPage(pageNumber);

      const textContent = await page.getTextContent();

      for (const item of textContent.items) {
        resumeText += item.str + " ";
      }
    }

    console.log("Extracted PDF text:", resumeText);
    console.log("PDF text length:", resumeText.length);

    return {
      resumeText: resumeText.trim(),
      totalPages: pdf.numPages,
    };
  }

  // ====================================================
  // DOCX
  // ====================================================

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    console.log("Extracting DOCX...");

    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.extractRawText({
      arrayBuffer: arrayBuffer,
    });

    const resumeText = result.value.trim();

    console.log("Extracted DOCX text:", resumeText);
    console.log("DOCX text length:", resumeText.length);

    return {
      resumeText: resumeText,
      totalPages: "N/A",
    };
  }

  // ====================================================
  // TXT
  // ====================================================

  if (file.type === "text/plain") {
    console.log("Extracting TXT...");

    const resumeText = await file.text();

    console.log("Extracted TXT text:", resumeText);
    console.log("TXT text length:", resumeText.length);

    return {
      resumeText: resumeText.trim(),
      totalPages: "N/A",
    };
  }

  // ====================================================
  // UNSUPPORTED FILE
  // ====================================================

  throw new Error(
    "Unsupported file format. Please upload a PDF, DOCX, or TXT resume.",
  );
}

// ======================================================
// REPORT TEXT
// ======================================================

function generateReportText(data) {
  return `
================================
      AI RESUME ANALYZER
================================

File Name: ${data.fileName}
File Size: ${data.fileSize} KB
Total Pages: ${data.totalPages}

--------------------------------
ATS SCORE
--------------------------------

Score: ${data.atsScore}/100

Status: ${data.status}

Breakdown:

Skills Score: ${data.skillScore}/50

Section Score: ${data.sectionScore}/35

Action Words: ${data.actionScore}/15

--------------------------------
SKILLS FOUND
--------------------------------

${data.foundSkills.join(", ")}

--------------------------------
CATEGORIES FOUND
--------------------------------

${data.foundCategories.join(", ")}

--------------------------------
RESUME SECTIONS
--------------------------------

Found Sections:

${data.foundSections.join(", ")}

Missing Sections:

${data.missingSections.join(", ")}

--------------------------------
STRENGTHS
--------------------------------

${data.strengths.join("\n")}

--------------------------------
WEAKNESSES
--------------------------------

${data.weaknesses.join("\n")}

--------------------------------
SUGGESTIONS
--------------------------------

${data.suggestionText}

--------------------------------
AI FEEDBACK
--------------------------------

${data.aiFeedback}

================================
Generated By AI Resume Analyzer
================================
`;
}

// ======================================================
// ANALYZE BUTTON
// ======================================================

analyzeBtn.addEventListener(
  "click",
  async function () {
    const file = resumeFile.files[0];

    // ==================================================
    // NO FILE
    // ==================================================

    if (!file) {
      resultBox.innerHTML = `
        <p>Please select a resume first.</p>
      `;

      return;
    }

    // ==================================================
    // ALLOWED FILE TYPES
    // ==================================================

    const allowedTypes = [
      "application/pdf",

      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      resultBox.innerHTML = `
        <p>
          Please upload a valid PDF, DOCX, or TXT resume.
        </p>
      `;

      return;
    }

    // ==================================================
    // FILE SIZE
    // ==================================================

    const fileSize = (file.size / 1024).toFixed(2);

    resultBox.innerHTML = `
      <p>
        Extracting resume text...
      </p>
    `;

    try {
      // ================================================
      // EXTRACT TEXT
      // ================================================

      const extractedData =
        await extractResumeText(file);

      const resumeText = extractedData.resumeText;

      const totalPages = extractedData.totalPages;

      console.log(
        "FINAL RESUME TEXT:",
        resumeText,
      );

      console.log(
        "FINAL TEXT LENGTH:",
        resumeText.length,
      );

      // ================================================
      // CHECK EMPTY FILE
      // ================================================

      if (!resumeText || resumeText.length < 20) {
        resultBox.innerHTML = `
          <p>
            Could not extract enough text from this file.
          </p>

          <p>
            Please make sure the resume contains readable text.
          </p>
        `;

        return;
      }

      // ================================================
      // SKILL CATEGORIES
      // ================================================

      const skillCategories = {
        languages: [
          "C",
          "C++",
          "Java",
          "Python",
          "JavaScript",
          "TypeScript",
        ],

        frontend: [
          "HTML",
          "CSS",
          "React",
          "Redux",
          "Tailwind",
          "Bootstrap",
        ],

        backend: [
          "Node",
          "Express",
          "Django",
          "Flask",
          "Spring",
        ],

        databases: [
          "MongoDB",
          "SQL",
          "MySQL",
          "PostgreSQL",
          "Firebase",
        ],

        tools: [
          "Git",
          "GitHub",
          "Postman",
          "VS Code",
          "Docker",
        ],

        fundamentals: [
          "DSA",
          "OOP",
          "DBMS",
          "OS",
          "CN",
        ],
      };

      // ================================================
      // REQUIRED SECTIONS
      // ================================================

      const requiredSections = [
        "Education",
        "Projects",
        "Experience",
        "Skills",
        "Certifications",
      ];

      // ================================================
      // ACTION WORDS
      // ================================================

      const actionWords = [
        "Built",
        "Developed",
        "Created",
        "Implemented",
        "Designed",
        "Optimized",
        "Managed",
        "Led",
      ];

      // ================================================
      // DETECT SKILLS
      // ================================================

      const skillResult = detectSkills(
        resumeText,
        skillCategories,
      );

      const foundSkills = skillResult.foundSkills;

      const foundCategories =
        skillResult.foundCategories;

      // ================================================
      // MISSING SKILLS
      // ================================================

      const missingSkills = detectMissingSkills(
        skillCategories,
        foundSkills,
      );

      const limitedMissingSkills =
        missingSkills.slice(0, 10);

      // ================================================
      // ACTION WORDS
      // ================================================

      const foundActionWords =
        detectActionWords(
          resumeText,
          actionWords,
        );

      // ================================================
      // SECTIONS
      // ================================================

      const sectionResult = detectSections(
        resumeText,
        requiredSections,
      );

      const foundSections =
        sectionResult.foundSections;

      const missingSections =
        sectionResult.missingSections;

      // ================================================
      // STRENGTHS / WEAKNESSES
      // ================================================

      const strengthResult =
        generateStrengthsWeaknesses(
          foundCategories,
        );

      const strengths =
        strengthResult.strengths;

      const weaknesses =
        strengthResult.weaknesses;

      const strengthHTMLResult =
        generateStrengthWeakness(
          strengths,
          weaknesses,
        );

      const strengthsHTML =
        strengthHTMLResult.strengthsHTML;

      const weaknessesHTML =
        strengthHTMLResult.weaknessesHTML;

      // ================================================
      // SUGGESTIONS
      // ================================================

      const suggestions =
        generateSuggestions(
          foundCategories,
        );

      const skillsHTML =
        foundSkills.length > 0
          ? generateSkillsHTML(foundSkills)
          : "<p>No major technical skills detected.</p>";

      const missingSkillsHTML =
        limitedMissingSkills.length > 0
          ? generateMissingSkillsHTML(
              limitedMissingSkills,
            )
          : "<p>No major missing skills detected.</p>";

      const sectionsHTML =
        generateSectionsHTML(
          requiredSections,
          foundSections,
        );

      const actionWordsHTML =
        generateActionWordsHTML(
          foundActionWords,
        );

      const suggestionHTML =
        suggestions.length > 0
          ? suggestions.join("<br>")
          : "Great! Your resume covers the important skill areas.";

      const suggestionText =
        suggestions.length > 0
          ? suggestions.join("\n")
          : "Great! Your resume covers the important skill areas.";

      // ================================================
      // ATS SCORE
      // ================================================

      const scoreResult =
        generateATSScore(
          foundSkills,
          foundSections,
          foundActionWords,
          skillCategories,
          requiredSections,
          actionWords,
        );

      const atsScore =
        scoreResult.atsScore;

      const skillScore =
        scoreResult.skillScore;

      const sectionScore =
        scoreResult.sectionScore;

      const actionScore =
        scoreResult.actionScore;

      const barColor =
        getBarColor(atsScore);

      const status =
        getStatus(atsScore);

      // ================================================
      // AI FEEDBACK
      // ================================================

      resultBox.innerHTML = `
        <p>
          Resume extracted successfully.
        </p>

        <p>
          Generating AI feedback...
        </p>
      `;

      let aiFeedback = "";

      try {
        aiFeedback =
          await getAIFeedback(
            resumeText,
          );
      } catch (error) {
        console.error(
          "AI ERROR:",
          error,
        );

        aiFeedback =
          "AI feedback could not be generated right now. Please try again.";
      }

      // ================================================
      // REPORT TEXT
      // ================================================

      reportText =
        generateReportText({
          fileName: file.name,

          fileSize: fileSize,

          totalPages: totalPages,

          atsScore: atsScore,

          status: status,

          skillScore: skillScore,

          sectionScore: sectionScore,

          actionScore: actionScore,

          foundSkills: foundSkills,

          foundCategories: foundCategories,

          foundSections: foundSections,

          missingSections: missingSections,

          strengths: strengths,

          weaknesses: weaknesses,

          suggestionText: suggestionText,

          aiFeedback: aiFeedback,
        });

      // ================================================
      // DISPLAY RESULT
      // ================================================

      resultBox.innerHTML = `

        <h3>Resume Analysis</h3>

        <p>
          <strong>File:</strong>
          ${file.name}
        </p>

        <p>
          <strong>File Size:</strong>
          ${fileSize} KB
        </p>

        <p>
          <strong>Total Pages:</strong>
          ${totalPages}
        </p>

        <p>
          <strong>ATS Score:</strong>
          ${atsScore}/100
        </p>

        <div class="progress-container">

          <div
            class="progress-bar"
            style="
              width:${atsScore}%;
              background:${barColor};
            "
          >
          </div>

        </div>

        <p>
          <strong>Status:</strong>
          ${status}
        </p>

        <div class="stats-container">

          <div class="stat-card">
            <h3>${skillScore}/50</h3>
            <p>Skills</p>
          </div>

          <div class="stat-card">
            <h3>${sectionScore}/35</h3>
            <p>Sections</p>
          </div>

          <div class="stat-card">
            <h3>${actionScore}/15</h3>
            <p>Action Words</p>
          </div>

        </div>

        <p>
          <strong>Skills Found:</strong>
        </p>

        <div>
          ${skillsHTML}
        </div>

        <p>
          <strong>Missing Skills:</strong>
        </p>

        <div>
          ${missingSkillsHTML}
        </div>

        <p>
          <strong>Action Words Found:</strong>
        </p>

        <div>
          ${actionWordsHTML}
        </div>

        <p>
          <strong>Resume Sections:</strong>
        </p>

        <div>
          ${sectionsHTML}
        </div>

        <p>
          <strong>Strengths:</strong>
        </p>

        <div>
          ${strengthsHTML}
        </div>

        <p>
          <strong>Weaknesses:</strong>
        </p>

        <div>
          ${weaknessesHTML}
        </div>

        <p>
          <strong>Suggestions:</strong>
        </p>

        <p>
          ${suggestionHTML}
        </p>

        <div class="ai-cards">

          <h3>
            <strong>AI Feedback</strong>
          </h3>

          <p>
            ${aiFeedback.replace(
              /\n/g,
              "<br>",
            )}
          </p>

        </div>

      `;

      console.log(
        "========== ANALYSIS COMPLETE ==========",
      );
    } catch (error) {
      console.error(
        "RESUME ANALYSIS ERROR:",
        error,
      );

      resultBox.innerHTML = `
        <p>
          <strong>
            Something went wrong while analyzing the resume.
          </strong>
        </p>

        <p>
          ${error.message}
        </p>
      `;
    }
  },
);

// ======================================================
// DOWNLOAD REPORT
// ======================================================

downloadBtn.addEventListener(
  "click",
  function () {
    if (reportText === "") {
      alert(
        "Please analyze a resume first.",
      );

      return;
    }

    const blob = new Blob(
      [reportText],
      {
        type: "text/plain",
      },
    );

    const link =
      document.createElement("a");

    link.href =
      URL.createObjectURL(blob);

    link.download =
      "resume-analysis-report.txt";

    link.click();

    URL.revokeObjectURL(link.href);
  },
);
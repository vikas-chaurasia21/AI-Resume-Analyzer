// ======================================================
// PDF.JS CONFIGURATION
// ======================================================

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

// ======================================================
// DOM ELEMENTS
// ======================================================

const analyzeBtn =
  document.querySelector("#analyzeBtn");

const resultBox =
  document.querySelector("#resultBox");

const resumeFile =
  document.querySelector("#resumeFile");

const downloadBtn =
  document.querySelector("#downloadBtn");

// ======================================================
// GLOBAL REPORT TEXT
// ======================================================

let reportText = "";

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
// SKILLS HTML
// ======================================================

function generateSkillsHTML(
  foundSkills
) {
  if (!foundSkills || foundSkills.length === 0) {
    return `
      <p>
        No major role-specific skills detected.
      </p>
    `;
  }

  let skillsHTML = "";

  for (const skill of foundSkills) {
    skillsHTML += `
      <span class="skill-badge">
        ${skill}
      </span>
    `;
  }

  return skillsHTML;
}

// ======================================================
// MISSING SKILLS HTML
// ======================================================

function generateMissingSkillsHTML(
  missingSkills
) {
  if (
    !missingSkills ||
    missingSkills.length === 0
  ) {
    return `
      <p>
        No major role-specific missing skills detected.
      </p>
    `;
  }

  let missingSkillsHTML = "";

  for (const skill of missingSkills.slice(
    0,
    12
  )) {
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

function generateSectionsHTML(
  requiredSections,
  foundSections
) {
  if (
    !requiredSections ||
    requiredSections.length === 0
  ) {
    return `
      <p>
        No section criteria available.
      </p>
    `;
  }

  let sectionsHTML = "";

  for (
    const section of requiredSections
  ) {
    if (
      foundSections.includes(section)
    ) {
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
// ACTION WORD HTML
// ======================================================

function generateActionWordsHTML(
  foundActionWords
) {
  if (
    !foundActionWords ||
    foundActionWords.length === 0
  ) {
    return `
      <p>
        No major action words detected.
      </p>
    `;
  }

  let actionWordsHTML = "";

  for (
    const word of foundActionWords
  ) {
    actionWordsHTML += `
      <span class="action-badge">
        ${word}
      </span>
    `;
  }

  return actionWordsHTML;
}

// ======================================================
// MISSING ACTION WORDS HTML
// ======================================================

function generateMissingActionWordsHTML(
  missingActionWords
) {
  if (
    !missingActionWords ||
    missingActionWords.length === 0
  ) {
    return `
      <p>
        Good action-word coverage.
      </p>
    `;
  }

  let html = "";

  for (
    const word of missingActionWords.slice(
      0,
      8
    )
  ) {
    html += `
      <span class="missing-skill-badge">
        ${word}
      </span>
    `;
  }

  return html;
}

// ======================================================
// AI FEEDBACK
// ======================================================

async function getAIFeedback(
  resumeText
) {
  console.log(
    "========== AI REQUEST =========="
  );

  console.log(
    "Sending text to AI:",
    resumeText
  );

  console.log(
    "Resume text length:",
    resumeText.length
  );

  const response = await fetch(
    "https://ai-resume-analyzer-backend-vv21.vercel.app/api/analyze-ai",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        resumeText: resumeText,
      }),
    }
  );

  console.log(
    "AI response status:",
    response.status
  );

  const responseText =
    await response.text();

  console.log(
    "Raw AI backend response:",
    responseText
  );

  let data;

  try {
    data = JSON.parse(
      responseText
    );
  } catch (error) {
    throw new Error(
      `AI backend returned invalid JSON. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
        data.message ||
        `Backend error: ${response.status}`
    );
  }

  if (!data.aiFeedback) {
    throw new Error(
      "AI feedback was not returned by backend."
    );
  }

  return data.aiFeedback;
}

// ======================================================
// ROLE ANALYSIS API
// ======================================================

async function getRoleAnalysis(
  resumeText
) {
  console.log(
    "========== ROLE ANALYSIS REQUEST =========="
  );

  const response = await fetch(
    "https://ai-resume-analyzer-backend-vv21.vercel.app/api/analyze-role",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        resumeText: resumeText,
      }),
    }
  );

  console.log(
    "Role response status:",
    response.status
  );

  const responseText =
    await response.text();

  console.log(
    "Raw role backend response:",
    responseText
  );

  let data;

  try {
    data = JSON.parse(
      responseText
    );
  } catch (error) {
    throw new Error(
      `Role analysis backend returned invalid JSON. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
        data.message ||
        `Role analysis failed: ${response.status}`
    );
  }

  if (
    !data.detectedRole ||
    typeof data.confidence !==
      "number"
  ) {
    throw new Error(
      "Role analysis returned incomplete data."
    );
  }

  if (!data.atsAvailable) {
    throw new Error(
      data.message ||
        "ATS analysis is not available for this role."
    );
  }

  return data;
}

// ======================================================
// RESUME TEXT EXTRACTION
// ======================================================

async function extractResumeText(
  file
) {
  console.log(
    "========== FILE EXTRACTION =========="
  );

  console.log(
    "File name:",
    file.name
  );

  console.log(
    "File type:",
    file.type
  );

  // ====================================================
  // PDF
  // ====================================================

  if (
    file.type ===
    "application/pdf"
  ) {
    console.log(
      "Extracting PDF..."
    );

    const arrayBuffer =
      await file.arrayBuffer();

    const typedArray =
      new Uint8Array(
        arrayBuffer
      );

    const pdf =
      await pdfjsLib
        .getDocument(
          typedArray
        )
        .promise;

    let resumeText = "";

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      const page =
        await pdf.getPage(
          pageNumber
        );

      const textContent =
        await page.getTextContent();

      for (
        const item of
          textContent.items
      ) {
        resumeText +=
          item.str + " ";
      }
    }

    console.log(
      "Extracted PDF text:",
      resumeText
    );

    console.log(
      "PDF text length:",
      resumeText.length
    );

    return {
      resumeText:
        resumeText.trim(),

      totalPages:
        pdf.numPages,
    };
  }

  // ====================================================
  // DOCX
  // ====================================================

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    console.log(
      "Extracting DOCX..."
    );

    const arrayBuffer =
      await file.arrayBuffer();

    const result =
      await mammoth.extractRawText(
        {
          arrayBuffer:
            arrayBuffer,
        }
      );

    const resumeText =
      result.value.trim();

    console.log(
      "Extracted DOCX text:",
      resumeText
    );

    console.log(
      "DOCX text length:",
      resumeText.length
    );

    return {
      resumeText:
        resumeText,

      totalPages: "N/A",
    };
  }

  // ====================================================
  // TXT
  // ====================================================

  if (
    file.type ===
    "text/plain"
  ) {
    console.log(
      "Extracting TXT..."
    );

    const resumeText =
      await file.text();

    console.log(
      "Extracted TXT text:",
      resumeText
    );

    console.log(
      "TXT text length:",
      resumeText.length
    );

    return {
      resumeText:
        resumeText.trim(),

      totalPages: "N/A",
    };
  }

  // ====================================================
  // UNSUPPORTED
  // ====================================================

  throw new Error(
    "Unsupported file format. Please upload a PDF, DOCX, or TXT resume."
  );
}

// ======================================================
// REPORT TEXT
// ======================================================

function generateReportText(
  data
) {
  return `
================================
      AI RESUME ANALYZER
================================

File Name: ${data.fileName}
File Size: ${data.fileSize} KB
Total Pages: ${data.totalPages}

--------------------------------
ROLE ANALYSIS
--------------------------------

Detected Role: ${data.detectedRole}

Confidence: ${data.confidence}%

Confidence Level: ${data.confidenceLevel}

Profile Source: ${data.profileSource}

Reason:
${data.roleReason}

--------------------------------
ATS SCORE
--------------------------------

Score: ${data.atsScore}/100

Status: ${data.status}

Breakdown:

Skills Score: ${data.skillScore}/50

Section Score: ${data.sectionScore}/30

Action Words: ${data.actionScore}/20

--------------------------------
SKILLS FOUND
--------------------------------

${data.foundSkills.join(", ")}

--------------------------------
MISSING ROLE SKILLS
--------------------------------

${data.missingSkills.join(", ")}

--------------------------------
RESUME SECTIONS
--------------------------------

Found Sections:

${data.foundSections.join(", ")}

Missing Sections:

${data.missingSections.join(", ")}

--------------------------------
ACTION WORDS FOUND
--------------------------------

${data.foundActionWords.join(", ")}

--------------------------------
ACTION WORDS TO IMPROVE
--------------------------------

${data.missingActionWords.join(", ")}

--------------------------------
OVERALL AI FEEDBACK
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
    const file =
      resumeFile.files[0];

    // ==================================================
    // NO FILE
    // ==================================================

    if (!file) {
      resultBox.innerHTML = `
        <p>
          Please select a resume first.
        </p>
      `;

      return;
    }

    // ==================================================
    // ALLOWED TYPES
    // ==================================================

    const allowedTypes = [
      "application/pdf",

      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

      "text/plain",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      resultBox.innerHTML = `
        <p>
          Please upload a valid PDF,
          DOCX, or TXT resume.
        </p>
      `;

      return;
    }

    // ==================================================
    // FILE SIZE
    // ==================================================

    const fileSize =
      (
        file.size / 1024
      ).toFixed(2);

    // ==================================================
    // LOADING
    // ==================================================

    resultBox.innerHTML = `
      <p>
        Extracting resume text...
      </p>
    `;

    try {
      // ================================================
      // STEP 1: EXTRACT RESUME
      // ================================================

      const extractedData =
        await extractResumeText(
          file
        );

      const resumeText =
        extractedData.resumeText;

      const totalPages =
        extractedData.totalPages;

      console.log(
        "FINAL RESUME TEXT:",
        resumeText
      );

      console.log(
        "FINAL TEXT LENGTH:",
        resumeText.length
      );

      // ================================================
      // EMPTY RESUME CHECK
      // ================================================

      if (
        !resumeText ||
        resumeText.length < 20
      ) {
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
      // STEP 2: ROLE ANALYSIS
      // ================================================

      resultBox.innerHTML = `
        <p>
          Resume extracted successfully.
        </p>

        <p>
          Detecting resume role...
        </p>
      `;

      const roleAnalysis =
        await getRoleAnalysis(
          resumeText
        );

      console.log(
        "ROLE ANALYSIS:",
        roleAnalysis
      );

      // ================================================
      // GET ROLE DATA
      // ================================================

      const detectedRole =
        roleAnalysis.normalizedRole ||
        roleAnalysis.detectedRole;

      const confidence =
        roleAnalysis.confidence;

      const confidenceLevel =
        roleAnalysis.confidenceLevel;

      const roleReason =
        roleAnalysis.reason;

      const profileSource =
        roleAnalysis.profileSource;

      const alternativeRoles =
        roleAnalysis.alternativeRoles ||
        [];

      // ================================================
      // GET ATS DATA
      // ================================================

      const ats =
        roleAnalysis.ats;

      if (!ats) {
        throw new Error(
          "Role analysis did not return ATS data."
        );
      }

      const atsScore =
        ats.atsScore;

      const skillScore =
        ats.skillScore;

      const sectionScore =
        ats.sectionScore;

      const actionScore =
        ats.actionScore;

      const foundSkills =
        ats.foundSkills || [];

      const missingSkills =
        ats.missingSkills || [];

      const foundSections =
        ats.foundSections || [];

      const missingSections =
        ats.missingSections || [];

      const foundActionWords =
        ats.foundActionWords || [];

      const missingActionWords =
        ats.missingActionWords || [];

      // ================================================
      // ROLE PROFILE
      // ================================================

      const roleProfile =
        roleAnalysis.roleProfile || {
          skills: [],
          sections: [],
          actionWords: [],
        };

      // ================================================
      // ROLE HTML
      // ================================================

      const skillsHTML =
        generateSkillsHTML(
          foundSkills
        );

      const missingSkillsHTML =
        generateMissingSkillsHTML(
          missingSkills
        );

      const sectionsHTML =
        generateSectionsHTML(
          roleProfile.sections,
          foundSections
        );

      const actionWordsHTML =
        generateActionWordsHTML(
          foundActionWords
        );

      const missingActionWordsHTML =
        generateMissingActionWordsHTML(
          missingActionWords
        );

      // ================================================
      // STATUS / BAR
      // ================================================

      const barColor =
        getBarColor(
          atsScore
        );

      const status =
        getStatus(
          atsScore
        );

      // ================================================
      // STEP 3: AI FEEDBACK
      // ================================================

      resultBox.innerHTML = `
        <p>
          Role detected:
          <strong>
            ${detectedRole}
          </strong>
        </p>

        <p>
          Confidence:
          <strong>
            ${confidence}%
          </strong>
        </p>

        <p>
          Generating overall AI feedback...
        </p>
      `;

      let aiFeedback = "";

      try {
        aiFeedback =
          await getAIFeedback(
            resumeText
          );
      } catch (error) {
        console.error(
          "AI ERROR:",
          error
        );

        aiFeedback =
          "AI feedback could not be generated right now. Please try again.";
      }

      // ================================================
      // ALTERNATIVE ROLES
      // ================================================

      let alternativeRolesHTML =
        "<p>No alternative roles provided.</p>";

      if (
        alternativeRoles.length >
        0
      ) {
        alternativeRolesHTML =
          alternativeRoles
            .map(
              (role) =>
                `<span class="skill-badge">${role}</span>`
            )
            .join("");
      }

      // ================================================
      // REPORT TEXT
      // ================================================

      reportText =
        generateReportText({
          fileName:
            file.name,

          fileSize:
            fileSize,

          totalPages:
            totalPages,

          detectedRole:
            detectedRole,

          confidence:
            confidence,

          confidenceLevel:
            confidenceLevel,

          profileSource:
            profileSource,

          roleReason:
            roleReason,

          atsScore:
            atsScore,

          status:
            status,

          skillScore:
            skillScore,

          sectionScore:
            sectionScore,

          actionScore:
            actionScore,

          foundSkills:
            foundSkills,

          missingSkills:
            missingSkills,

          foundSections:
            foundSections,

          missingSections:
            missingSections,

          foundActionWords:
            foundActionWords,

          missingActionWords:
            missingActionWords,

          aiFeedback:
            aiFeedback,
        });

      // ================================================
      // STEP 4: DISPLAY RESULT
      // ================================================

      resultBox.innerHTML = `

        <h3>
          Resume Analysis
        </h3>

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

        <hr>

        <h3>
          🎯 Detected Role
        </h3>

        <p>
          <strong>
            ${detectedRole}
          </strong>
        </p>

        <p>
          <strong>
            Confidence:
          </strong>

          ${confidence}%
        </p>

        <p>
          <strong>
            Confidence Level:
          </strong>

          ${confidenceLevel}
        </p>

        <p>
          <strong>
            Profile Source:
          </strong>

          ${
            profileSource ===
            "curated"
              ? "Verified Role Profile"
              : "AI Generated Role Profile"
          }
        </p>

        <p>
          <strong>
            Why this role?
          </strong>
        </p>

        <p>
          ${roleReason}
        </p>

        <p>
          <strong>
            Alternative Roles:
          </strong>
        </p>

        <div>
          ${alternativeRolesHTML}
        </div>

        <hr>

        <h3>
          📊 Role-Specific ATS Score
        </h3>

        <p>
          <strong>
            ATS Score:
          </strong>

          ${atsScore}/100
        </p>

        <div class="progress-container">

          <div
            class="progress-bar"
            style="
              width:${atsScore}%;
              background:${barColor};
            "
          ></div>

        </div>

        <p>
          <strong>
            Status:
          </strong>

          ${status}
        </p>

        <div class="stats-container">

          <div class="stat-card">
            <h3>
              ${skillScore}/50
            </h3>

            <p>
              Role Skills
            </p>
          </div>

          <div class="stat-card">
            <h3>
              ${sectionScore}/30
            </h3>

            <p>
              Sections
            </p>
          </div>

          <div class="stat-card">
            <h3>
              ${actionScore}/20
            </h3>

            <p>
              Action Words
            </p>
          </div>

        </div>

        <hr>

        <p>
          <strong>
            Role-Specific Skills Found:
          </strong>
        </p>

        <div>
          ${skillsHTML}
        </div>

        <p>
          <strong>
            Role-Specific Missing Skills:
          </strong>
        </p>

        <div>
          ${missingSkillsHTML}
        </div>

        <p>
          <strong>
            Resume Sections:
          </strong>
        </p>

        <div>
          ${sectionsHTML}
        </div>

        <p>
          <strong>
            Action Words Found:
          </strong>
        </p>

        <div>
          ${actionWordsHTML}
        </div>

        <p>
          <strong>
            Action Words You Can Improve:
          </strong>
        </p>

        <div>
          ${missingActionWordsHTML}
        </div>

        <hr>

        <div class="ai-cards">

          <h3>
            🤖 Overall AI Feedback
          </h3>

          <p>
            ${aiFeedback.replace(
              /\n/g,
              "<br>"
            )}
          </p>

        </div>

      `;

      console.log(
        "========== ANALYSIS COMPLETE =========="
      );

    } catch (error) {
      console.error(
        "RESUME ANALYSIS ERROR:",
        error
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
  }
);

// ======================================================
// DOWNLOAD REPORT
// ======================================================

downloadBtn.addEventListener(
  "click",
  function () {
    if (
      reportText === ""
    ) {
      alert(
        "Please analyze a resume first."
      );

      return;
    }

    const blob =
      new Blob(
        [reportText],
        {
          type:
            "text/plain",
        }
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      URL.createObjectURL(
        blob
      );

    link.download =
      "resume-analysis-report.txt";

    link.click();

    URL.revokeObjectURL(
      link.href
    );
  }
);
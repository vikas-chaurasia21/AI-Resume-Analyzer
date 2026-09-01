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
// SCORE BAR COLOR
// ======================================================

function getBarColor(atsScore) {
  if (atsScore >= 90) return "#22c55e";
  if (atsScore >= 70) return "#eab308";
  return "#ef4444";
}

// ======================================================
// HTML GENERATORS
// ======================================================

function generateBadgeListHTML(items, badgeClass) {
  if (!items || items.length === 0) {
    return "<p>None detected.</p>";
  }

  let html = "";

  for (const item of items) {
    html += `<span class="${badgeClass}">${item}</span>`;
  }

  return html;
}

function generateSectionsHTML(foundSections, missingSections) {
  let html = "";

  for (const section of foundSections || []) {
    html += `<span class="section-found">✅ ${section}</span>`;
  }

  for (const section of missingSections || []) {
    html += `<span class="section-missing">❌ ${section}</span>`;
  }

  return html;
}

function generateListHTML(items, prefix) {
  if (!items || items.length === 0) {
    return "<p>None detected.</p>";
  }

  let html = "";

  for (const item of items) {
    html += `<p>${prefix} ${item}</p>`;
  }

  return html;
}

// ======================================================
// AI RESUME ANALYSIS (backend now returns full structured
// analysis — ATS score, skills, sections, feedback — all
// field-aware, so it works for ANY resume type)
// ======================================================

async function getResumeAnalysis(resumeText) {
  console.log("========== AI REQUEST ==========");
  console.log("Sending text to AI, length:", resumeText.length);

  /*
    Change this URL to your deployed backend if different.
  */
  const BACKEND_URL =
    "https://ai-resume-analyzer-backend-vv21.vercel.app/api/analyze-ai";

  const response = await fetch(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resumeText: resumeText,
    }),
  });

  console.log("Response status:", response.status);

  const responseText = await response.text();

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
      data.error || data.message || `Backend error: ${response.status}`,
    );
  }

  return data;
}

// ======================================================
// RESUME TEXT EXTRACTION
// ======================================================

async function extractResumeText(file) {
  console.log("========== FILE EXTRACTION ==========");
  console.log("File name:", file.name);
  console.log("File type:", file.type);

  // PDF
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument(typedArray).promise;

    let resumeText = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      for (const item of textContent.items) {
        resumeText += item.str + " ";
      }
    }

    return {
      resumeText: resumeText.trim(),
      totalPages: pdf.numPages,
    };
  }

  // DOCX
  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    const resumeText = result.value.trim();

    return {
      resumeText: resumeText,
      totalPages: "N/A",
    };
  }

  // TXT
  if (file.type === "text/plain") {
    const resumeText = await file.text();

    return {
      resumeText: resumeText.trim(),
      totalPages: "N/A",
    };
  }

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
Detected Field: ${data.detectedField || "N/A"}

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

${(data.foundSkills || []).join(", ")}

--------------------------------
MISSING SKILLS
--------------------------------

${(data.missingSkills || []).join(", ")}

--------------------------------
RESUME SECTIONS
--------------------------------

Found Sections:
${(data.foundSections || []).join(", ")}

Missing Sections:
${(data.missingSections || []).join(", ")}

--------------------------------
STRENGTHS
--------------------------------

${(data.strengths || []).join("\n")}

--------------------------------
WEAKNESSES
--------------------------------

${(data.weaknesses || []).join("\n")}

--------------------------------
SUGGESTIONS
--------------------------------

${(data.suggestions || []).join("\n")}

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

analyzeBtn.addEventListener("click", async function () {
  const file = resumeFile.files[0];

  if (!file) {
    resultBox.innerHTML = `<p>Please select a resume first.</p>`;
    return;
  }

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (!allowedTypes.includes(file.type)) {
    resultBox.innerHTML = `<p>Please upload a valid PDF, DOCX, or TXT resume.</p>`;
    return;
  }

  const fileSize = (file.size / 1024).toFixed(2);

  resultBox.innerHTML = `<p>Extracting resume text...</p>`;

  try {
    const extractedData = await extractResumeText(file);
    const resumeText = extractedData.resumeText;
    const totalPages = extractedData.totalPages;

    if (!resumeText || resumeText.length < 20) {
      resultBox.innerHTML = `
        <p>Could not extract enough text from this file.</p>
        <p>Please make sure the resume contains readable text.</p>
      `;
      return;
    }

    resultBox.innerHTML = `
      <p>Resume extracted successfully.</p>
      <p>Analyzing with AI... this may take a few seconds.</p>
    `;

    let analysis;

    try {
      analysis = await getResumeAnalysis(resumeText);
    } catch (error) {
      console.error("AI ERROR:", error);

      resultBox.innerHTML = `
        <p><strong>Could not analyze resume right now.</strong></p>
        <p>${error.message}</p>
        <p>Please try again in a few seconds.</p>
      `;
      return;
    }

    const atsScore = analysis.atsScore || 0;
    const skillScore = analysis.skillScore || 0;
    const sectionScore = analysis.sectionScore || 0;
    const actionScore = analysis.actionScore || 0;
    const status = analysis.status || "";
    const barColor = getBarColor(atsScore);

    const skillsHTML = generateBadgeListHTML(
      analysis.foundSkills,
      "skill-badge",
    );

    const missingSkillsHTML = generateBadgeListHTML(
      analysis.missingSkills,
      "missing-skill-badge",
    );

    const sectionsHTML = generateSectionsHTML(
      analysis.foundSections,
      analysis.missingSections,
    );

    const strengthsHTML = generateListHTML(analysis.strengths, "✅");
    const weaknessesHTML = generateListHTML(analysis.weaknesses, "❌");

    const suggestionHTML =
      analysis.suggestions && analysis.suggestions.length > 0
        ? analysis.suggestions.join("<br>")
        : "Great! Your resume looks solid.";

    reportText = generateReportText({
      fileName: file.name,
      fileSize: fileSize,
      totalPages: totalPages,
      detectedField: analysis.detectedField,
      atsScore: atsScore,
      status: status,
      skillScore: skillScore,
      sectionScore: sectionScore,
      actionScore: actionScore,
      foundSkills: analysis.foundSkills,
      missingSkills: analysis.missingSkills,
      foundSections: analysis.foundSections,
      missingSections: analysis.missingSections,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      suggestions: analysis.suggestions,
      aiFeedback: analysis.aiFeedback,
    });

    resultBox.innerHTML = `
      <h3>Resume Analysis</h3>

      <p><strong>File:</strong> ${file.name}</p>
      <p><strong>File Size:</strong> ${fileSize} KB</p>
      <p><strong>Total Pages:</strong> ${totalPages}</p>
      <p><strong>Detected Field:</strong> ${analysis.detectedField || "N/A"}</p>
      <p><strong>ATS Score:</strong> ${atsScore}/100</p>

      <div class="progress-container">
        <div class="progress-bar" style="width:${atsScore}%; background:${barColor};"></div>
      </div>

      <p><strong>Status:</strong> ${status}</p>

      <div class="stats-container">
        <div class="stat-card"><h3>${skillScore}/50</h3><p>Skills</p></div>
        <div class="stat-card"><h3>${sectionScore}/35</h3><p>Sections</p></div>
        <div class="stat-card"><h3>${actionScore}/15</h3><p>Action Words</p></div>
      </div>

      <p><strong>Skills Found:</strong></p>
      <div>${skillsHTML}</div>

      <p><strong>Missing Skills:</strong></p>
      <div>${missingSkillsHTML}</div>

      <p><strong>Resume Sections:</strong></p>
      <div>${sectionsHTML}</div>

      <p><strong>Strengths:</strong></p>
      <div>${strengthsHTML}</div>

      <p><strong>Weaknesses:</strong></p>
      <div>${weaknessesHTML}</div>

      <p><strong>Suggestions:</strong></p>
      <p>${suggestionHTML}</p>

      <div class="ai-cards">
        <h3><strong>AI Feedback</strong></h3>
        <p>${(analysis.aiFeedback || "").replace(/\n/g, "<br>")}</p>
      </div>
    `;

    console.log("========== ANALYSIS COMPLETE ==========");
  } catch (error) {
    console.error("RESUME ANALYSIS ERROR:", error);

    resultBox.innerHTML = `
      <p><strong>Something went wrong while analyzing the resume.</strong></p>
      <p>${error.message}</p>
    `;
  }
});

// ======================================================
// DOWNLOAD REPORT
// ======================================================

downloadBtn.addEventListener("click", function () {
  if (reportText === "") {
    alert("Please analyze a resume first.");
    return;
  }

  const blob = new Blob([reportText], { type: "text/plain" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "resume-analysis-report.txt";
  link.click();

  URL.revokeObjectURL(link.href);
});
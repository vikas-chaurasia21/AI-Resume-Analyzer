pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const analyzeBtn = document.querySelector("#analyzeBtn");

const resultBox = document.querySelector("#resultBox");

const resumeFile = document.querySelector("#resumeFile");

function detectSkills(resumeText, skillCategories) {
  let foundSkills = [];

  let foundCategories = [];

  for (let category in skillCategories) {
    let categoryFound = false;

    for (let skill of skillCategories[category]) {
      if (resumeText.includes(skill)) {
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

function detectMissingSkills(skillCategories, foundSkills) {
  let missingSkills = [];

  for (let category in skillCategories) {
    for (let skill of skillCategories[category]) {
      if (!foundSkills.includes(skill)) {
        missingSkills.push(skill);
      }
    }
  }
  return missingSkills;
}

function detectSections(resumeText, requiredSections) {
  let foundSections = [];

  let missingSections = [];

  for (let section of requiredSections) {
    if (resumeText.includes(section)) {
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

function generateATSScore(
  foundSkills,
  foundSections,
  foundActionWords,
  skillCategories,
  requiredSections,
  actionWords,
) {
  const totalSkills = getTotalSkillCount(skillCategories);

  const skillScore = (foundSkills.length / totalSkills) * 50;

  const sectionScore = (foundSections.length / requiredSections.length) * 35;

  const actionScore = (foundActionWords.length / actionWords.length) * 15;

  return {
    atsScore: Math.round(skillScore + sectionScore + actionScore),

    skillScore: Math.round(skillScore),

    sectionScore: Math.round(sectionScore),

    actionScore: Math.round(actionScore),
  };
}

function getBarColor(atsScore) {
  if (atsScore >= 90) {
    return "#22c55e";
  } else if (atsScore >= 70) {
    return "#eab308";
  } else {
    return "#ef4444";
  }
}

function getStatus(atsScore) {
  if (atsScore >= 90) {
    return "Excellent Resume 🟢";
  } else if (atsScore >= 70) {
    return "Good Resume 🟡";
  } else {
    return "Needs Improvements 🔴";
  }
}

function generateSuggestions(foundCategories) {
  let suggestion = [];

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
  return suggestion;
}

function generateSkillsHTML(foundSkills) {
  let skillsHTML = "";

  for (let skill of foundSkills) {
    skillsHTML += `
                <span class = " skill-badge" > ${skill}</span>
            `;
  }
  return skillsHTML;
}

function generateMissingSkillsHTML(missingSkills) {
  let missingSkillsHTML = "";

  for (let skill of missingSkills) {
    missingSkillsHTML += `
        <span class = "missing-skill-badge">
            ${skill}</span>
        `;
  }
  return missingSkillsHTML;
}

function generateSectionsHTML(requiredSections, foundSections) {
  let sectionsHTML = "";

  for (let section of requiredSections) {
    if (foundSections.includes(section)) {
      sectionsHTML += `
                    <span class = "section-found">✅ ${section}</span>
                `;
    } else {
      sectionsHTML += `
                    <span class = "section-missing">❌ ${section}</span>
                `;
    }
  }
  return sectionsHTML;
}

function generateStrengthWeakness(strengths, weaknesses) {
  let strengthsHTML = "";

  for (let strength of strengths) {
    strengthsHTML += `
                <p>✅ ${strength}</p>
            `;
  }

  let weaknessesHTML = "";

  for (let weakness of weaknesses) {
    weaknessesHTML += `
          <p>❌ ${weakness}</p>
            `;
  }
  return { strengthsHTML, weaknessesHTML };
}

function generateStrengthsWeaknesses(foundCategories) {
  let strengths = [];

  let weaknesses = [];

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
    strengths.push("Databases knowledge found.");
  } else {
    weaknesses.push("Database skills are missing.");
  }
  if (foundCategories.includes("tools")) {
    strengths.push("Tools like Git/GitHub are mentioned.");
  } else {
    weaknesses.push("tools like Git/GitHub are missing.");
  }
  return {
    strengths,
    weaknesses,
  };
}

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

    Section: ${data.sectionScore}/35

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

    ${data.suggestionHTML}

    --------------------------------
    AI FEEDBACK
    --------------------------------

    ${data.aiFeedback}

    ================================
    Generated By AI Resume Analyzer
    ================================
    `;
}

function detectActionWords(resumeText, actionWords) {
  let foundActionWords = [];

  for (let word of actionWords) {
    if (resumeText.includes(word)) {
      foundActionWords.push(word);
    }
  }
  return foundActionWords;
}

function generateActionWordsHTML(foundActionWords) {
  let actionWordsHTML = "";

  for (let word of foundActionWords) {
    actionWordsHTML += `
      <span class ="action-badge">${word}</span>
      `;
  }
  return actionWordsHTML;
}

function getTotalSkillCount(skillCategories) {
  let total = 0;

  for (let category in skillCategories) {
    total += skillCategories[category].length;
  }
  return total;
}

async function getAIFeedback(resumeText) {
  const response = await fetch("ai-resume-analyzer-production-40dc.up.railway.app", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resumeText: resumeText,
    }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error("Backend error");
  }
  return data.aiFeedback;
}

const downloadBtn = document.querySelector("#downloadBtn");

let reportText = "";

analyzeBtn.addEventListener("click", function () {
  const file = resumeFile.files[0];

  if (!file) {
    resultBox.innerHTML = `
        <p>Please select a resume first.</p>
        `;
    return;
  }
  if (file.type !== "application/pdf") {
    resultBox.innerHTML = `
            <p> Please Upload a Pdf resume only. </p>
        `;
    return;
  }
  const fileSize = (file.size / 1024).toFixed(2);

  const reader = new FileReader();

  resultBox.innerHTML = `<p>Analyzing resume... Please wait.</p>`;

  reader.readAsArrayBuffer(file);

  reader.onload = async function () {
    const typedArray = new Uint8Array(reader.result);

    const pdf = await pdfjsLib.getDocument(typedArray).promise;

    let resumeText = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);

      const textContent = await page.getTextContent();

      const textItems = textContent.items;

      for (let item of textItems) {
        resumeText += item.str + " ";
      }
    }

    const skillCategories = {
      languages: ["C", "C++", "Java", "Python", "JavaScript", "TypeScript"],
      frontend: ["HTML", "CSS", "React", "Redux", "Tailwind", "Bootstrap"],
      backend: ["Node", "Express", "Django", "Flask", "Spring"],
      databases: ["MongoDB", "SQL", "MySQL", "PostgreSQL", "Firebase"],
      tools: ["Git", "GitHub", "Postman", "VS Code", "Docker"],
      fundamentals: ["DSA", "OOP", "DBMS", "OS", "CN"],
    };

    const requiredSections = [
      "Education",
      "Projects",
      "Experience",
      "Skills",
      "Certifications",
    ];

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

    const skillResult = detectSkills(resumeText, skillCategories);

    const foundActionWords = detectActionWords(resumeText, actionWords);

    let foundSkills = skillResult.foundSkills;

    const missingSkills = detectMissingSkills(skillCategories, foundSkills);

    const limitedMissingSkills = missingSkills.slice(0, 10);

    let foundCategories = skillResult.foundCategories;

    const sectionResult = detectSections(resumeText, requiredSections);

    let foundSections = sectionResult.foundSections;

    let missingSections = sectionResult.missingSections;

    const strengthResult = generateStrengthsWeaknesses(foundCategories);

    const strengths = strengthResult.strengths;

    const weaknesses = strengthResult.weaknesses;

    const result = generateStrengthWeakness(strengths, weaknesses);

    const strengthsHTML = result.strengthsHTML;

    const weaknessesHTML = result.weaknessesHTML;

    let suggestion = generateSuggestions(foundCategories);

    const skillsHTML =
      foundSkills.length > 0
        ? generateSkillsHTML(foundSkills)
        : "<p> No major technical skills detected.</p>";

    const missingSkillsHTML = generateMissingSkillsHTML(limitedMissingSkills);

    const scoreResult = generateATSScore(
      foundSkills,
      foundSections,
      foundActionWords,
      skillCategories,
      requiredSections,
      actionWords,
    );
    const atsScore = scoreResult.atsScore;

    const skillScore = scoreResult.skillScore;

    const sectionScore = scoreResult.sectionScore;

    const actionScore = scoreResult.actionScore;

    const barColor = getBarColor(atsScore);

    const status = getStatus(atsScore);

    const sectionsHTML = generateSectionsHTML(requiredSections, foundSections);

    const actionWordsHTML = generateActionWordsHTML(foundActionWords);

    const suggestionHTML =
      suggestion.length > 0
        ? suggestion.join("<br>")
        : "Great! Your resume covers the important skill areas.";

    let aiFeedback = "";

    try {
      aiFeedback = await getAIFeedback(resumeText);
    } catch (error) {
      console.log("AI Error:", error);
      aiFeedback = "AI feedback could not be generated right now.";
    }

    reportText = generateReportText({
      fileName: file.name,

      fileSize: fileSize,

      totalPages: pdf.numPages,

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

      suggestionHTML: suggestionHTML,

      aiFeedback: aiFeedback
    });

    resultBox.innerHTML = `
    
        <h3> Resume Analysis </h3>

        <p><strong>File:</strong> ${file.name}</p>

        <p><strong>File Size : </strong> ${fileSize} KB</p>
    
        <p><strong> ATS Score :</strong> ${atsScore}/100</p>

        <div class = "progress-container">
            <div class = "progress-bar" style = "width:${atsScore}%; background: ${barColor}">
            </div>
        </div>

        <p><strong>Status:</strong> ${status}</p>

        <div class = "stats-container">
            
            <div class = "stat-card">
                <h3>${skillScore}/50</h3>
                <p>Skills</p>
            </div>
            
            <div class = "stat-card">
                <h3>${sectionScore}/35</h3>
                <p>Section</p>
            </div>

            <div class = "stat-card">
                <h3>${actionScore}/15</h3>
                <p>Action Words</p>
            </div>

        </div>
        
        <p><strong> Skills Found : </strong></p>
        <div>${skillsHTML}</div>

        <p><strong> Missing Skills : </strong></p>
        <div>${missingSkillsHTML}</div>

        <p><strong>Action Words Found : </strong></p>
        <div>
          ${actionWordsHTML}
        </div>

        <p><strong>Resume Section : </strong></p>
        <div> ${sectionsHTML}</div>

        <p><strong>Strengths : </strong></p>
        <div>${strengthsHTML}</div>
        
        <p><strong>Weaknesses : </strong></p>
        <div>${weaknessesHTML}</div>
    
        <p><strong> Suggestion :</strong></p>
        <p>${suggestionHTML}</p>

        <div class = "ai-cards">
          <h3><strong> AI Feedback</strong></h3>
          <p>${aiFeedback.replace(/\n/g, "<br>")}</p>
        </div> 
    `;
  };
});
downloadBtn.addEventListener("click", function () {
  if (reportText === "") {
    alert("Please analysis a resume first.");
    return;
  }
  const blob = new Blob([reportText], {
    type: "text/plain",
  });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);

  link.download = "resume-analysis-report.txt";

  link.click();
});

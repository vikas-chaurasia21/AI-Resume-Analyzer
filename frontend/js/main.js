/**
 * Application flow:
 *   Upload -> extract text -> detect role + confidence -> role profile ->
 *   deterministic ATS (all via POST /api/analyze-resume) ->
 *   AI feedback (POST /api/analyze-ai) -> render -> downloadable report.
 */

import { getAiFeedback } from './api/aiApi.js';
import { analyzeResume } from './api/analyzeApi.js';
import { renderAiFeedback, renderAiFeedbackLoading } from './components/aiFeedback.js';
import { renderAtsResult, renderFileSummary } from './components/atsResult.js';
import { renderRoleResult } from './components/roleResult.js';
import { initResumeUpload } from './components/resumeUpload.js';
import { buildInsights } from './services/atsInsights.js';
import { extractResumeText } from './services/resumeExtractor.js';
import { downloadReport, generateReportText } from './services/reportGenerator.js';
import { AI_FEEDBACK_FALLBACK, MIN_RESUME_TEXT_LENGTH } from './utils/constants.js';
import { $, html, render } from './utils/dom.js';
import { formatFileSize, getScoreStatus } from './utils/formatters.js';

const resultBox = $('#resultBox');
let latestReport = '';

const showMessage = (...paragraphs) => render(resultBox, html`${paragraphs.map((text) => html`<p>${text}</p>`)}`);

async function fetchAiFeedback(resumeText, detectedRole) {
  try {
    return await getAiFeedback(resumeText, detectedRole);
  } catch (error) {
    console.error('AI feedback failed:', error);
    return `${AI_FEEDBACK_FALLBACK} (${error.message})`;
  }
}

async function runAnalysis(file) {
  latestReport = '';

  try {
    showMessage('Extracting resume text...');
    const { resumeText, totalPages } = await extractResumeText(file);

    if (resumeText.length < MIN_RESUME_TEXT_LENGTH) {
      showMessage('Could not extract enough text from this file.', 'Please make sure the resume contains readable text.');
      return;
    }

    showMessage('Resume extracted successfully.', 'Detecting role and calculating ATS score...');
    const analysis = await analyzeResume(resumeText);

    const fileInfo = { name: file.name, size: formatFileSize(file.size), totalPages };
    const insights = buildInsights(analysis.ats, analysis.normalizedRole);

    render(
      resultBox,
      html`
        <h3>Resume Analysis</h3>
        ${renderFileSummary(fileInfo)}
        ${renderRoleResult(analysis)}
        ${renderAtsResult(analysis.ats, insights)}
        <div id="aiFeedbackSection">${renderAiFeedbackLoading()}</div>
      `,
    );

    const aiFeedback = await fetchAiFeedback(resumeText, analysis.detectedRole);
    render($('#aiFeedbackSection'), renderAiFeedback(aiFeedback));

    latestReport = generateReportText({
      file: { name: fileInfo.name, size: fileInfo.size, totalPages },
      role: analysis,
      ats: analysis.ats,
      status: getScoreStatus(analysis.ats.atsScore).label,
      insights,
      aiFeedback,
    });
  } catch (error) {
    console.error('Resume analysis failed:', error);
    render(
      resultBox,
      html`
        <p><strong>Something went wrong while analyzing the resume.</strong></p>
        <p>${error.message}</p>
      `,
    );
  }
}

initResumeUpload({
  fileInput: $('#resumeFile'),
  analyzeButton: $('#analyzeBtn'),
  onAnalyze: runAnalysis,
  onInvalid: (message) => showMessage(message),
});

$('#downloadBtn').addEventListener('click', () => {
  if (!latestReport) {
    alert('Please analyze a resume first.');
    return;
  }
  downloadReport(latestReport);
});

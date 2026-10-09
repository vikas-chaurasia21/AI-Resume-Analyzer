import { SCORE_MAX } from '../utils/constants.js';
import { badges, html } from '../utils/dom.js';
import { clampPercent, getScoreStatus } from '../utils/formatters.js';

const statCard = (value, max, label) => html`
  <div class="stat-card">
    <h3>${value}/${max}</h3>
    <p>${label}</p>
  </div>
`;

const sectionBadges = (ats) => html`
  <div class="badge-list">
    ${ats.foundSections.map((name) => html`<span class="section-found">✅ ${name}</span>`)}
    ${ats.missingSections.map((name) => html`<span class="section-missing">❌ ${name}</span>`)}
  </div>
`;

const noteList = (items, icon) => items.map((item) => html`<p>${icon} ${item}</p>`);

export function renderFileSummary({ name, size, totalPages }) {
  return html`
    <p><strong>File:</strong> ${name}</p>
    <p><strong>File Size:</strong> ${size} KB</p>
    <p><strong>Total Pages:</strong> ${totalPages}</p>
  `;
}

export function renderAtsResult(ats, insights) {
  const status = getScoreStatus(ats.atsScore);

  return html`
    <section class="result-section">
      <h4>ATS Analysis</h4>
      <p><strong>ATS Score:</strong> ${ats.atsScore}/100</p>
      <div class="progress-container">
        <div class="progress-bar" style="width:${clampPercent(ats.atsScore)}%;background:${status.color}"></div>
      </div>
      <p><strong>Status:</strong> ${status.label}</p>

      <div class="stats-container">
        ${statCard(ats.skillScore, SCORE_MAX.skills, 'Skills')}
        ${statCard(ats.sectionScore, SCORE_MAX.sections, 'Sections')}
        ${statCard(ats.actionScore, SCORE_MAX.actions, 'Action Words')}
      </div>

      <p><strong>Skills Found:</strong></p>
      ${badges(ats.foundSkills, 'skill-badge', 'No role-relevant skills detected.')}

      <p><strong>Missing Skills:</strong></p>
      ${badges(ats.missingSkills, 'missing-skill-badge', 'No major missing skills detected.')}

      <p><strong>Action Words Found:</strong></p>
      ${badges(ats.foundActionWords, 'action-badge', 'No strong action words detected.')}

      <p><strong>Action Words To Consider:</strong></p>
      ${badges(ats.missingActionWords, 'missing-skill-badge', 'You used all the suggested action words.')}

      <p><strong>Resume Sections:</strong></p>
      ${sectionBadges(ats)}

      <p><strong>Strengths:</strong></p>
      ${noteList(insights.strengths, '✅')}

      <p><strong>Weaknesses:</strong></p>
      ${noteList(insights.weaknesses, '❌')}

      <p><strong>Suggestions:</strong></p>
      ${noteList(insights.suggestions, '💡')}
    </section>
  `;
}

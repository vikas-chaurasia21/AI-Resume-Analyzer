import { html } from '../utils/dom.js';

const HEADING_PATTERN = /^(Summary|Strengths?|Weaknesses|Suggestions|Best Role Fit):\s*(.*)$/i;

const card = (content) => html`
  <div class="ai-card">
    <h3>AI Feedback</h3>
    ${content}
  </div>
`;

export const renderAiFeedbackLoading = () => card(html`<p class="muted">Generating AI feedback...</p>`);

/** Shows Gemini's text safely: escaped, with section headings in bold. */
export function renderAiFeedback(text) {
  const lines = text
    .replace(/\*\*/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return card(
    lines.map((line) => {
      const heading = line.match(HEADING_PATTERN);
      return heading ? html`<p><strong>${heading[1]}:</strong> ${heading[2]}</p>` : html`<p>${line}</p>`;
    }),
  );
}

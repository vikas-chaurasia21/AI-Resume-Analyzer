const isLocalhost = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname);

// Backend base URL. This is a public address, not a secret: the Gemini key only ever lives on the server.
export const API_BASE_URL = isLocalhost
  ? 'http://localhost:5000'
  : ' https://ai-resume-analyzer-nxh6.onrender.com';

export const API_TIMEOUT_MS = 60000;

export const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

export const MIN_RESUME_TEXT_LENGTH = 20;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const FILE_KIND = Object.freeze({ PDF: 'pdf', DOCX: 'docx', TXT: 'txt' });

export const MIME_TO_FILE_KIND = Object.freeze({
  'application/pdf': FILE_KIND.PDF,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FILE_KIND.DOCX,
  'text/plain': FILE_KIND.TXT,
});

// Some browsers report an empty MIME type, so the extension is the fallback.
export const EXTENSION_TO_FILE_KIND = Object.freeze({
  pdf: FILE_KIND.PDF,
  docx: FILE_KIND.DOCX,
  txt: FILE_KIND.TXT,
});

// Must match the backend scoring weights.
export const SCORE_MAX = Object.freeze({ skills: 50, sections: 30, actions: 20 });

export const SCORE_STATUS = Object.freeze({
  excellent: { min: 90, label: 'Excellent Resume 🟢', color: '#22c55e' },
  good: { min: 70, label: 'Good Resume 🟡', color: '#eab308' },
  needsWork: { min: 0, label: 'Needs Improvements 🔴', color: '#ef4444' },
});

export const REPORT_FILENAME = 'resume-analysis-report.txt';

export const AI_FEEDBACK_FALLBACK = 'AI feedback could not be generated right now. Please try again.';

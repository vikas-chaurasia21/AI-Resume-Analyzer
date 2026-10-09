import { postJson } from './httpClient.js';

/** Role detection + role profile + deterministic ATS analysis. */
export const analyzeResume = (resumeText) => postJson('/api/analyze-resume', { resumeText });

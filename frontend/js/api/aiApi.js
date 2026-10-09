import { ApiError, postJson } from './httpClient.js';

/** Gemini-written feedback. Passing the detected role gives the AI useful context. */
export async function getAiFeedback(resumeText, detectedRole) {
  const data = await postJson('/api/analyze-ai', { resumeText, detectedRole });

  if (!data.aiFeedback) {
    throw new ApiError('AI feedback was not returned by the server.', 'EMPTY_AI_FEEDBACK');
  }
  return data.aiFeedback;
}

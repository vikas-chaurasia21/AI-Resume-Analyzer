import { API_BASE_URL, API_TIMEOUT_MS } from '../utils/constants.js';

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/**
 * POSTs JSON to the backend and unwraps the { success, data } envelope.
 * Throws ApiError with a user-friendly message on any failure.
 */
export async function postJson(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      const message =
        error.name === 'AbortError'
          ? 'The request timed out. Please try again.'
          : 'Could not reach the server. Check your connection and try again.';
      throw new ApiError(message, 'NETWORK_ERROR');
    }

    // Read as text first: a proxy or crash can return an HTML error page.
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new ApiError(`The server returned an unexpected response (status ${response.status}).`, 'INVALID_RESPONSE', response.status);
    }

    if (!response.ok || !payload.success) {
      throw new ApiError(
        payload?.error?.message || `Request failed (status ${response.status}).`,
        payload?.error?.code || 'REQUEST_FAILED',
        response.status,
      );
    }

    return payload.data;
  } finally {
    clearTimeout(timer);
  }
}

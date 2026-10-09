import { MAX_FILE_SIZE_BYTES } from '../utils/constants.js';
import { detectFileKind, UNSUPPORTED_FILE_MESSAGE } from '../services/resumeExtractor.js';

/** Returns an error message, or null when the file can be analyzed. */
export function validateFile(file) {
  if (!file) return 'Please select a resume first.';
  if (!detectFileKind(file)) return UNSUPPORTED_FILE_MESSAGE;
  if (file.size > MAX_FILE_SIZE_BYTES) return `The file is too large (maximum ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB).`;
  return null;
}

/**
 * Wires the upload input and Analyze button. Validates the file, disables the
 * button while `onAnalyze` runs, and reports validation problems via `onInvalid`.
 */
export function initResumeUpload({ fileInput, analyzeButton, onAnalyze, onInvalid }) {
  const idleLabel = analyzeButton.textContent;

  analyzeButton.addEventListener('click', async () => {
    const file = fileInput.files[0];
    const problem = validateFile(file);
    if (problem) {
      onInvalid(problem);
      return;
    }

    analyzeButton.disabled = true;
    analyzeButton.textContent = 'Analyzing...';
    try {
      await onAnalyze(file);
    } finally {
      analyzeButton.disabled = false;
      analyzeButton.textContent = idleLabel;
    }
  });
}

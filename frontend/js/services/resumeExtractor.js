import { EXTENSION_TO_FILE_KIND, FILE_KIND, MIME_TO_FILE_KIND, PDFJS_WORKER_URL } from '../utils/constants.js';

export const UNSUPPORTED_FILE_MESSAGE = 'Unsupported file format. Please upload a PDF, DOCX, or TXT resume.';

/** Returns 'pdf' | 'docx' | 'txt' | null. */
export function detectFileKind(file) {
  const byMime = MIME_TO_FILE_KIND[file.type];
  if (byMime) return byMime;

  const extension = file.name.split('.').pop().toLowerCase();
  return EXTENSION_TO_FILE_KIND[extension] || null;
}

async function extractPdf(file) {
  const pdfjs = window.pdfjsLib;
  if (!pdfjs) throw new Error('The PDF reader failed to load. Refresh the page and try again.');
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument(data).promise;

  let text = '';
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    for (const item of content.items) {
      text += item.str + (item.hasEOL ? '\n' : ' ');
    }
  }

  return { resumeText: text.trim(), totalPages: pdf.numPages };
}

async function extractDocx(file) {
  if (!window.mammoth) throw new Error('The DOCX reader failed to load. Refresh the page and try again.');

  const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return { resumeText: result.value.trim(), totalPages: 'N/A' };
}

async function extractTxt(file) {
  return { resumeText: (await file.text()).trim(), totalPages: 'N/A' };
}

const EXTRACTORS = {
  [FILE_KIND.PDF]: extractPdf,
  [FILE_KIND.DOCX]: extractDocx,
  [FILE_KIND.TXT]: extractTxt,
};

/** @returns {Promise<{ resumeText: string, totalPages: number | string }>} */
export async function extractResumeText(file) {
  const kind = detectFileKind(file);
  if (!kind) throw new Error(UNSUPPORTED_FILE_MESSAGE);
  return EXTRACTORS[kind](file);
}

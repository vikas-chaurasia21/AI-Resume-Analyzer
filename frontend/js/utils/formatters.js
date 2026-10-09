import { SCORE_STATUS } from './constants.js';

export const formatFileSize = (bytes) => (bytes / 1024).toFixed(2);

export const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0));

export const formatList = (items, emptyText = 'None') => (items && items.length > 0 ? items.join(', ') : emptyText);

/** Returns { label, color } for an ATS score. */
export function getScoreStatus(score) {
  if (score >= SCORE_STATUS.excellent.min) return SCORE_STATUS.excellent;
  if (score >= SCORE_STATUS.good.min) return SCORE_STATUS.good;
  return SCORE_STATUS.needsWork;
}

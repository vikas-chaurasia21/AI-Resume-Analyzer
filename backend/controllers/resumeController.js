'use strict';

const resumeAnalysisService = require('../services/resumeAnalysisService');
const { sendSuccess } = require('../utils/helpers');

async function analyzeResume(req, res) {
  const result = await resumeAnalysisService.analyzeResume(req.validated.resumeText);
  sendSuccess(res, result);
}

module.exports = { analyzeResume };

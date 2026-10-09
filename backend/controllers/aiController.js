'use strict';

const aiFeedbackService = require('../services/aiFeedbackService');
const { sendSuccess } = require('../utils/helpers');

async function getFeedback(req, res) {
  const { resumeText, targetRole } = req.validated;
  const result = await aiFeedbackService.generateFeedback(resumeText, targetRole);
  sendSuccess(res, result);
}

module.exports = { getFeedback };

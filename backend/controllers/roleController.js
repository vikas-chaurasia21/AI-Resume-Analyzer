'use strict';

const roleDetectionService = require('../services/roleDetectionService');
const { sendSuccess } = require('../utils/helpers');

async function detectRole(req, res) {
  const result = await roleDetectionService.detectRole(req.validated.resumeText);
  sendSuccess(res, result);
}

module.exports = { detectRole };

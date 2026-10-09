'use strict';

const express = require('express');
const resumeController = require('../controllers/resumeController');
const { aiLimiter } = require('../middleware/rateLimiter');
const { validateResume, methodNotAllowed } = require('../middleware/validation');

const router = express.Router();

// Full pipeline: role detection -> role profile -> deterministic ATS.
router
  .route('/analyze-resume')
  .post(aiLimiter, validateResume, resumeController.analyzeResume)
  .all(methodNotAllowed(['POST']));

module.exports = router;

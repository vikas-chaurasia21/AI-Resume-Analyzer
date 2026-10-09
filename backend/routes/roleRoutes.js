'use strict';

const express = require('express');
const roleController = require('../controllers/roleController');
const { aiLimiter } = require('../middleware/rateLimiter');
const { validateResume, methodNotAllowed } = require('../middleware/validation');

const router = express.Router();

// Role detection only (no ATS scoring).
router
  .route('/analyze-role')
  .post(aiLimiter, validateResume, roleController.detectRole)
  .all(methodNotAllowed(['POST']));

module.exports = router;

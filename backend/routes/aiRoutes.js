'use strict';

const express = require('express');
const aiController = require('../controllers/aiController');
const { aiLimiter } = require('../middleware/rateLimiter');
const { validateResume, methodNotAllowed } = require('../middleware/validation');

const router = express.Router();

router
  .route('/analyze-ai')
  .post(aiLimiter, validateResume, aiController.getFeedback)
  .all(methodNotAllowed(['POST']));

module.exports = router;

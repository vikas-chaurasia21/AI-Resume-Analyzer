'use strict';

// Thin Vercel adapter: an Express app is already a (req, res) handler.
// All business logic stays in ../services and is unaware of Vercel.
module.exports = require('../index');

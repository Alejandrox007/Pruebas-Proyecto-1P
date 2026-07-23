const express = require('express');
const { summary } = require('../controllers/admin.controller');
const asyncHandler = require('../middleware/async-handler');

const router = express.Router();
router.get('/summary', asyncHandler(summary));

module.exports = router;

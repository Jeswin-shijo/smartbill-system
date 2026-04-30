const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authenticate');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.get('/', authenticate, asyncHandler(getDashboard));

module.exports = router;

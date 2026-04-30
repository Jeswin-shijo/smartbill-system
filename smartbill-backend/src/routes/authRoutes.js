const express = require('express');
const { forgotPassword, getCurrentUser, login, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.post('/login', asyncHandler(login));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));
router.get('/me', authenticate, asyncHandler(getCurrentUser));

module.exports = router;

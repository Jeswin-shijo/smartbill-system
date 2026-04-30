const express = require('express');
const {
  getProfile,
  updatePassword,
  updateProfile,
} = require('../controllers/profileController');
const { authenticate } = require('../middleware/authenticate');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.use(authenticate);
router.get('/', asyncHandler(getProfile));
router.put('/', asyncHandler(updateProfile));
router.put('/password', asyncHandler(updatePassword));

module.exports = router;

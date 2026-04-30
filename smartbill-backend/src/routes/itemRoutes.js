const express = require('express');
const {
  createItem,
  deleteItem,
  getItem,
  listItems,
  updateItem,
} = require('../controllers/itemController');
const { authenticate } = require('../middleware/authenticate');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.use(authenticate);
router.get('/', asyncHandler(listItems));
router.post('/', asyncHandler(createItem));
router.get('/:itemId', asyncHandler(getItem));
router.put('/:itemId', asyncHandler(updateItem));
router.delete('/:itemId', asyncHandler(deleteItem));

module.exports = router;

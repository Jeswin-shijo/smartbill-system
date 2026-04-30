const express = require('express');
const {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} = require('../controllers/customerController');
const { authenticate } = require('../middleware/authenticate');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.use(authenticate);
router.get('/', asyncHandler(listCustomers));
router.post('/', asyncHandler(createCustomer));
router.get('/:customerId', asyncHandler(getCustomer));
router.put('/:customerId', asyncHandler(updateCustomer));
router.delete('/:customerId', asyncHandler(deleteCustomer));

module.exports = router;

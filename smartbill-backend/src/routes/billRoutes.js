const express = require('express');
const {
  createBill,
  deleteBill,
  getBillDetails,
  listBills,
  listHistory,
  nextBillNumber,
  updateBill,
  updateBillStatus,
} = require('../controllers/billController');
const { authenticate } = require('../middleware/authenticate');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.use(authenticate);
router.get('/', asyncHandler(listBills));
router.get('/history', asyncHandler(listHistory));
router.get('/next-number', asyncHandler(nextBillNumber));
router.post('/', asyncHandler(createBill));
router.get('/:billId', asyncHandler(getBillDetails));
router.put('/:billId', asyncHandler(updateBill));
router.patch('/:billId/status', asyncHandler(updateBillStatus));
router.delete('/:billId', asyncHandler(deleteBill));

module.exports = router;

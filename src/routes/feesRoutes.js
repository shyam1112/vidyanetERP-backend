const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getFees, getFee, getStudentFees, createFee, updateFee, deleteFee,
  getFeesSummary, getFeesChartData, addPayment, deletePayment,
} = require('../controllers/feesController');

router.use(protect);

router.route('/').get(getFees).post(createFee);
router.get('/summary', getFeesSummary);
router.get('/chart-data', getFeesChartData);
router.get('/student/:studentId', getStudentFees);
router.route('/:id').get(getFee).put(upload.single('receipt'), updateFee).delete(deleteFee);

// Payment installments
router.post('/:id/payments', addPayment);
router.delete('/:id/payments/:paymentId', deletePayment);

module.exports = router;

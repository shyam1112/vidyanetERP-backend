const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getAllFeeConfigs, getFeeConfigByClass, saveFeeConfig, deleteFeeConfig } = require('../controllers/feeConfigController');

router.use(protect);
router.get('/', getAllFeeConfigs);
router.get('/class/:class', getFeeConfigByClass);
router.put('/class/:class', saveFeeConfig);
router.delete('/class/:class', deleteFeeConfig);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getGradeConfig, saveGradeConfig } = require('../controllers/gradeConfigController');

router.use(protect);
router.get('/', getGradeConfig);
router.put('/', saveGradeConfig);

module.exports = router;

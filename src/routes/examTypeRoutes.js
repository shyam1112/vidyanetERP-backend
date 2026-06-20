const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getExamTypes, createExamType } = require('../controllers/examTypeController');

router.get('/', protect, getExamTypes);
router.post('/', protect, createExamType);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMarks,
  getMark,
  getStudentMarks,
  createMarks,
  updateMarks,
  deleteMarks,
  getClassReport,
  getUsedExamTypes,
} = require('../controllers/marksController');

router.use(protect);

router.route('/').get(getMarks).post(createMarks);
router.get('/class-report', getClassReport);
router.get('/used-exam-types', getUsedExamTypes);
router.get('/student/:studentId', getStudentMarks);
router.route('/:id').get(getMark).put(updateMarks).delete(deleteMarks);

module.exports = router;

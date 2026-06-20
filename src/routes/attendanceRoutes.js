const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAttendanceByDate, saveAttendance, getClassReport, getOverview, getStudentAttendance,
} = require('../controllers/attendanceController');

router.use(protect);

router.get('/overview', getOverview);
router.get('/report', getClassReport);
router.get('/student/:studentId', getStudentAttendance);
router.get('/', getAttendanceByDate);
router.post('/', saveAttendance);

module.exports = router;

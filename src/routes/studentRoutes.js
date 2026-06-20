const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');

router.use(protect);

router.route('/').get(getStudents).post(upload.single('photo'), createStudent);
router
  .route('/:id')
  .get(getStudent)
  .put(upload.single('photo'), updateStudent)
  .delete(deleteStudent);

module.exports = router;

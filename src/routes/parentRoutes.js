const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getParents,
  getParent,
  getParentByStudent,
  createParent,
  updateParent,
  deleteParent,
} = require('../controllers/parentController');

router.use(protect);

router.route('/').get(getParents).post(createParent);
router.get('/student/:studentId', getParentByStudent);
router.route('/:id').get(getParent).put(updateParent).delete(deleteParent);

module.exports = router;

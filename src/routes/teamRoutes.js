const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getTeam, addMember, updateMember, resetMemberPassword, deleteMember } = require('../controllers/teamController');

router.use(protect, adminOnly);

router.get('/', getTeam);
router.post('/', addMember);
router.put('/:id', updateMember);
router.put('/:id/reset-password', resetMemberPassword);
router.delete('/:id', deleteMember);

module.exports = router;

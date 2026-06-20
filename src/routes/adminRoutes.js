const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getRegistrations,
  getRegistration,
  approveRegistration,
  rejectRegistration,
  getSummary,
} = require('../controllers/adminController');

const superAdminOnly = (req, res, next) => {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Access denied. Super admin only.' });
  }
  next();
};

router.use(protect, superAdminOnly);

router.get('/registrations', getRegistrations);
router.get('/registrations/summary', getSummary);
router.get('/registrations/:id', getRegistration);
router.put('/registrations/:id/approve', approveRegistration);
router.put('/registrations/:id/reject', rejectRegistration);

module.exports = router;

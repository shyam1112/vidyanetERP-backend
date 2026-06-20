const User = require('../models/User');

const getRegistrations = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { role: { $ne: 'superadmin' } };
    if (status) query.status = status;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: users });
  } catch (error) {
    next(error);
  }
};

const getRegistration = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('approvedBy', 'name email');
    if (!user) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const approveRegistration = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (user.role === 'superadmin') {
      return res.status(400).json({ success: false, message: 'Cannot modify superadmin status' });
    }

    user.status = 'approved';
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    user.rejectedReason = undefined;
    await user.save();

    res.json({ success: true, message: `Registration approved for ${user.name} (${user.schoolName})` });
  } catch (error) {
    next(error);
  }
};

const rejectRegistration = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (user.role === 'superadmin') {
      return res.status(400).json({ success: false, message: 'Cannot modify superadmin status' });
    }

    user.status = 'rejected';
    user.rejectedReason = reason || '';
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    res.json({ success: true, message: `Registration rejected for ${user.name}` });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      User.countDocuments({ status: 'pending', role: { $ne: 'superadmin' } }),
      User.countDocuments({ status: 'approved', role: { $ne: 'superadmin' } }),
      User.countDocuments({ status: 'rejected', role: { $ne: 'superadmin' } }),
    ]);
    res.json({ success: true, data: { pending, approved, rejected, total: pending + approved + rejected } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRegistrations, getRegistration, approveRegistration, rejectRegistration, getSummary };

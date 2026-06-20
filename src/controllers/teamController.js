const User = require('../models/User');

const getTeam = async (req, res, next) => {
  try {
    const members = await User.find({ school: req.schoolId })
      .select('-password -resetOtp -resetOtpExpiry')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password and role are required' });
    }
    if (!['admin', 'teacher'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or teacher' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const member = await User.create({
      name,
      email,
      password,
      role,
      phone,
      school: req.schoolId,
      status: 'approved',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: { _id: member._id, name: member.name, email: member.email, role: member.role, phone: member.phone, isActive: member.isActive },
    });
  } catch (error) {
    next(error);
  }
};

const updateMember = async (req, res, next) => {
  try {
    const member = await User.findOne({ _id: req.params.id, school: req.schoolId });
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });

    const { name, phone, role, isActive } = req.body;
    if (role && !['admin', 'teacher'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or teacher' });
    }

    if (name !== undefined) member.name = name;
    if (phone !== undefined) member.phone = phone;
    if (role !== undefined) member.role = role;
    if (isActive !== undefined) member.isActive = isActive;

    await member.save();
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

const resetMemberPassword = async (req, res, next) => {
  try {
    const member = await User.findOne({ _id: req.params.id, school: req.schoolId });
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    member.password = password;
    await member.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteMember = async (req, res, next) => {
  try {
    const member = await User.findOneAndDelete({ _id: req.params.id, school: req.schoolId });
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    res.json({ success: true, message: 'Team member removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTeam, addMember, updateMember, resetMemberPassword, deleteMember };

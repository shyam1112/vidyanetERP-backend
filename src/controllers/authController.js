const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOtpEmail } = require('../utils/sendEmail');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const register = async (req, res, next) => {
  try {
    const { name, email, password, schoolName, phone, city, state, board, website, message } = req.body;

    if (!name || !email || !password || !schoolName || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, password, school name and phone are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    await User.create({
      name,
      email,
      password,
      schoolName,
      phone,
      city,
      state,
      board,
      website,
      message,
      role: 'admin',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Registration request submitted. Please wait for super admin approval before logging in.',
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Your registration is pending approval from the super admin.' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: `Your registration was rejected. ${user.rejectedReason ? 'Reason: ' + user.rejectedReason : ''}`,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    // For teachers/created-admins, fetch the parent school's name
    let schoolName = user.schoolName;
    if (!schoolName && user.school) {
      const schoolDoc = await User.findById(user.school).select('schoolName');
      schoolName = schoolDoc?.schoolName;
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolName,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  const u = req.user;
  res.json({
    success: true,
    user: {
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      schoolName: u.schoolName || u.school?.schoolName,
      phone: u.phone,
      address: u.address,
      city: u.city,
      state: u.state,
      board: u.board,
      website: u.website,
    },
  });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // Return success anyway to prevent email enumeration
      return res.json({ success: true, message: 'If that email is registered, an OTP has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    await sendOtpEmail(user.email, otp, user.name);

    res.json({ success: true, message: 'OTP sent to your email address.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOtp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    if (user.resetOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP' });
    }
    if (new Date() > user.resetOtpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['schoolName', 'phone', 'address', 'city', 'state', 'board', 'website'];
    const updates = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Old password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword, changePassword, updateProfile };

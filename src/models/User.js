const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['superadmin', 'admin', 'teacher', 'staff'], default: 'admin' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

    // School registration details
    schoolName: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    board: { type: String, enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'Other', ''] },
    website: { type: String, trim: true },
    message: { type: String, trim: true },

    // Approval tracking
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedReason: { type: String },

    isActive: { type: Boolean, default: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // for teacher/staff — points to their school admin

    // Password reset OTP
    resetOtp: { type: String },
    resetOtpExpiry: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

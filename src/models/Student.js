const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    rollNumber: { type: String, required: true },
    admissionDate: { type: Date, default: Date.now },
    academicYear: { type: String, required: true },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''] },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    phone: { type: String },
    email: { type: String, lowercase: true },
    photo: { type: String },
    isActive: { type: Boolean, default: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

// studentId unique per school; rollNumber unique per class+section per school
studentSchema.index({ school: 1, studentId: 1 }, { unique: true, sparse: true });
studentSchema.index({ school: 1, class: 1, section: 1, rollNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Student', studentSchema);

const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    father: {
      name: { type: String, trim: true },
      phone: { type: String },
      email: { type: String, lowercase: true },
      occupation: { type: String },
      qualification: { type: String },
      photo: { type: String },
    },
    mother: {
      name: { type: String, trim: true },
      phone: { type: String },
      email: { type: String, lowercase: true },
      occupation: { type: String },
      qualification: { type: String },
      photo: { type: String },
    },
    guardian: {
      name: { type: String, trim: true },
      phone: { type: String },
      email: { type: String, lowercase: true },
      relation: { type: String },
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    annualIncome: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Parent', parentSchema);

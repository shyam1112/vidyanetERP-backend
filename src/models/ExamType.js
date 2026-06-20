const mongoose = require('mongoose');

const examTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

examTypeSchema.index({ school: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ExamType', examTypeSchema);

const mongoose = require('mongoose');

const gradeConfigSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    grades: [
      {
        grade: { type: String, required: true },
        minPercent: { type: Number, required: true },
      },
    ],
    overallGrades: [
      {
        grade: { type: String, required: true },
        minPercent: { type: Number, required: true },
      },
    ],
    passPercent: { type: Number, default: 35 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GradeConfig', gradeConfigSchema);

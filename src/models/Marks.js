const mongoose = require('mongoose');

const DEFAULT_GRADES = [
  { grade: 'A+', minPercent: 90 },
  { grade: 'A',  minPercent: 80 },
  { grade: 'B+', minPercent: 70 },
  { grade: 'B',  minPercent: 60 },
  { grade: 'C',  minPercent: 50 },
  { grade: 'D',  minPercent: 35 },
  { grade: 'F',  minPercent: 0  },
];

function assignGrade(percentage, ranges) {
  const sorted = [...ranges].sort((a, b) => b.minPercent - a.minPercent);
  for (const r of sorted) {
    if (percentage >= r.minPercent) return r.grade;
  }
  return sorted[sorted.length - 1]?.grade || 'F';
}

const subjectMarkSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  obtainedMarks: { type: Number, required: true },
  grade: { type: String },
  gradeOverride: { type: Boolean, default: false },
  remarks: { type: String },
});

const marksSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    examType: { type: String, required: true, trim: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    academicYear: { type: String, required: true },
    examDate: { type: Date },
    subjects: [subjectMarkSchema],
    totalMaxMarks: { type: Number },
    totalObtainedMarks: { type: Number },
    percentage: { type: Number },
    overallGrade: { type: String },
    overallGradeOverride: { type: Boolean, default: false },
    rank: { type: Number },
    result: { type: String, enum: ['pass', 'fail', 'absent'], default: 'pass' },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

marksSchema.pre('save', async function () {
  if (!this.subjects || this.subjects.length === 0) return;

  this.totalMaxMarks = this.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
  this.totalObtainedMarks = this.subjects.reduce((sum, s) => sum + s.obtainedMarks, 0);
  this.percentage = parseFloat(((this.totalObtainedMarks / this.totalMaxMarks) * 100).toFixed(2));

  // Load school-specific grade config, fall back to defaults
  let gradeRanges = DEFAULT_GRADES;
  let overallGradeRanges = DEFAULT_GRADES;
  let passPercent = 35;
  if (this.school) {
    const GradeConfig = mongoose.model('GradeConfig');
    const config = await GradeConfig.findOne({ school: this.school });
    if (config && config.grades.length > 0) {
      gradeRanges = config.grades;
      passPercent = config.passPercent ?? 35;
    }
    if (config && config.overallGrades && config.overallGrades.length > 0) {
      overallGradeRanges = config.overallGrades;
    } else if (config && config.grades.length > 0) {
      overallGradeRanges = config.grades;
    }
  }

  // Assign per-subject grade (skip if manually overridden)
  this.subjects.forEach((s) => {
    if (!s.gradeOverride) {
      const pct = (s.obtainedMarks / s.maxMarks) * 100;
      s.grade = assignGrade(pct, gradeRanges);
    }
  });

  // Overall grade: skip if manually overridden
  if (!this.overallGradeOverride) {
    this.overallGrade = assignGrade(this.percentage, overallGradeRanges);
  }
  if (this.result !== 'absent') {
    this.result = this.percentage >= passPercent ? 'pass' : 'fail';
  }
});

module.exports = mongoose.model('Marks', marksSchema);

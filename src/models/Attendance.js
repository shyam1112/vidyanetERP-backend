const mongoose = require('mongoose');
const { Schema } = mongoose;

const recordSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  status:  { type: String, enum: ['present', 'absent', 'late', 'half-day'], required: true },
  remarks: { type: String, default: '' },
}, { _id: false });

const attendanceSchema = new Schema({
  school:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date:     { type: Date, required: true },
  class:    { type: String, required: true },
  section:  { type: String, required: true },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  records:  [recordSchema],
}, { timestamps: true });

attendanceSchema.index({ school: 1, date: 1, class: 1, section: 1 }, { unique: true });
attendanceSchema.index({ school: 1, date: 1 });
attendanceSchema.index({ school: 1, 'records.student': 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

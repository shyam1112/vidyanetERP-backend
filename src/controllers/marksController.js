const Marks = require('../models/Marks');
const Student = require('../models/Student');

const getMarks = async (req, res, next) => {
  try {
    const { studentId, class: cls, section, examType, academicYear, result, page = 1, limit = 20 } = req.query;
    const query = { school: req.schoolId };
    if (studentId) query.student = studentId;
    if (cls) query.class = cls;
    if (section) query.section = section;
    if (examType) query.examType = examType;
    if (academicYear) query.academicYear = academicYear;
    if (result) query.result = result;

    const total = await Marks.countDocuments(query);
    const marks = await Marks.find(query)
      .populate('student', 'firstName lastName studentId rollNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: marks });
  } catch (error) {
    next(error);
  }
};

const getMark = async (req, res, next) => {
  try {
    const mark = await Marks.findOne({ _id: req.params.id, school: req.schoolId }).populate(
      'student',
      'firstName lastName studentId class section rollNumber'
    );
    if (!mark) return res.status(404).json({ success: false, message: 'Marks record not found' });
    res.json({ success: true, data: mark });
  } catch (error) {
    next(error);
  }
};

const getStudentMarks = async (req, res, next) => {
  try {
    const marks = await Marks.find({ student: req.params.studentId, school: req.schoolId })
      .populate('student', 'firstName lastName studentId class section')
      .sort({ examDate: -1 });
    res.json({ success: true, data: marks });
  } catch (error) {
    next(error);
  }
};

const createMarks = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.body.student, school: req.schoolId });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const existing = await Marks.findOne({
      student: req.body.student,
      examType: req.body.examType,
      academicYear: req.body.academicYear,
    });
    if (existing) {
      const examLabel = req.body.examType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return res.status(400).json({
        success: false,
        message: `Marks for ${student.firstName} ${student.lastName} (Class ${student.class}-${student.section}, Roll No. ${student.rollNumber}) have already been entered for ${examLabel} – ${req.body.academicYear}. Please edit the existing record instead.`,
      });
    }

    const marks = await Marks.create({ ...req.body, school: req.schoolId });
    res.status(201).json({ success: true, data: marks });
  } catch (error) {
    next(error);
  }
};

const updateMarks = async (req, res, next) => {
  try {
    const marks = await Marks.findOneAndUpdate(
      { _id: req.params.id, school: req.schoolId },
      req.body,
      { new: true, runValidators: true }
    ).populate('student', 'firstName lastName studentId');
    if (!marks) return res.status(404).json({ success: false, message: 'Marks record not found' });
    res.json({ success: true, data: marks });
  } catch (error) {
    next(error);
  }
};

const deleteMarks = async (req, res, next) => {
  try {
    const marks = await Marks.findOneAndDelete({ _id: req.params.id, school: req.schoolId });
    if (!marks) return res.status(404).json({ success: false, message: 'Marks record not found' });
    res.json({ success: true, message: 'Marks deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getClassReport = async (req, res, next) => {
  try {
    const { class: cls, section, examType, academicYear } = req.query;
    const marks = await Marks.find({ class: cls, section, examType, academicYear, school: req.schoolId })
      .populate('student', 'firstName lastName studentId rollNumber')
      .sort({ percentage: -1 });

    marks.forEach((m, index) => { m.rank = index + 1; });

    res.json({ success: true, data: marks });
  } catch (error) {
    next(error);
  }
};

const getUsedExamTypes = async (req, res, next) => {
  try {
    const types = await Marks.distinct('examType', { school: req.schoolId });
    res.json({ success: true, data: types.filter(Boolean).sort() });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMarks, getMark, getStudentMarks, createMarks, updateMarks, deleteMarks, getClassReport, getUsedExamTypes };

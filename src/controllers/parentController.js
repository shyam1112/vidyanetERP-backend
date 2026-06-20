const Parent = require('../models/Parent');
const Student = require('../models/Student');
const { uploadToS3, deleteFromS3 } = require('../utils/s3Upload');

const getParents = async (req, res, next) => {
  try {
    const { studentId, page = 1, limit = 10 } = req.query;
    const query = {};
    if (studentId) query.student = studentId;

    const total = await Parent.countDocuments(query);
    const parents = await Parent.find(query)
      .populate('student', 'firstName lastName studentId class section')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: parents });
  } catch (error) {
    next(error);
  }
};

const getParent = async (req, res, next) => {
  try {
    const parent = await Parent.findById(req.params.id).populate(
      'student',
      'firstName lastName studentId class section'
    );
    if (!parent) return res.status(404).json({ success: false, message: 'Parent record not found' });
    res.json({ success: true, data: parent });
  } catch (error) {
    next(error);
  }
};

const getParentByStudent = async (req, res, next) => {
  try {
    const parent = await Parent.findOne({ student: req.params.studentId }).populate(
      'student',
      'firstName lastName studentId class section'
    );
    if (!parent) return res.status(404).json({ success: false, message: 'Parent record not found' });
    res.json({ success: true, data: parent });
  } catch (error) {
    next(error);
  }
};

const createParent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.body.student);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const existing = await Parent.findOne({ student: req.body.student });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Parent record already exists for this student' });
    }

    const parent = await Parent.create(req.body);
    res.status(201).json({ success: true, data: parent });
  } catch (error) {
    next(error);
  }
};

const updateParent = async (req, res, next) => {
  try {
    const parent = await Parent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('student', 'firstName lastName studentId class section');
    if (!parent) return res.status(404).json({ success: false, message: 'Parent record not found' });
    res.json({ success: true, data: parent });
  } catch (error) {
    next(error);
  }
};

const deleteParent = async (req, res, next) => {
  try {
    const parent = await Parent.findByIdAndDelete(req.params.id);
    if (!parent) return res.status(404).json({ success: false, message: 'Parent record not found' });
    res.json({ success: true, message: 'Parent record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getParents, getParent, getParentByStudent, createParent, updateParent, deleteParent };

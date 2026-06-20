const ExamType = require('../models/ExamType');

const DEFAULT_EXAMS = ['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final', 'Pre Board'];

const getExamTypes = async (req, res, next) => {
  try {
    const custom = await ExamType.find({ school: req.schoolId }).sort({ createdAt: 1 });
    const customNames = custom.map((e) => e.name);
    const defaults = DEFAULT_EXAMS.filter(
      (d) => !customNames.some((c) => c.toLowerCase() === d.toLowerCase())
    );
    res.json({ success: true, data: [...defaults, ...customNames] });
  } catch (error) {
    next(error);
  }
};

const createExamType = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ success: false, message: 'Exam name is required' });

    const isDefault = DEFAULT_EXAMS.some((d) => d.toLowerCase() === name.toLowerCase());
    if (isDefault) {
      return res.status(400).json({
        success: false,
        message: `"${name}" already exists as a default exam type.`,
      });
    }

    const existing = await ExamType.findOne({
      school: req.schoolId,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Exam type "${name}" already exists for your school.`,
      });
    }

    const examType = await ExamType.create({ name, school: req.schoolId });
    res.status(201).json({ success: true, data: examType });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExamTypes, createExamType };

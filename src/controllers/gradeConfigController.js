const GradeConfig = require('../models/GradeConfig');

const DEFAULT_GRADES = [
  { grade: 'A+', minPercent: 90 },
  { grade: 'A',  minPercent: 80 },
  { grade: 'B+', minPercent: 70 },
  { grade: 'B',  minPercent: 60 },
  { grade: 'C',  minPercent: 50 },
  { grade: 'D',  minPercent: 35 },
  { grade: 'F',  minPercent: 0  },
];

const DEFAULT_OVERALL_GRADES = [
  { grade: 'A+', minPercent: 90 },
  { grade: 'A',  minPercent: 80 },
  { grade: 'B+', minPercent: 70 },
  { grade: 'B',  minPercent: 60 },
  { grade: 'C',  minPercent: 50 },
  { grade: 'D',  minPercent: 35 },
  { grade: 'F',  minPercent: 0  },
];

const getGradeConfig = async (req, res, next) => {
  try {
    const config = await GradeConfig.findOne({ school: req.schoolId });
    if (!config) {
      return res.json({
        success: true,
        data: { grades: DEFAULT_GRADES, overallGrades: DEFAULT_OVERALL_GRADES, passPercent: 35 },
      });
    }
    // If saved config has no overallGrades yet, return defaults
    if (!config.overallGrades || config.overallGrades.length === 0) {
      config.overallGrades = DEFAULT_OVERALL_GRADES;
    }
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

const saveGradeConfig = async (req, res, next) => {
  try {
    const { grades, overallGrades, passPercent } = req.body;

    if (!grades || grades.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one subject grade range is required' });
    }
    if (!overallGrades || overallGrades.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one overall grade range is required' });
    }

    const config = await GradeConfig.findOneAndUpdate(
      { school: req.schoolId },
      { grades, overallGrades, passPercent: passPercent ?? 35 },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: config, message: 'Grade config saved successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGradeConfig, saveGradeConfig };

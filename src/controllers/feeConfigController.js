const FeeConfig = require('../models/FeeConfig');

// GET /api/fee-config?academicYear=2025-2026
const getAllFeeConfigs = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const query = { school: req.schoolId };
    if (academicYear) query.academicYear = academicYear;

    const configs = await FeeConfig.find(query).sort({ class: 1 });
    res.json({ success: true, data: configs });
  } catch (error) {
    next(error);
  }
};

// GET /api/fee-config/class/:class?academicYear=2025-2026
const getFeeConfigByClass = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const query = { school: req.schoolId, class: req.params.class };
    if (academicYear) query.academicYear = academicYear;

    const config = await FeeConfig.findOne(query);
    res.json({ success: true, data: config || null });
  } catch (error) {
    next(error);
  }
};

// PUT /api/fee-config/class/:class — upsert config for a class
const saveFeeConfig = async (req, res, next) => {
  try {
    const { feeItems, academicYear } = req.body;

    if (!feeItems || feeItems.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one fee item is required' });
    }
    if (!academicYear) {
      return res.status(400).json({ success: false, message: 'Academic year is required' });
    }

    const config = await FeeConfig.findOneAndUpdate(
      { school: req.schoolId, class: req.params.class, academicYear },
      { feeItems },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: config, message: 'Fee configuration saved' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/fee-config/class/:class?academicYear=2025-2026
const deleteFeeConfig = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const query = { school: req.schoolId, class: req.params.class };
    if (academicYear) query.academicYear = academicYear;

    await FeeConfig.findOneAndDelete(query);
    res.json({ success: true, message: 'Fee configuration removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllFeeConfigs, getFeeConfigByClass, saveFeeConfig, deleteFeeConfig };

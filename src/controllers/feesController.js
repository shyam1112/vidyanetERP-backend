const Fees = require('../models/Fees');
const Student = require('../models/Student');
const { uploadToS3 } = require('../utils/s3Upload');

const getFees = async (req, res, next) => {
  try {
    const { studentId, status, feeType, academicYear, page = 1, limit = 20 } = req.query;
    const query = { school: req.schoolId };
    if (studentId) query.student = studentId;
    if (status) query.status = status;
    if (feeType) query['feeItems.feeType'] = feeType;
    if (academicYear) query.academicYear = academicYear;

    const total = await Fees.countDocuments(query);
    const fees = await Fees.find(query)
      .populate('student', 'firstName lastName studentId class section rollNumber')
      .populate('collectedBy', 'name')
      .sort({ dueDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: fees });
  } catch (error) {
    next(error);
  }
};

const getFee = async (req, res, next) => {
  try {
    const fee = await Fees.findOne({ _id: req.params.id, school: req.schoolId })
      .populate('student', 'firstName lastName studentId class section rollNumber')
      .populate('collectedBy', 'name');
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
    res.json({ success: true, data: fee });
  } catch (error) {
    next(error);
  }
};

const getStudentFees = async (req, res, next) => {
  try {
    const fees = await Fees.find({ student: req.params.studentId, school: req.schoolId })
      .populate('student', 'firstName lastName studentId class section rollNumber')
      .sort({ dueDate: 1 });

    const summary = {
      totalAmount: fees.reduce((s, f) => s + f.finalAmount, 0),
      totalPaid: fees.filter((f) => f.status === 'paid').reduce((s, f) => s + f.finalAmount, 0),
      totalPending: fees.filter((f) => f.status !== 'paid').reduce((s, f) => s + f.finalAmount, 0),
    };

    res.json({ success: true, summary, data: fees });
  } catch (error) {
    next(error);
  }
};

const createFee = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.body.student, school: req.schoolId });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const fee = await Fees.create({ ...req.body, collectedBy: req.user._id, school: req.schoolId });
    res.status(201).json({ success: true, data: fee });
  } catch (error) {
    next(error);
  }
};

const updateFee = async (req, res, next) => {
  try {
    if (req.file) {
      req.body.receiptUrl = await uploadToS3(req.file, 'receipts');
    }
    if (req.body.status === 'paid' && !req.body.paidDate) {
      req.body.paidDate = new Date();
    }

    // Use save() so pre-save hook recalculates totalAmount / finalAmount
    const fee = await Fees.findOne({ _id: req.params.id, school: req.schoolId });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    Object.assign(fee, req.body);
    await fee.save();
    await fee.populate('student', 'firstName lastName studentId class section rollNumber');

    res.json({ success: true, data: fee });
  } catch (error) {
    next(error);
  }
};

// POST /api/fees/:id/payments — add one installment to an existing fee record
const addPayment = async (req, res, next) => {
  try {
    const { amount, paidDate, paymentMethod, transactionId, remarks } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
    }

    const fee = await Fees.findOne({ _id: req.params.id, school: req.schoolId });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    const balance = (fee.finalAmount || 0) - (fee.paidAmount || 0);
    if (Number(amount) > balance + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Payment ₹${amount} exceeds outstanding balance ₹${balance.toFixed(2)}`,
      });
    }

    fee.payments.push({
      amount:        Number(amount),
      paidDate:      paidDate || new Date(),
      paymentMethod: paymentMethod || '',
      transactionId: transactionId || '',
      remarks:       remarks || '',
      collectedBy:   req.user._id,
    });

    await fee.save();
    await fee.populate('student', 'firstName lastName studentId class section rollNumber');
    res.json({ success: true, data: fee });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/fees/:id/payments/:paymentId — remove a payment installment
const deletePayment = async (req, res, next) => {
  try {
    const fee = await Fees.findOne({ _id: req.params.id, school: req.schoolId });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    const idx = fee.payments.findIndex((p) => p._id.toString() === req.params.paymentId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Payment not found' });

    fee.payments.splice(idx, 1);
    await fee.save();
    await fee.populate('student', 'firstName lastName studentId class section rollNumber');
    res.json({ success: true, data: fee });
  } catch (error) {
    next(error);
  }
};

const deleteFee = async (req, res, next) => {
  try {
    const fee = await Fees.findOneAndDelete({ _id: req.params.id, school: req.schoolId });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
    res.json({ success: true, message: 'Fee record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getFeesSummary = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const matchStage = { school: req.schoolId };
    if (academicYear) matchStage.academicYear = academicYear;

    const summary = await Fees.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$finalAmount' },
        },
      },
    ]);

    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

const getFeesChartData = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const matchStage = { school: req.schoolId };
    if (academicYear) matchStage.academicYear = academicYear;

    const data = await Fees.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { student: '$student', status: '$status' },
          total: { $sum: '$finalAmount' },
        },
      },
      {
        $group: {
          _id: '$_id.student',
          paid: { $sum: { $cond: [{ $eq: ['$_id.status', 'paid'] }, '$total', 0] } },
          pending: { $sum: { $cond: [{ $ne: ['$_id.status', 'paid'] }, '$total', 0] } },
        },
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $project: {
          _id: 0,
          name: { $concat: ['$student.firstName', ' ', '$student.lastName'] },
          class: '$student.class',
          paid: 1,
          pending: 1,
        },
      },
      { $sort: { class: 1, name: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFees, getFee, getStudentFees, createFee, updateFee, deleteFee, getFeesSummary, getFeesChartData, addPayment, deletePayment };

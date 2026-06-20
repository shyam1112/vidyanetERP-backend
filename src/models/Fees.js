const mongoose = require('mongoose');

const FEE_TYPES = ['tuition', 'transport', 'library', 'sports', 'laboratory', 'examination', 'other'];
const PAYMENT_METHODS = ['cash', 'online', 'cheque', 'dd', ''];

const paymentSchema = new mongoose.Schema(
  {
    amount:        { type: Number, required: true, min: 0.01 },
    paidDate:      { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: '' },
    transactionId: { type: String, trim: true },
    remarks:       { type: String, trim: true },
    collectedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const feesSchema = new mongoose.Schema(
  {
    student:      { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    school:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    academicYear: { type: String, required: true },

    feeItems: [
      {
        feeType:     { type: String, enum: FEE_TYPES, required: true },
        description: { type: String, trim: true },
        amount:      { type: Number, required: true, min: 0 },
      },
    ],

    discount:      { type: Number, default: 0 },
    totalAmount:   { type: Number, default: 0 },
    finalAmount:   { type: Number, default: 0 },

    // Installment payments
    payments:      [paymentSchema],
    paidAmount:    { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },

    dueDate:  { type: Date },
    status:   { type: String, enum: ['pending', 'paid', 'overdue', 'partial'], default: 'pending' },
    remarks:  { type: String },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

feesSchema.index({ school: 1, student: 1 });
feesSchema.index({ school: 1, academicYear: 1, status: 1 });

feesSchema.pre('save', function () {
  this.totalAmount = (this.feeItems || []).reduce((sum, i) => sum + (i.amount || 0), 0);
  this.finalAmount = Math.max(0, this.totalAmount - (this.discount || 0));
  this.paidAmount  = (this.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  this.balanceAmount = Math.max(0, this.finalAmount - this.paidAmount);

  // Auto-compute status from payments
  // 'overdue' can only be set manually; once fully paid it flips to 'paid'
  if (this.paidAmount >= this.finalAmount && this.finalAmount > 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else if (this.status !== 'overdue') {
    this.status = 'pending';
  }
});

module.exports = mongoose.model('Fees', feesSchema);

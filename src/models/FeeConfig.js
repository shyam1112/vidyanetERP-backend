const mongoose = require('mongoose');

const FEE_TYPES = ['tuition', 'transport', 'library', 'sports', 'laboratory', 'examination', 'other'];

const feeConfigSchema = new mongoose.Schema(
  {
    school:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class:        { type: String, required: true },
    academicYear: { type: String, required: true },
    feeItems: [
      {
        feeType:     { type: String, enum: FEE_TYPES, required: true },
        description: { type: String, trim: true },
        amount:      { type: Number, required: true, min: 0 },
      },
    ],
  },
  { timestamps: true }
);

// One config per school + class + academicYear
feeConfigSchema.index({ school: 1, class: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('FeeConfig', feeConfigSchema);

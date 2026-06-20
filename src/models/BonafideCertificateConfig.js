const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    template: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BonafideCertificateConfig', schema);

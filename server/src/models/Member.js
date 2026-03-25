const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    memberId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    qrCodeText: { type: String, required: true, unique: true },
    qrCodeImage: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);

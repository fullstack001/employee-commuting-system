const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    date: { type: String, required: true },
    session: {
      type: String,
      enum: ['morning_check_in', 'morning_check_out', 'afternoon_check_in', 'afternoon_check_out'],
      required: true,
    },
    time: { type: Date, required: true },
    status: {
      type: String,
      enum: ['on_time', 'late', 'checked_out', 'manual'],
      required: true,
    },
    method: {
      type: String,
      enum: ['qr_scan', 'manual'],
      required: true,
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ member: 1, date: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

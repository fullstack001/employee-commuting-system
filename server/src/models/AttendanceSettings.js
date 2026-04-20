const mongoose = require('mongoose');

const attendanceSettingsSchema = new mongoose.Schema(
  {
    morningCheckInDeadline: { type: String, default: '09:00' },
    afternoonCheckInDeadline: { type: String, default: '13:00' },
    allowDuplicateScanProtection: { type: Boolean, default: true },
    allowAdminManualAttendance: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AttendanceSettings', attendanceSettingsSchema);

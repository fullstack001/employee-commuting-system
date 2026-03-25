const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AttendanceSettings = require('../models/AttendanceSettings');

async function seedAdmin() {
  const count = await User.countDocuments();
  if (count > 0) return;

  const hash = await bcrypt.hash('admin123', 10);
  await User.create({
    name: 'Super Admin',
    email: 'admin@example.com',
    password: hash,
    role: 'super_admin',
    unit: null,
    isActive: true,
  });

  const settingsCount = await AttendanceSettings.countDocuments();
  if (settingsCount === 0) {
    await AttendanceSettings.create({
      morningCheckInDeadline: '09:00',
      afternoonCheckInDeadline: '13:00',
      timezone: 'UTC',
      allowDuplicateScanProtection: true,
      allowAdminManualAttendance: false,
    });
  }

  console.log('Seeded default super admin: admin@example.com / admin123');
}

module.exports = { seedAdmin };

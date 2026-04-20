const AttendanceSettings = require('../models/AttendanceSettings');

async function getSingleton() {
  let doc = await AttendanceSettings.findOne();
  if (!doc) {
    doc = await AttendanceSettings.create({
      morningCheckInDeadline: '09:00',
      afternoonCheckInDeadline: '13:00',
      allowDuplicateScanProtection: true,
      allowAdminManualAttendance: false,
    });
  }
  return doc;
}

exports.get = async (req, res) => {
  try {
    const doc = await getSingleton();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      morningCheckInDeadline,
      afternoonCheckInDeadline,
      allowDuplicateScanProtection,
      allowAdminManualAttendance,
    } = req.body;
    let doc = await AttendanceSettings.findOne();
    if (!doc) doc = new AttendanceSettings();
    if (morningCheckInDeadline != null) doc.morningCheckInDeadline = morningCheckInDeadline;
    if (afternoonCheckInDeadline != null) doc.afternoonCheckInDeadline = afternoonCheckInDeadline;
    if (allowDuplicateScanProtection != null) {
      doc.allowDuplicateScanProtection = Boolean(allowDuplicateScanProtection);
    }
    if (allowAdminManualAttendance != null) {
      doc.allowAdminManualAttendance = Boolean(allowAdminManualAttendance);
    }
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.getSingleton = getSingleton;

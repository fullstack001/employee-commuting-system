const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const { getSingleton } = require('./settingsController');
const { getDateString, computeScanStatus, computeManualEntryStatus } = require('../utils/attendanceLogic');
const { unitScope } = require('../utils/scope');

exports.scan = async (req, res) => {
  try {
    const { qrCodeText, session } = req.body;
    if (!qrCodeText || !session) {
      return res.status(400).json({ message: 'qrCodeText and session are required' });
    }
    const settings = await getSingleton();
    const member = await Member.findOne({ qrCodeText: String(qrCodeText).trim(), isActive: true })
      .populate('unit')
      .populate('position');
    if (!member) {
      return res.status(404).json({ success: false, message: 'Invalid QR code or inactive member' });
    }
    const eventTime = new Date();
    const dateStr = getDateString(eventTime);
    const dup = await Attendance.findOne({
      member: member._id,
      date: dateStr,
      session,
    });
    if (dup && settings.allowDuplicateScanProtection) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded for this session today',
        data: { member: member.name, session, time: dup.time },
      });
    }
    const status = computeScanStatus({ session, eventTime, settings });
    const rec = await Attendance.create({
      member: member._id,
      unit: member.unit._id,
      position: member.position._id,
      date: dateStr,
      session,
      time: eventTime,
      status,
      method: 'qr_scan',
      addedBy: req.user._id,
      notes: '',
    });
    res.json({
      success: true,
      message: 'Attendance recorded successfully',
      data: {
        member: member.name,
        session,
        status,
        time: rec.time.toISOString(),
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded for this session today',
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.manual = async (req, res) => {
  try {
    const settings = await getSingleton();
    if (req.user.role === 'admin' && !settings.allowAdminManualAttendance) {
      return res.status(403).json({ message: 'Manual attendance is not enabled for admins' });
    }
    const { memberId, date, session, time, notes } = req.body;
    if (!memberId || !date || !session || !time) {
      return res.status(400).json({ message: 'memberId, date, session, and time are required' });
    }
    const member = await Member.findById(memberId).populate('unit').populate('position');
    if (!member || !member.isActive) {
      return res.status(404).json({ message: 'Member not found or inactive' });
    }
    if (req.user.role === 'user') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.role === 'admin' && req.user.unit && String(member.unit._id) !== String(req.user.unit)) {
      return res.status(403).json({ message: 'Member is outside your unit' });
    }
    const eventTime = new Date(time);
    if (Number.isNaN(eventTime.getTime())) {
      return res.status(400).json({ message: 'Invalid time' });
    }
    const dateStr = String(date).slice(0, 10);
    const status = computeManualEntryStatus({ session, eventTime, settings });
    const rec = await Attendance.create({
      member: member._id,
      unit: member.unit._id,
      position: member.position._id,
      date: dateStr,
      session,
      time: eventTime,
      status,
      method: 'manual',
      addedBy: req.user._id,
      notes: notes || '',
    });
    res.status(201).json(rec);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate session for this member on this date' });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const filter = { ...unitScope(req) };
    if (req.query.date) filter.date = req.query.date;
    if (req.query.unitId && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
      filter.unit = req.query.unitId;
    }
    if (req.query.memberId) filter.member = req.query.memberId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Attendance.find(filter)
        .populate('member', 'name memberId')
        .populate('unit', 'name code')
        .populate('position', 'name code')
        .populate('addedBy', 'name email')
        .sort({ date: -1, time: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);
    res.json({ items, total, page, limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.daily = async (req, res) => {
  try {
    const settings = await getSingleton();
    const date =
      req.query.date || getDateString(new Date());
    const filter = { date, ...unitScope(req) };
    if (req.query.unitId && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
      filter.unit = req.query.unitId;
    }
    const rows = await Attendance.find(filter)
      .populate('member', 'name memberId')
      .populate('unit', 'name code')
      .populate('position', 'name code')
      .sort({ time: 1 });
    res.json({ date, items: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.byMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.memberId);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    if (req.user.role === 'user' && req.user.unit && String(member.unit) !== String(req.user.unit)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const simpleFilter = { member: req.params.memberId };
    if (req.query.from || req.query.to) {
      simpleFilter.date = {};
      if (req.query.from) simpleFilter.date.$gte = req.query.from;
      if (req.query.to) simpleFilter.date.$lte = req.query.to;
    }
    const rows = await Attendance.find(simpleFilter)
      .populate('unit', 'name code')
      .populate('position', 'name code')
      .sort({ date: -1, time: -1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.byUnit = async (req, res) => {
  try {
    if (req.user.role === 'user' && req.user.unit && String(req.params.unitId) !== String(req.user.unit)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const filter = { unit: req.params.unitId };
    if (req.query.date) filter.date = req.query.date;
    const rows = await Attendance.find(filter)
      .populate('member', 'name memberId')
      .populate('position', 'name code')
      .sort({ date: -1, time: -1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

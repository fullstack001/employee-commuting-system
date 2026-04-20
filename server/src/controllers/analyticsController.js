const moment = require('moment');
const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const Unit = require('../models/Unit');
const { getSingleton } = require('./settingsController');
const { getDateString } = require('../utils/attendanceLogic');
const { unitScope } = require('../utils/scope');

exports.dashboard = async (req, res) => {
  try {
    const settings = await getSingleton();
    const today = getDateString(new Date());
    const scope = unitScope(req);
    const unitFilter = Object.keys(scope).length ? scope : {};

    const totalMembers = await Member.countDocuments({
      ...unitFilter,
      isActive: true,
    });
    const totalUnits = await Unit.countDocuments({ isActive: true });

    const todayAtt = await Attendance.find({ date: today, ...scope });
    const presentMemberIds = new Set(todayAtt.map((a) => String(a.member)));
    const presentToday = presentMemberIds.size;

    const lateToday = await Attendance.countDocuments({
      date: today,
      status: 'late',
      ...scope,
    });

    const membersInScope = await Member.find({ ...unitFilter, isActive: true }).select('_id');
    const memberIds = membersInScope.map((m) => m._id);
    const absentToday = memberIds.length
      ? memberIds.filter((id) => !presentMemberIds.has(String(id))).length
      : 0;

    const morningIn = await Attendance.countDocuments({
      date: today,
      session: 'morning_check_in',
      ...scope,
    });
    const afternoonIn = await Attendance.countDocuments({
      date: today,
      session: 'afternoon_check_in',
      ...scope,
    });

    res.json({
      totalUnits,
      totalMembers,
      presentToday,
      absentToday,
      lateToday,
      morningCheckInCount: morningIn,
      afternoonCheckInCount: afternoonIn,
      date: today,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unitSummary = async (req, res) => {
  try {
    const settings = await getSingleton();
    const today = getDateString(new Date());
    const scope = unitScope(req);
    const units = await Unit.find(Object.keys(scope).length ? { _id: scope.unit } : {}).sort({ name: 1 });
    const out = [];
    for (const u of units) {
      const mCount = await Member.countDocuments({ unit: u._id, isActive: true });
      const att = await Attendance.find({ date: today, unit: u._id });
      const present = new Set(att.map((a) => String(a.member))).size;
      const rate = mCount ? Math.round((present / mCount) * 1000) / 10 : 0;
      out.push({
        unitId: u._id,
        unitName: u.name,
        memberCount: mCount,
        presentToday: present,
        attendanceRate: rate,
      });
    }
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.monthlyTrend = async (req, res) => {
  try {
    const settings = await getSingleton();
    const months = parseInt(req.query.months, 10) || 6;
    const end = moment().startOf('month');
    const points = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const m = end.clone().subtract(i, 'months');
      const startStr = m.clone().startOf('month').format('YYYY-MM-DD');
      const endStr = m.clone().endOf('month').format('YYYY-MM-DD');
      const scope = unitScope(req);
      const count = await Attendance.countDocuments({
        date: { $gte: startStr, $lte: endStr },
        ...scope,
      });
      points.push({ month: m.format('YYYY-MM'), attendanceRecords: count });
    }
    res.json(points);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.lateSummary = async (req, res) => {
  try {
    const settings = await getSingleton();
    const from = req.query.from || moment().startOf('month').format('YYYY-MM-DD');
    const to = req.query.to || moment().format('YYYY-MM-DD');
    const scope = unitScope(req);
    const rows = await Attendance.aggregate([
      {
        $match: {
          status: 'late',
          date: { $gte: from, $lte: to },
          ...(scope.unit ? { unit: scope.unit } : {}),
        },
      },
      { $group: { _id: '$member', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const ids = rows.map((r) => r._id);
    const members = await Member.find({ _id: { $in: ids } }).select('name memberId');
    const map = Object.fromEntries(members.map((m) => [String(m._id), m]));
    const top = rows.map((r) => ({
      member: map[String(r._id)],
      lateCount: r.count,
    }));
    res.json({ from, to, topLateMembers: top });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const moment = require('moment-timezone');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Attendance = require('../models/Attendance');
const { getSingleton } = require('./settingsController');
const { unitScope } = require('../utils/scope');

async function fetchAttendanceRange(req, query) {
  const settings = await getSingleton();
  const tz = settings.timezone || 'UTC';
  const scope = unitScope(req);
  const filter = { ...scope };
  if (query.unitId && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
    filter.unit = query.unitId;
  }
  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = query.dateFrom;
    if (query.dateTo) filter.date.$lte = query.dateTo;
  } else {
    const end = moment().tz(tz).format('YYYY-MM-DD');
    const start = moment().tz(tz).subtract(30, 'days').format('YYYY-MM-DD');
    filter.date = { $gte: start, $lte: end };
  }
  return Attendance.find(filter)
    .populate('member', 'name memberId email')
    .populate('unit', 'name code')
    .populate('role', 'name code')
    .populate('addedBy', 'name email')
    .sort({ date: 1, time: 1 });
}

exports.daily = async (req, res) => {
  try {
    const settings = await getSingleton();
    const date = req.query.date || require('../utils/attendanceLogic').getDateStringInTz(new Date(), settings.timezone);
    const filter = { date, ...unitScope(req) };
    if (req.query.unitId && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
      filter.unit = req.query.unitId;
    }
    const rows = await Attendance.find(filter)
      .populate('member', 'name memberId')
      .populate('unit', 'name code')
      .populate('role', 'name code')
      .sort({ time: 1 });
    res.json({ date, items: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.monthly = async (req, res) => {
  try {
    const ym = req.query.month || new Date().toISOString().slice(0, 7);
    const [y, m] = ym.split('-').map((x) => parseInt(x, 10));
    const start = `${ym}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${ym}-${String(lastDay).padStart(2, '0')}`;
    const filter = { date: { $gte: start, $lte: end }, ...unitScope(req) };
    if (req.query.unitId && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
      filter.unit = req.query.unitId;
    }
    const rows = await Attendance.find(filter)
      .populate('member', 'name memberId')
      .populate('unit', 'name code')
      .populate('role', 'name code')
      .sort({ date: 1, time: 1 });
    res.json({ month: ym, from: start, to: end, items: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unitReport = async (req, res) => {
  try {
    if (req.user.role === 'user' && req.user.unit && String(req.params.unitId) !== String(req.user.unit)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const filter = { unit: req.params.unitId };
    if (req.query.dateFrom) filter.date = { ...filter.date, $gte: req.query.dateFrom };
    if (req.query.dateTo) {
      filter.date = filter.date || {};
      filter.date.$lte = req.query.dateTo;
    }
    const rows = await Attendance.find(filter)
      .populate('member', 'name memberId')
      .populate('role', 'name code')
      .sort({ date: -1, time: -1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.lateMembers = async (req, res) => {
  try {
    const settings = await getSingleton();
    const date = req.query.date || require('../utils/attendanceLogic').getDateStringInTz(new Date(), settings.timezone);
    const filter = {
      date,
      status: 'late',
      session: { $in: ['morning_check_in', 'afternoon_check_in'] },
      ...unitScope(req),
    };
    if (req.query.unitId && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
      filter.unit = req.query.unitId;
    }
    const rows = await Attendance.find(filter)
      .populate('member', 'name memberId')
      .populate('unit', 'name code')
      .sort({ time: 1 });
    res.json({ date, items: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    if (req.user.role === 'user') {
      return res.status(403).json({ message: 'Export not allowed' });
    }
    const rows = await fetchAttendanceRange(req, req.query);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');
    sheet.columns = [
      { header: 'Member ID', key: 'memberId', width: 18 },
      { header: 'Member Name', key: 'memberName', width: 24 },
      { header: 'Unit', key: 'unit', width: 16 },
      { header: 'Role', key: 'role', width: 16 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Session', key: 'session', width: 22 },
      { header: 'Time', key: 'time', width: 22 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Method', key: 'method', width: 10 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];
    rows.forEach((r) => {
      sheet.addRow({
        memberId: r.member && r.member.memberId,
        memberName: r.member && r.member.name,
        unit: r.unit && r.unit.name,
        role: r.role && r.role.name,
        date: r.date,
        session: r.session,
        time: r.time ? new Date(r.time).toISOString() : '',
        status: r.status,
        method: r.method,
        notes: r.notes || '',
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-export.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportPdf = async (req, res) => {
  try {
    if (req.user.role === 'user') {
      return res.status(403).json({ message: 'Export not allowed' });
    }
    const rows = await fetchAttendanceRange(req, req.query);
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.pdf"');
    doc.pipe(res);
    doc.fontSize(18).text('Attendance Report', { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(
      `Range: ${req.query.dateFrom || 'start'} — ${req.query.dateTo || 'end'} | Generated: ${new Date().toISOString()}`
    );
    doc.moveDown();
    doc.fontSize(9).text(`Total records: ${rows.length}`);
    doc.moveDown(0.5);
    let y = doc.y;
    const line = (txt) => {
      if (y > 720) {
        doc.addPage();
        y = 40;
      }
      doc.text(txt, 40, y, { width: 520 });
      y = doc.y + 4;
    };
    rows.slice(0, 500).forEach((r) => {
      line(
        `${r.date} | ${(r.member && r.member.memberId) || ''} ${(r.member && r.member.name) || ''} | ${(r.unit && r.unit.name) || ''} | ${r.session} | ${r.status} | ${r.time ? new Date(r.time).toISOString() : ''}`
      );
    });
    if (rows.length > 500) line('... truncated ...');
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

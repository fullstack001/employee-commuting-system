const moment = require('moment-timezone');

function getDateStringInTz(date, tz) {
  return moment(date).tz(tz).format('YYYY-MM-DD');
}

function computeScanStatus({ session, eventTime, settings }) {
  const tz = settings.timezone || 'UTC';
  if (session === 'morning_check_out' || session === 'afternoon_check_out') {
    return 'checked_out';
  }
  const m = moment(eventTime).tz(tz);
  const dateStr = m.format('YYYY-MM-DD');
  const deadlineStr =
    session === 'morning_check_in'
      ? settings.morningCheckInDeadline
      : settings.afternoonCheckInDeadline;
  const parts = deadlineStr.split(':').map((p) => parseInt(p, 10));
  const h = parts[0] || 9;
  const min = parts[1] || 0;
  const deadline = moment.tz(
    `${dateStr} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`,
    'YYYY-MM-DD HH:mm:ss',
    tz
  );
  const actual = moment(eventTime).tz(tz);
  return actual.isAfter(deadline) ? 'late' : 'on_time';
}

/** Manual entries use the same status rules; method field distinguishes manual vs scan. */
function computeManualEntryStatus({ session, eventTime, settings }) {
  return computeScanStatus({ session, eventTime, settings });
}

module.exports = {
  getDateStringInTz,
  computeScanStatus,
  computeManualEntryStatus,
};

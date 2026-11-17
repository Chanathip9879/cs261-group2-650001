// server/utils/effectiveHours.js
// Effective open/close status from vendor isOpen + today's weekly row (Asia/Bangkok).
// Shared by shopController for filtering, sorting and response enrichment.

const DAY_INDEX = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function bangkokParts(now = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const p = Object.fromEntries(fmt.formatToParts(now).map((part) => [part.type, part.value]));
  return {
    dayOfWeek: DAY_INDEX.indexOf(p.weekday),
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: Number(p.hour) * 60 + Number(p.minute),
  };
}

function toMinutes(value) {
  if (typeof value !== 'string' || !/^\d{1,2}:\d{2}$/.test(value)) return NaN;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function getTodayRow(rows, dayOfWeek) {
  return (rows || []).find((row) => row.day_of_week === dayOfWeek) || null;
}

function getEffectiveStatus(shop, weeklyRows = [], specialHolidays = [], now = new Date()) {
  const parts = bangkokParts(now);
  const fallbackText = shop && shop.openingHours ? shop.openingHours : '';
  const holiday = (specialHolidays || []).find((h) => h.date === parts.date);
  const row = getTodayRow(weeklyRows, parts.dayOfWeek);
  const source = holiday && holiday.is_closed !== true && holiday.open_time && holiday.close_time
    ? { is_closed: false, open_time: holiday.open_time, close_time: holiday.close_time }
    : row;

  let todayText = fallbackText || '-';
  if (holiday && holiday.is_closed === true) {
    todayText = holiday.note ? `หยุด: ${holiday.note}` : 'วันหยุดพิเศษ';
  } else if (source && source.is_closed) {
    todayText = 'ปิดทำการวันนี้';
  } else if (source && source.open_time && source.close_time) {
    todayText = `${source.open_time} - ${source.close_time} น.`;
  }

  const base = { open: false, todayText, reason: 'vendor_closed' };
  if (!shop || shop.isOpen !== true) return base;
  if (holiday && holiday.is_closed === true) return { ...base, reason: 'holiday' };
  if (source && source.is_closed) return { ...base, reason: 'closed_today' };
  if (!source || !source.open_time || !source.close_time) {
    return { ...base, open: true, todayText: fallbackText || 'ยังไม่ระบุเวลา', reason: 'no_schedule' };
  }

  const start = toMinutes(source.open_time);
  const end = toMinutes(source.close_time);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { ...base, open: true, reason: 'no_schedule' };
  }
  const open = parts.minutes >= start && parts.minutes < end;
  return { open, todayText, reason: open ? 'within_hours' : 'outside_hours' };
}

module.exports = { bangkokParts, toMinutes, getTodayRow, getEffectiveStatus };

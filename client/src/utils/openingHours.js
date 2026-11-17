// client/src/utils/openingHours.js
// ตัวช่วยเกี่ยวกับเวลาเปิด-ปิดรายวัน (U12, U13)
// day_of_week: 0 = อาทิตย์ ... 6 = เสาร์ (ตรงกับ Date.getDay() และตาราง opening_hours)

export const DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const DAY_NAMES_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAY_INITIALS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ลำดับการแสดงผล จันทร์ -> อาทิตย์ (ตามดีไซน์ Figma)
export const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const DEFAULT_OPEN = '07:00';
const DEFAULT_CLOSE = '15:30';

// แปลงข้อความเดิม เช่น "07:00 - 15:30" เป็น { open, close } ใช้เป็นค่าเริ่มต้น
export function parseLegacyHours(text) {
  const m = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/.exec(text || '');
  if (!m) return { open: DEFAULT_OPEN, close: DEFAULT_CLOSE };
  const pad = (t) => t.padStart(5, '0');
  return { open: pad(m[1]), close: pad(m[2]) };
}

export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// สร้างข้อมูลครบ 7 วัน (เรียงตาม day_of_week 0-6) จาก rows ที่ได้จาก API
// วันที่ไม่มีข้อมูล จะใช้ค่าเริ่มต้นจากข้อความเวลาเดิมของร้าน
export function buildFullWeek(rows, legacyText) {
  const fallback = parseLegacyHours(legacyText);
  return Array.from({ length: 7 }, (_, day) => {
    const found = (rows || []).find((r) => r.day_of_week === day);
    if (found) {
      return {
        day_of_week: day,
        is_closed: !!found.is_closed,
        open_time: found.open_time || fallback.open,
        close_time: found.close_time || fallback.close
      };
    }
    return { day_of_week: day, is_closed: false, open_time: fallback.open, close_time: fallback.close };
  });
}
// Find today's row using Asia/Bangkok day (not the browser's local day)
export function getTodayRow(rows, now = new Date()) {
  const day = getBangkokParts(now).dayOfWeek;
  return (rows || []).find((r) => r.day_of_week === day) || null;
}

const DAY_INDEX_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getBangkokParts(now = new Date()) {
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
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  return {
    dayOfWeek: DAY_INDEX_EN.indexOf(parts.weekday),
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function holidayForToday(shop, date) {
  const lists = [shop?.todayHolidays, shop?.special_holidays, shop?.opening_hours?.special_holidays];
  for (const list of lists) {
    if (Array.isArray(list)) {
      const found = list.find((h) => h.date === date);
      if (found) return found;
    }
  }
  return null;
}

// Effective customer-facing status: vendor switch AND today's schedule/holiday.
// Returns { open, todayText, reason }.
export function getEffectiveStatus(shop, weeklyRows, now = new Date()) {
  const parts = getBangkokParts(now);
  const fallbackText = shop?.openingHours || '';
  const holiday = holidayForToday(shop, parts.date);
  const row = getTodayRow(weeklyRows, now);
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

  const start = timeToMinutes(source.open_time);
  const end = timeToMinutes(source.close_time);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { ...base, open: true, reason: 'no_schedule' };
  }
  const open = parts.minutes >= start && parts.minutes < end;
  return { open, todayText, reason: open ? 'within_hours' : 'outside_hours' };
}

// ตรวจความถูกต้อง คืน { [day_of_week]: ข้อความ error }
export function validateWeek(week) {
  const errors = {};
  week.forEach((d) => {
    if (d.is_closed) return;
    if (!d.open_time || !d.close_time) {
      errors[d.day_of_week] = 'กรุณาระบุเวลาเปิดและเวลาปิด';
    } else if (timeToMinutes(d.open_time) >= timeToMinutes(d.close_time)) {
      errors[d.day_of_week] = 'เวลาเปิดต้องน้อยกว่าเวลาปิด';
    }
  });
  return errors;
}

// แปลงเป็นรูปแบบที่ API รับ (ส่งทั้ง 7 วัน)
export function weekToPayload(week) {
  return week.map((d) => ({
    day_of_week: d.day_of_week,
    is_closed: d.is_closed,
    open_time: d.is_closed ? null : d.open_time,
    close_time: d.is_closed ? null : d.close_time
  }));
}

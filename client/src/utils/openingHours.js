// client/src/utils/openingHours.js
// ตัวช่วยเกี่ยวกับเวลาเปิด-ปิดรายวัน (U12, U13)
// day_of_week: 0 = อาทิตย์ ... 6 = เสาร์ (ตรงกับ Date.getDay() และตาราง opening_hours)

export const DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

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

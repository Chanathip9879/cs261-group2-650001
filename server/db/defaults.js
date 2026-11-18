// server/db/defaults.js
// ค่าเริ่มต้นของข้อมูล Sprint 2 (รีวิว / เวลาเปิด-ปิด)
// ย้ายมาจาก server/utils/dbAdapter.js — ที่เก็บจริงคือ DB (MSSQL หรือ JSON) ไม่ใช่ไฟล์ store แล้ว

const DEFAULT_WEEKLY_HOURS = [
  { day_of_week: 0, day_name: 'อาทิตย์', is_closed: true, open_time: null, close_time: null },
  { day_of_week: 1, day_name: 'จันทร์', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 2, day_name: 'อังคาร', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 3, day_name: 'พุธ', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 4, day_name: 'พฤหัสบดี', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 5, day_name: 'ศุกร์', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 6, day_name: 'เสาร์', is_closed: false, open_time: '09:00', close_time: '17:00' }
];

function cloneWeeklyHours(hours = DEFAULT_WEEKLY_HOURS) {
  return hours.map((day) => ({ ...day }));
}

// ข้อมูลตั้งต้นสำหรับรีเซ็ตก่อนรันเทสต์ (เดิมอยู่ใน sprint2_store.json / dbAdapter.js)
const INITIAL_REVIEWS = [
  {
    id: 'rev-init-001',
    shop_id: 'shop-test-01',
    username: 'นักศึกษาปี 2 คณะวิทย์',
    rating: 5,
    comment: 'ไก่เนื้อน่องต้มสดใหม่ฉ่ำมาก ให้ปริมาณข้าวและเนื้อเยอะคุ้มราคานักศึกษา',
    client_ip: '127.0.0.1',
    created_at: '2026-11-14T11:30:00.000Z'
  }
];

// วันหยุดพิเศษตั้งต้นของร้านทดสอบ
// ไม่กำหนด weekly ตายตัวแล้ว — เวลาเปิด-ปิดรายสัปดาห์ seed จากสตริง openingHours ของแต่ละร้าน
// เพื่อให้ตรงกับ database.json (เช่น shop-test-01 = "08:00 - 21:00" ทุกวัน)
const INITIAL_SPECIAL_HOLIDAYS = {
  'shop-test-01': [
    {
      id: 'hol-init-001',
      date: '2026-12-05',
      is_closed: true,
      open_time: null,
      close_time: null,
      note: 'หยุดวันพ่อแห่งชาติ'
    }
  ],
  'shop-test-03': []
};

// แปลงข้อความเวลาเปิด-ปิดของร้าน (เช่น "08:00 - 21:00") เป็นตารางรายสัปดาห์
// เปิดทุกวัน (จันทร์-อาทิตย์) เวลาเดียวกัน คืน null เมื่อรูปแบบไม่รู้จัก
function parseWeeklyFromShopText(text) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)$/.exec(
    String(text || '').trim()
  );
  if (!match) return null;

  const openTime = `${match[1]}:${match[2]}`;
  const closeTime = `${match[3]}:${match[4]}`;
  return DEFAULT_WEEKLY_HOURS.map((day) => ({
    day_of_week: day.day_of_week,
    day_name: day.day_name,
    is_closed: false,
    open_time: openTime,
    close_time: closeTime
  }));
}

// สร้างเวลาเปิด-ปิดตั้งต้นของทุกร้านจากสตริง openingHours แล้วเติมวันหยุดพิเศษตั้งต้น
// คืน Map: shop_id -> { shop_id, weekly, special_holidays, updated_at }
// ใช้ร่วมกันทั้ง seed ของ MSSQL (schema.js) และโหมด JSON (jsonRepository.js)
function buildOpeningHoursSeed(shops = []) {
  const byShop = new Map();

  for (const shop of shops) {
    const weekly = parseWeeklyFromShopText(shop.openingHours);
    // ร้านที่ไม่มีรูปแบบเวลาเปิด-ปิดที่รู้จัก จะไม่ถูกสร้างแถวเวลาเปิด-ปิดเลย
    if (!weekly) continue;
    byShop.set(shop.id, {
      shop_id: shop.id,
      weekly,
      special_holidays: [],
      updated_at: null
    });
  }

  for (const [shopId, holidays] of Object.entries(INITIAL_SPECIAL_HOLIDAYS)) {
    const record = byShop.get(shopId);
    if (!record) continue;
    record.special_holidays = holidays.map((holiday) => ({ ...holiday }));
  }

  return byShop;
}

module.exports = {
  DEFAULT_WEEKLY_HOURS,
  cloneWeeklyHours,
  INITIAL_REVIEWS,
  INITIAL_SPECIAL_HOLIDAYS,
  parseWeeklyFromShopText,
  buildOpeningHoursSeed
};

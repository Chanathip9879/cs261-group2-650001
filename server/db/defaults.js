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

const INITIAL_OPENING_HOURS = {
  'shop-test-01': {
    weekly: cloneWeeklyHours(),
    special_holidays: [
      {
        id: 'hol-init-001',
        date: '2026-12-05',
        is_closed: true,
        open_time: null,
        close_time: null,
        note: 'หยุดวันพ่อแห่งชาติ'
      }
    ]
  },
  'shop-test-03': {
    weekly: cloneWeeklyHours(),
    special_holidays: []
  }
};

module.exports = {
  DEFAULT_WEEKLY_HOURS,
  cloneWeeklyHours,
  INITIAL_REVIEWS,
  INITIAL_OPENING_HOURS
};

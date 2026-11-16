const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
// sprint2_store.json เก็บเฉพาะข้อมูล Sprint 2 (reviews, opening_hours)
const STORE_FILE = path.join(DATA_DIR, 'sprint2_store.json');
// รายชื่อร้านจริงทั้งหมดมาจาก database.json (ไฟล์เดียวกับที่ shopController ใช้)
const DATABASE_FILE = path.join(DATA_DIR, 'database.json');

const DEFAULT_WEEKLY_HOURS = [
  { day_of_week: 0, day_name: 'อาทิตย์', is_closed: true, open_time: null, close_time: null },
  { day_of_week: 1, day_name: 'จันทร์', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 2, day_name: 'อังคาร', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 3, day_name: 'พุธ', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 4, day_name: 'พฤหัสบดี', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 5, day_name: 'ศุกร์', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 6, day_name: 'เสาร์', is_closed: false, open_time: '09:00', close_time: '17:00' }
];

// รายชื่อร้านไม่ได้เก็บในไฟล์นี้แล้ว — ใช้จาก database.json เป็นแหล่งเดียว (ดู readShops)
const INITIAL_DATA = {
  reviews: [
    {
      id: 'rev-init-001',
      shop_id: 'shop-test-01',
      username: 'นักศึกษาปี 2 คณะวิทย์',
      rating: 5,
      comment: 'ไก่เนื้อน่องต้มสดใหม่ฉ่ำมาก ให้ปริมาณข้าวและเนื้อเยอะคุ้มราคานักศึกษา',
      client_ip: '127.0.0.1',
      created_at: '2026-11-14T11:30:00.000Z'
    }
  ],
  opening_hours: {
    'shop-test-01': {
      weekly: JSON.parse(JSON.stringify(DEFAULT_WEEKLY_HOURS)),
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
      weekly: JSON.parse(JSON.stringify(DEFAULT_WEEKLY_HOURS)),
      special_holidays: []
    }
  }
};

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf8');
  }
}

/**
 * อ่านรายชื่อร้านจาก database.json แล้วแปลงให้อยู่ในรูปที่ route ของ Sprint 2 ใช้
 * - เพิ่ม is_open / status จาก isOpen (nearbyShops ใช้ field นี้กรองร้านที่เปิด)
 * - ตัด pin ออกเสมอ เพราะบาง route ส่ง object ร้านกลับไปทั้งก้อน
 */
function readShops() {
  const db = JSON.parse(fs.readFileSync(DATABASE_FILE, 'utf8'));
  const shops = Array.isArray(db.shops) ? db.shops : [];
  return shops.map((shop) => {
    const { pin, ...publicShop } = shop;
    const isOpen = shop.isOpen === true;
    return {
      ...publicShop,
      is_open: isOpen,
      status: isOpen ? 'OPEN' : 'CLOSED'
    };
  });
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(STORE_FILE, 'utf8');
  const stored = JSON.parse(raw);
  // ไม่ใช้ shops ที่อาจค้างอยู่ในไฟล์ store รุ่นเก่า (ร้านทดสอบ 5 ร้าน)
  return { ...stored, shops: readShops() };
}

function writeStore(data) {
  ensureStore();
  // ร้านเป็นของ database.json — ไม่เขียนสำเนาลง sprint2_store.json
  const { shops, ...persisted } = data;
  fs.writeFileSync(STORE_FILE, JSON.stringify(persisted, null, 2), 'utf8');
}

function resetStore() {
  ensureStore();
  fs.writeFileSync(STORE_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf8');
}

module.exports = {
  DEFAULT_WEEKLY_HOURS,
  readShops,
  readStore,
  writeStore,
  resetStore
};
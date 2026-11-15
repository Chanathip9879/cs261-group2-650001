const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'sprint2_store.json');

const DEFAULT_WEEKLY_HOURS = [
  { day_of_week: 0, day_name: 'อาทิตย์', is_closed: true, open_time: null, close_time: null },
  { day_of_week: 1, day_name: 'จันทร์', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 2, day_name: 'อังคาร', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 3, day_name: 'พุธ', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 4, day_name: 'พฤหัสบดี', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 5, day_name: 'ศุกร์', is_closed: false, open_time: '08:00', close_time: '19:00' },
  { day_of_week: 6, day_name: 'เสาร์', is_closed: false, open_time: '09:00', close_time: '17:00' }
];

const INITIAL_DATA = {
  shops: [
    {
      id: 'shop-green-01',
      name: 'ข้าวมันไก่เจ๊หงษ์',
      canteen: 'Green Canteen',
      category: 'อาหารจานเดียว',
      status: 'OPEN',
      is_open: true,
      latitude: 14.07365,
      longitude: 100.60142,
      owner_id: 'owner-green-01'
    },
    {
      id: 'shop-sci-01',
      name: 'ก๋วยเตี๋ยวเรือตึก SC',
      canteen: 'SC Canteen',
      category: 'ก๋วยเตี๋ยว',
      status: 'OPEN',
      is_open: true,
      latitude: 14.07015,
      longitude: 100.60588,
      owner_id: 'owner-sci-01'
    },
    {
      id: 'shop-inter-01',
      name: 'ตามสั่งอินเตอร์โซน',
      canteen: 'Interzone',
      category: 'อาหารตามสั่ง',
      status: 'OPEN',
      is_open: true,
      latitude: 14.06845,
      longitude: 100.60795,
      owner_id: 'owner-inter-01'
    },
    {
      id: 'shop-closed-01',
      name: 'ร้านน้ำปั่นปิดชั่วคราว',
      canteen: 'Green Canteen',
      category: 'เครื่องดื่ม',
      status: 'CLOSED',
      is_open: false,
      latitude: 14.07370,
      longitude: 100.60150,
      owner_id: 'owner-closed-01'
    },
    {
      id: 'shop-nocoord-01',
      name: 'ร้านขนมหวานยังไม่มีพิกัด',
      canteen: 'JC Canteen',
      category: 'ของหวาน',
      status: 'OPEN',
      is_open: true,
      latitude: null,
      longitude: null,
      owner_id: 'owner-nocoord-01'
    }
  ],
  reviews: [
    {
      id: 'rev-init-001',
      shop_id: 'shop-green-01',
      username: 'นักศึกษาปี 2 คณะวิทย์',
      rating: 5,
      comment: 'ไก่เนื้อน่องต้มสดใหม่ฉ่ำมาก ให้ปริมาณข้าวและเนื้อเยอะคุ้มราคานักศึกษา',
      client_ip: '127.0.0.1',
      created_at: '2026-11-14T11:30:00.000Z'
    }
  ],
  opening_hours: {
    'shop-green-01': {
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
    'shop-sci-01': {
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

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(STORE_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function resetStore() {
  ensureStore();
  fs.writeFileSync(STORE_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf8');
}

module.exports = {
  DEFAULT_WEEKLY_HOURS,
  readStore,
  writeStore,
  resetStore
};
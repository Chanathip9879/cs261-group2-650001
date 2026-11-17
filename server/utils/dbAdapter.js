// server/utils/dbAdapter.js
// ชั้นความเข้ากันได้สำหรับโค้ด/เทสต์เดิม
// ข้อมูล Sprint 2 (reviews / opening_hours / special_holidays) ย้ายไปเก็บใน DB แล้ว
// (MSSQL เมื่อ DB_DRIVER=mssql หรือไฟล์ JSON เมื่อ DB_DRIVER=json) ผ่าน server/db

const fs = require('fs');
const path = require('path');

const db = require('../db');
const { DEFAULT_WEEKLY_HOURS } = require('../db/defaults');

const DATABASE_FILE = path.join(__dirname, '..', 'data', 'database.json');

// รายชื่อร้านอ่านจาก database.json (ใช้โดยเทสต์เพื่อคำนวณผลที่คาดหวัง)
function readShops() {
  const data = JSON.parse(fs.readFileSync(DATABASE_FILE, 'utf8'));
  const shops = Array.isArray(data.shops) ? data.shops : [];
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

// เทสต์เรียกก่อนรันทุกครั้ง — รีเซ็ตข้อมูล Sprint 2 ผ่าน DB
async function resetStore() {
  return db.resetSprint2Data();
}

module.exports = {
  DEFAULT_WEEKLY_HOURS,
  readShops,
  resetStore
};

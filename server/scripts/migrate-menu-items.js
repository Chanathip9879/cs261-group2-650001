// server/scripts/migrate-menu-items.js
// Task26 (U6): ย้ายเมนูจาก shops[].menus ไปเป็นตาราง menu_items แยกต่างหาก
//
// วิธีรัน (จากโฟลเดอร์รากของโปรเจกต์):
//   node server/scripts/migrate-menu-items.js
//
// สิ่งที่สคริปต์ทำ:
//   1. นับจำนวนเมนูก่อนย้าย (ใน shops[].menus)
//   2. สร้าง db.menu_items โดยแต่ละรายการมี id, restaurant_id, name, price, is_sold_out
//      - isAvailable เดิม "กลับค่า" เป็น is_sold_out (available=true -> sold_out=false)
//   3. ลบ key menus ออกจากแต่ละร้าน (ย้ายจริง ไม่เก็บซ้ำสองที่)
//   4. นับจำนวนเมนูหลังย้าย แล้วเทียบกับก่อนย้าย ถ้าไม่เท่ากันจะไม่บันทึกไฟล์
//
// รันซ้ำได้อย่างปลอดภัย: ถ้า menu_items มีอยู่แล้วและไม่มี menus ในร้านแล้ว จะไม่ทำอะไร

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.json');
const BACKUP_PATH = path.join(__dirname, '../data/database.backup-before-menu-items.json');

const raw = fs.readFileSync(DB_PATH, 'utf-8');
const db = JSON.parse(raw);

const countBefore = db.shops.reduce((n, s) => n + (s.menus ? s.menus.length : 0), 0);

if (countBefore === 0 && Array.isArray(db.menu_items)) {
  console.log('ข้อมูลถูกย้ายไปแล้ว ไม่ต้องทำซ้ำ (menu_items =', db.menu_items.length, 'รายการ)');
  process.exit(0);
}

const menuItems = [];
const soldOutBefore = [];

for (const shop of db.shops) {
  for (const m of shop.menus || []) {
    if (m.isAvailable === false) soldOutBefore.push(m.id);
    menuItems.push({
      id: m.id,
      restaurant_id: shop.id,
      name: m.name,
      price: m.price,
      is_sold_out: m.isAvailable === false, // กลับค่า: isAvailable=false -> is_sold_out=true
    });
  }
}

const countAfter = menuItems.length;
const soldOutAfter = menuItems.filter((m) => m.is_sold_out).map((m) => m.id);
const idsUnique = new Set(menuItems.map((m) => m.id)).size === countAfter;

console.log('===== ผลการย้ายเมนู =====');
console.log('จำนวนเมนูก่อนย้าย (shops[].menus) :', countBefore);
console.log('จำนวนเมนูหลังย้าย (menu_items)    :', countAfter);
console.log('จำนวนเมนูหมด (is_sold_out = true)  :', soldOutAfter.length, `(เดิม isAvailable=false: ${soldOutBefore.length})`);
console.log('id ไม่ซ้ำกัน                        :', idsUnique);

if (countBefore !== countAfter || soldOutBefore.length !== soldOutAfter.length || !idsUnique) {
  console.error('ผิดพลาด: จำนวนไม่ตรงกัน หยุดการทำงาน ไม่บันทึกไฟล์');
  process.exit(1);
}

// สำรองไฟล์เดิมก่อนเขียนทับ
fs.writeFileSync(BACKUP_PATH, raw, 'utf-8');

for (const shop of db.shops) {
  delete shop.menus;
}
db.menu_items = menuItems;

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
console.log('บันทึกเรียบร้อย ผลตรวจ: ก่อน', countBefore, '= หลัง', countAfter, '(ตรงกัน)');
console.log('ไฟล์สำรองอยู่ที่:', path.relative(process.cwd(), BACKUP_PATH));

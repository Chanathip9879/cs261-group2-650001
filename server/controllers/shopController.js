// server/controllers/shopController.js
// จัดการข้อมูลร้านอาหารและสถานะเปิด/ปิด
// U1: ตรวจสอบสถานะเปิด/ปิดร้านอาหารแบบ Real-time
// U2: ระบบค้นหาร้านอาหาร (ค้นหาชื่อร้าน ชื่อเมนู filter โรงอาหาร/ประเภทอาหาร)
// U3: แสดงร้านอาหารและที่ตั้ง
// U5: เปลี่ยนสถานะร้าน (เปิด/ปิดร้าน)

const fs = require('fs');
const path = require('path');
const { withMenus } = require('../utils/menuHelper');

const DB_PATH = path.join(__dirname, '../data/database.json');

function readDb() {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// ==========================================
// Helpers: opening_hours (Task47 / U13)
// day_of_week: 0 = อาทิตย์ ... 6 = เสาร์ (ตรงกับ Date.getDay())
// open_time / close_time: "HH:MM" แบบ 24 ชม. หรือ null เมื่อ is_closed = true
// ==========================================
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// ตรวจแถว opening_hours 1 แถว คืนรายการ error (ว่าง = ผ่าน)
function validateOpeningHour(row, db) {
  const errors = [];
  if (!row || typeof row !== 'object') return ['ข้อมูลไม่ถูกต้อง'];

  if (typeof row.shop_id !== 'string' || !row.shop_id) {
    errors.push('ต้องระบุ shop_id');
  } else if (db && !(db.shops || []).some(s => s.id === row.shop_id)) {
    errors.push(`ไม่พบร้าน shop_id "${row.shop_id}"`);
  }

  if (!Number.isInteger(row.day_of_week) || row.day_of_week < 0 || row.day_of_week > 6) {
    errors.push('day_of_week ต้องเป็นจำนวนเต็ม 0-6 (0 = อาทิตย์)');
  }

  if (typeof row.is_closed !== 'boolean') {
    errors.push('is_closed ต้องเป็น true/false');
    return errors;
  }

  if (row.is_closed) {
    if (row.open_time != null || row.close_time != null) {
      errors.push('วันที่ปิด (is_closed = true) ต้องมี open_time และ close_time เป็น null');
    }
    return errors;
  }

  if (!TIME_PATTERN.test(row.open_time || '') || !TIME_PATTERN.test(row.close_time || '')) {
    errors.push('open_time และ close_time ต้องเป็นรูปแบบ HH:MM (00:00-23:59)');
  } else if (timeToMinutes(row.open_time) >= timeToMinutes(row.close_time)) {
    errors.push('open_time ต้องน้อยกว่า close_time');
  }
  return errors;
}

// อ่านเวลาเปิด/ปิดของร้านหนึ่งร้าน เรียงตาม day_of_week
function getOpeningHoursByShop(db, shopId) {
  return (db.opening_hours || [])
    .filter(r => r.shop_id === shopId)
    .sort((a, b) => a.day_of_week - b.day_of_week);
}

// เขียน (แทนที่) เวลาเปิด/ปิดของร้านหนึ่งร้าน ตรวจทุกแถวก่อน ถ้ามี error จะไม่เขียนอะไรเลย
// rows: [{ day_of_week, open_time, close_time, is_closed }, ...] (ห้ามซ้ำวัน)
// คืน { ok: true, data } หรือ { ok: false, errors }
function setOpeningHours(shopId, rows) {
  const db = readDb();
  if (!Array.isArray(rows)) return { ok: false, errors: ['rows ต้องเป็น array'] };

  const errors = [];
  const seenDays = new Set();
  const normalized = rows.map((r, i) => {
    const row = { shop_id: shopId, ...r };
    validateOpeningHour(row, db).forEach(e => errors.push(`แถวที่ ${i + 1}: ${e}`));
    if (seenDays.has(row.day_of_week)) errors.push(`แถวที่ ${i + 1}: day_of_week ซ้ำ`);
    seenDays.add(row.day_of_week);
    return row;
  });
  if (errors.length) return { ok: false, errors };

  const others = (db.opening_hours || []).filter(r => r.shop_id !== shopId);
  let nextId = (db.opening_hours || []).reduce((max, r) => {
    const n = parseInt(String(r.id).replace('oh-', ''), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const saved = normalized.map(r => ({
    id: `oh-${String(++nextId).padStart(3, '0')}`,
    shop_id: shopId,
    day_of_week: r.day_of_week,
    open_time: r.is_closed ? null : r.open_time,
    close_time: r.is_closed ? null : r.close_time,
    is_closed: r.is_closed
  }));
  db.opening_hours = [...others, ...saved];
  writeDb(db);
  return { ok: true, data: getOpeningHoursByShop(db, shopId) };
}

exports.validateOpeningHour = validateOpeningHour;
exports.getOpeningHoursByShop = getOpeningHoursByShop;
exports.setOpeningHours = setOpeningHours;

// 1. ดึงรายการร้านอาหารทั้งหมด พร้อมรองรับการค้นหาและฟิลเตอร์ (U1, U2, U3)
exports.getShops = (req, res) => {
  try {
    const { q, canteen, category, status } = req.query;
    const db = readDb();
    // Task26: ประกอบ menus จากตาราง menu_items ให้แต่ละร้าน
    let result = db.shops.map(shop => withMenus(db, shop));

    // ฟิลเตอร์ตามโรงอาหาร (กรีนแคนทีน หรือ คณะวิทยาศาสตร์)
    if (canteen && canteen !== 'all') {
      result = result.filter(shop => shop.canteen === canteen);
    }

    // ฟิลเตอร์ตามประเภทอาหาร
    if (category && category !== 'all') {
      result = result.filter(shop => shop.category === category);
    }

    // ฟิลเตอร์เฉพาะร้านที่เปิดอยู่
    if (status === 'open') {
      result = result.filter(shop => shop.isOpen === true);
    }

    // ค้นหาตามข้อความ (ชื่อร้าน, ชื่อเมนู, ประเภทอาหาร, ที่ตั้ง)
    if (q && q.trim()) {
      const searchTerm = q.trim().toLowerCase();
      result = result.filter(shop => {
        const matchName = shop.name.toLowerCase().includes(searchTerm);
        const matchCategory = (shop.categoryName || '').toLowerCase().includes(searchTerm);
        const matchCanteen = (shop.canteenName || '').toLowerCase().includes(searchTerm);
        const matchBooth = (shop.boothNumber || '').toLowerCase().includes(searchTerm);
        const matchLocation = (shop.locationDetails || '').toLowerCase().includes(searchTerm);
        // ค้นหาในชื่อเมนูอาหารด้วย
        const matchMenu = (shop.menus || []).some(m => m.name.toLowerCase().includes(searchTerm));

        return matchName || matchCategory || matchCanteen || matchBooth || matchLocation || matchMenu;
      });
    }

    // เรียงลำดับ: ร้านที่เปิดอยู่จะแสดงขึ้นมาก่อน เพื่อความสะดวกของผู้ใช้งาน
    result.sort((a, b) => {
      if (a.isOpen === b.isOpen) return 0;
      return a.isOpen ? -1 : 1;
    });

    // สถิติภาพรวม
    const totalCount = db.shops.length;
    const openCount = db.shops.filter(s => s.isOpen).length;
    const closedCount = totalCount - openCount;

    return res.json({
      success: true,
      meta: {
        total: totalCount,
        openCount,
        closedCount,
        filteredCount: result.length,
        timestamp: new Date().toISOString()
      },
      data: result
    });
  } catch (err) {
    console.error('Error in getShops:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลร้านอาหาร' });
  }
};

// 2. ดึงรายละเอียดร้านอาหารเดี่ยว (U3: แสดงร้านอาหารและที่ตั้ง)
exports.getShopById = (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const shop = db.shops.find(s => s.id === id);

    if (!shop) {
      return res.status(404).json({ success: false, message: 'ไม่พบร้านอาหารที่ระบุ' });
    }

    const canteenInfo = (db.canteens || []).find(c => c.id === shop.canteen);

    return res.json({
      success: true,
      data: {
        ...withMenus(db, shop),
        canteenInfo
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงรายละเอียดร้าน' });
  }
};

// 3. ดึงข้อมูลโรงอาหารทั้ง 2 แห่ง (กรีนแคนทีน และ คณะวิทย์) พร้อมสถานะจำนวนร้านที่เปิด (U3)
exports.getCanteens = (req, res) => {
  try {
    const db = readDb();
    const canteensWithStats = db.canteens.map(c => {
      const shopsInCanteen = db.shops.filter(s => s.canteen === c.id);
      const openShops = shopsInCanteen.filter(s => s.isOpen).length;
      return {
        ...c,
        totalShops: shopsInCanteen.length,
        openShops,
        closedShops: shopsInCanteen.length - openShops
      };
    });

    return res.json({
      success: true,
      data: canteensWithStats
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโรงอาหาร' });
  }
};

// 4. ดึงหมวดหมู่ประเภทอาหาร
exports.getCategories = (req, res) => {
  try {
    const db = readDb();
    return res.json({
      success: true,
      data: db.categories
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' });
  }
};

// 5. เปลี่ยนสถานะร้านอาหาร (U5: เปลี่ยนสถานะร้าน)
// แม่ค้าหรือแอดมินสามารถเปิด/ปิดร้านได้แบบ Real-time
exports.toggleShopStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { isOpen, statusNote } = req.body;
    const user = req.user;

    const db = readDb();
    const shopIndex = db.shops.findIndex(s => s.id === id);

    if (shopIndex === -1) {
      return res.status(404).json({ success: false, message: 'ไม่พบร้านอาหาร' });
    }

    // ตรวจสอบสิทธิ์: ต้องเป็นแอดมิน หรือเจ้าของร้านที่ตรงกับ shopId เท่านั้น
    if (user.role !== 'admin' && user.shopId !== id) {
      return res.status(403).json({
        success: false,
        message: 'ท่านไม่มีสิทธิ์แก้ไขสถานะของร้านอาหารนี้'
      });
    }

    const currentShop = db.shops[shopIndex];
    const newStatus = typeof isOpen === 'boolean' ? isOpen : !currentShop.isOpen;

    // อัปเดตข้อมูลสถานะ
    currentShop.isOpen = newStatus;
    if (statusNote !== undefined) {
      currentShop.statusNote = statusNote;
    } else {
      currentShop.statusNote = newStatus ? 'เปิดให้บริการตามปกติ' : 'ปิดร้านชั่วคราว';
    }
    currentShop.lastStatusUpdate = new Date().toISOString();

    db.shops[shopIndex] = currentShop;
    writeDb(db);

    return res.json({
      success: true,
      message: `เปลี่ยนสถานะร้าน "${currentShop.name}" เป็น "${newStatus ? 'เปิด' : 'ปิด'}" เรียบร้อยแล้ว`,
      data: withMenus(db, currentShop)
    });
  } catch (err) {
    console.error('Error toggling shop status:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะร้าน' });
  }
};

// 6. อัปเดตข้อมูลร้าน (เวลาเปิดปิด / เบอร์ติดต่อ)
exports.updateShopDetails = (req, res) => {
  try {
    const { id } = req.params;
    const { openingHours, statusNote } = req.body;
    const user = req.user;

    const db = readDb();
    const shopIndex = db.shops.findIndex(s => s.id === id);

    if (shopIndex === -1) {
      return res.status(404).json({ success: false, message: 'ไม่พบร้านอาหาร' });
    }

    if (user.role !== 'admin' && user.shopId !== id) {
      return res.status(403).json({ success: false, message: 'ท่านไม่มีสิทธิ์แก้ไขข้อมูลร้านนี้' });
    }

    const shop = db.shops[shopIndex];
    if (openingHours) shop.openingHours = openingHours;
    if (statusNote) shop.statusNote = statusNote;
    shop.lastStatusUpdate = new Date().toISOString();

    db.shops[shopIndex] = shop;
    writeDb(db);

    return res.json({
      success: true,
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      data: withMenus(db, shop)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
};
// GET /api/shops/:id/opening-hours  เวลาเปิด-ปิดรายวันของร้าน (U12)
exports.getShopOpeningHours = (req, res) => {
  try {
    const db = readDb();
    const shop = db.shops.find(s => s.id === req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'ไม่พบร้านอาหารที่ระบุ' });
    }
    return res.json({ success: true, data: getOpeningHoursByShop(db, shop.id) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงเวลาเปิด-ปิด' });
  }
};

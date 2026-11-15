
// server/controllers/menuController.js
// Task27 (U6): API จัดการเมนูอาหารจาก db.menu_items

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.json');

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// ==========================================
// 1. GET รายการเมนูของร้าน
// GET /api/shops/:id/menus
// ==========================================

exports.getMenusByShop = (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();

    const shop = (db.shops || []).find(s => s.id === id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านอาหารที่ระบุ'
      });
    }

    const menus = (db.menu_items || [])
      .filter(item => item.restaurant_id === id)
      .map(item => ({
        id: item.id,
        restaurant_id: item.restaurant_id,
        name: item.name,
        price: item.price,
        is_sold_out: item.is_sold_out
      }));

    return res.status(200).json({
      success: true,
      message: 'ดึงรายการเมนูสำเร็จ',
      data: menus
    });

  } catch (err) {
    console.error('Error getting menus:', err);

    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงรายการเมนู'
    });
  }
};


// ==========================================
// 2. PUT เปลี่ยนสถานะเมนูหมด
// PUT /api/shops/:id/menus/:menuId
// Body: { is_sold_out: true/false }
// ==========================================

exports.updateMenuSoldOut = (req, res) => {
  try {
    const { id, menuId } = req.params;
    const { is_sold_out } = req.body || {};
    const user = req.user;

    // ตรวจสอบข้อมูลสถานะ
    if (typeof is_sold_out !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ is_sold_out เป็น true หรือ false'
      });
    }

    const db = readDb();

    // ตรวจสอบว่ามีร้านหรือไม่
    const shop = (db.shops || []).find(s => s.id === id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านอาหารที่ระบุ'
      });
    }

    // ตรวจสอบสิทธิ์ OWNER ของร้านนั้นเท่านั้น
    if (
      !user ||
      user.role !== 'OWNER' ||
      user.shop_id !== id
    ) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์แก้ไขสถานะเมนูของร้านนี้ เฉพาะเจ้าของร้านเท่านั้น'
      });
    }

    // ค้นหาเมนูและตรวจสอบว่าเป็นของร้านนี้จริง
    const menuIndex = (db.menu_items || []).findIndex(
      item => item.id === menuId && item.restaurant_id === id
    );

    if (menuIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบเมนูนี้ในร้านที่ระบุ'
      });
    }

    // อัปเดตสถานะเมนู
    db.menu_items[menuIndex].is_sold_out = is_sold_out;

    writeDb(db);

    return res.status(200).json({
      success: true,
      message: is_sold_out
        ? 'แจ้งเมนูหมดเรียบร้อยแล้ว'
        : 'เปิดขายเมนูอีกครั้งเรียบร้อยแล้ว',
      data: db.menu_items[menuIndex]
    });

  } catch (err) {
    console.error('Error updating menu sold out:', err);

    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะเมนู'
    });
  }
};

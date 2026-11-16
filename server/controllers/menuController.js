// server/controllers/menuController.js
// Task27 (U6): API จัดการเมนูอาหาร — อ่าน/เขียนผ่าน server/db
// (route ที่ mount อยู่ใน server/index.js ใช้ shopController แต่ไฟล์นี้เก็บไว้ให้ตรงกัน)

const db = require('../db');

function isOwnerOf(user, shopId) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const role = user.role;
  if (role !== 'OWNER' && role !== 'vendor') return false;
  return (user.shopId || user.shop_id) === shopId;
}

// ==========================================
// 1. GET รายการเมนูของร้าน
// GET /api/shops/:id/menus
// ==========================================
exports.getMenusByShop = async (req, res) => {
  try {
    const { id } = req.params;

    if (!(await db.shopExists(id))) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านอาหารที่ระบุ'
      });
    }

    const menus = (await db.listMenusByShop(id)).map(item => ({
      id: item.id,
      restaurant_id: item.restaurant_id,
      name: item.name,
      price: item.price,
      is_sold_out: item.is_sold_out,
      ...(item.note !== undefined ? { note: item.note } : {})
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
exports.updateMenuSoldOut = async (req, res) => {
  try {
    const { id, menuId } = req.params;
    const { is_sold_out } = req.body || {};
    const user = req.user;

    if (typeof is_sold_out !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ is_sold_out เป็น true หรือ false'
      });
    }

    if (!(await db.shopExists(id))) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านอาหารที่ระบุ'
      });
    }

    // เฉพาะเจ้าของร้านนั้น (หรือแอดมิน) เท่านั้น
    if (!isOwnerOf(user, id)) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์แก้ไขสถานะเมนูของร้านนี้ เฉพาะเจ้าของร้านเท่านั้น'
      });
    }

    const menu = await db.getMenuById(id, menuId);
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบเมนูนี้ในร้านที่ระบุ'
      });
    }

    await db.setMenuAvailability(id, menuId, !is_sold_out);
    const updated = await db.getMenuById(id, menuId);

    return res.status(200).json({
      success: true,
      message: is_sold_out
        ? 'แจ้งเมนูหมดเรียบร้อยแล้ว'
        : 'เปิดขายเมนูอีกครั้งเรียบร้อยแล้ว',
      data: {
        id: updated.id,
        restaurant_id: updated.restaurant_id,
        name: updated.name,
        price: updated.price,
        is_sold_out: updated.is_sold_out,
        ...(updated.note !== undefined ? { note: updated.note } : {})
      }
    });
  } catch (err) {
    console.error('Error updating menu sold out:', err);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะเมนู'
    });
  }
};

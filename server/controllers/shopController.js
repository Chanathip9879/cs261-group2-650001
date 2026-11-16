// server/controllers/shopController.js
// จัดการข้อมูลร้านอาหารและสถานะเปิด/ปิด
// U1: ตรวจสอบสถานะเปิด/ปิดร้านอาหารแบบ Real-time
// U2: ระบบค้นหาร้านอาหาร (ค้นหาชื่อร้าน ชื่อเมนู filter โรงอาหาร/ประเภทอาหาร)
// U3: แสดงร้านอาหารและที่ตั้ง
// U5: เปลี่ยนสถานะร้าน (เปิด/ปิดร้าน)
//
// ข้อมูลอ่าน/เขียนผ่าน server/db (MSSQL หรือ JSON ตาม DB_DRIVER)

const db = require('../db');

// ==========================================
// Helpers: latitude / longitude ของร้าน (Task32 / U8)
// ค่าเป็น number หรือ null ได้ (null = ร้านยังไม่มีพิกัด)
// lat: -90 ถึง 90, lng: -180 ถึง 180
// ==========================================
function validateCoordinates(latitude, longitude) {
  const errors = [];
  const isNum = v => typeof v === 'number' && Number.isFinite(v);

  // ต้องเป็น null ทั้งคู่ หรือมีค่าทั้งคู่ (ห้ามมีแค่ค่าเดียว)
  if ((latitude == null) !== (longitude == null)) {
    errors.push('latitude และ longitude ต้องมีค่าพร้อมกัน หรือเป็น null ทั้งคู่');
    return errors;
  }
  if (latitude == null) return errors;

  if (!isNum(latitude) || latitude < -90 || latitude > 90) {
    errors.push('latitude ต้องเป็นตัวเลขระหว่าง -90 ถึง 90');
  }
  if (!isNum(longitude) || longitude < -180 || longitude > 180) {
    errors.push('longitude ต้องเป็นตัวเลขระหว่าง -180 ถึง 180');
  }
  return errors;
}

// ==========================================
// Helpers: ข้อมูลติดต่อร้าน + ซ่อน pin (Task40 / U10)
// ==========================================
const PHONE_PATTERN = /^0\d{9}$/; // 10 หลัก ขึ้นต้นด้วย 0
const CONTACT_MAX_LENGTH = { line_id: 50, facebook: 200, other_contact: 200 };

// ตรวจข้อมูลติดต่อ { phone, line_id, facebook, other_contact } คืนรายการ error (ว่าง = ผ่าน)
function validateContact(contact) {
  const errors = [];
  if (!contact || typeof contact !== 'object') return ['ข้อมูลติดต่อไม่ถูกต้อง'];

  if (typeof contact.phone !== 'string' || !PHONE_PATTERN.test(contact.phone)) {
    errors.push('phone ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0');
  }
  Object.entries(CONTACT_MAX_LENGTH).forEach(([field, max]) => {
    const v = contact[field];
    if (v === null || v === undefined) return; // null ได้
    if (typeof v !== 'string' || !v.trim()) {
      errors.push(`${field} ต้องเป็นข้อความที่ไม่ว่าง หรือเป็น null`);
    } else if (v.length > max) {
      errors.push(`${field} ต้องยาวไม่เกิน ${max} ตัวอักษร`);
    }
  });
  return errors;
}

// ตัด field ลับ (pin) ออกก่อนส่งข้อมูลร้านกลับไปให้ client
function toPublicShop(shop) {
  if (!shop) return shop;
  const { pin, ...publicShop } = shop;
  return publicShop;
}

exports.validateCoordinates = validateCoordinates;
exports.validateContact = validateContact;
exports.toPublicShop = toPublicShop;

// 1. ดึงรายการร้านอาหารทั้งหมด พร้อมรองรับการค้นหาและฟิลเตอร์ (U1, U2, U3)
exports.getShops = async (req, res) => {
  try {
    const { q, canteen, category, status } = req.query;
    const allShops = await db.listShops();
    let result = [...allShops];

    // ฟิลเตอร์ตามโรงอาหาร (กรีนแคนทีน / คณะวิทยาศาสตร์ / สังคมศาสตร์)
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
    const totalCount = allShops.length;
    const openCount = allShops.filter(s => s.isOpen).length;
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
      data: result.map(toPublicShop)
    });
  } catch (err) {
    console.error('Error in getShops:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลร้านอาหาร' });
  }
};

// 2. ดึงรายละเอียดร้านอาหารเดี่ยว (U3: แสดงร้านอาหารและที่ตั้ง)
exports.getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    const [shop, canteens] = await Promise.all([db.getShopById(id), db.listCanteens()]);

    if (!shop) {
      return res.status(404).json({ success: false, message: 'ไม่พบร้านอาหารที่ระบุ' });
    }

    const canteenInfo = canteens.find(c => c.id === shop.canteen);

    return res.json({
      success: true,
      data: {
        ...toPublicShop(shop),
        canteenInfo
      }
    });
  } catch (err) {
    console.error('Error in getShopById:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงรายละเอียดร้าน' });
  }
};

// 3. ดึงข้อมูลโรงอาหาร พร้อมสถานะจำนวนร้านที่เปิด (U3)
exports.getCanteens = async (req, res) => {
  try {
    const [canteens, shops] = await Promise.all([db.listCanteens(), db.listShops()]);

    const canteensWithStats = canteens.map(c => {
      const shopsInCanteen = shops.filter(s => s.canteen === c.id);
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
    console.error('Error in getCanteens:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโรงอาหาร' });
  }
};

// 4. ดึงหมวดหมู่ประเภทอาหาร
exports.getCategories = async (req, res) => {
  try {
    const categories = await db.listCategories();
    return res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    console.error('Error in getCategories:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' });
  }
};

// 5. เปลี่ยนสถานะร้านอาหาร (U5: เปลี่ยนสถานะร้าน)
// แม่ค้าหรือแอดมินสามารถเปิด/ปิดร้านได้แบบ Real-time
exports.toggleShopStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOpen, statusNote } = req.body || {};
    const user = req.user;

    const currentShop = await db.getShopById(id);

    if (!currentShop) {
      return res.status(404).json({ success: false, message: 'ไม่พบร้านอาหาร' });
    }

    // ตรวจสอบสิทธิ์: ต้องเป็นแอดมิน หรือเจ้าของร้านที่ตรงกับ shopId เท่านั้น
    if (user.role !== 'admin' && user.shopId !== id) {
      return res.status(403).json({
        success: false,
        message: 'ท่านไม่มีสิทธิ์แก้ไขสถานะของร้านอาหารนี้'
      });
    }

    const newStatus = typeof isOpen === 'boolean' ? isOpen : !currentShop.isOpen;
    const newStatusNote = statusNote !== undefined
      ? statusNote
      : (newStatus ? 'เปิดให้บริการตามปกติ' : 'ปิดร้านชั่วคราว');

    const updatedShop = await db.updateShopStatus(id, {
      isOpen: newStatus,
      statusNote: newStatusNote,
      lastStatusUpdate: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `เปลี่ยนสถานะร้าน "${updatedShop.name}" เป็น "${newStatus ? 'เปิด' : 'ปิด'}" เรียบร้อยแล้ว`,
      data: toPublicShop(updatedShop)
    });
  } catch (err) {
    console.error('Error toggling shop status:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะร้าน' });
  }
};

// 6. อัปเดตข้อมูลร้าน (เวลาเปิดปิด / หมายเหตุสถานะ)
exports.updateShopDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { openingHours, statusNote } = req.body || {};
    const user = req.user;

    const currentShop = await db.getShopById(id);

    if (!currentShop) {
      return res.status(404).json({ success: false, message: 'ไม่พบร้านอาหาร' });
    }

    if (user.role !== 'admin' && user.shopId !== id) {
      return res.status(403).json({ success: false, message: 'ท่านไม่มีสิทธิ์แก้ไขข้อมูลร้านนี้' });
    }

    const shop = await db.updateShopDetails(id, {
      openingHours,
      statusNote,
      lastStatusUpdate: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      data: toPublicShop(shop)
    });
  } catch (err) {
    console.error('Error updating shop details:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
};

// ==========================================
// เมนูอาหาร (Task27 / U6)
// ==========================================

// GET /api/shops/:id/menus — ดึงรายการเมนูของร้าน
exports.getMenusByShop = async (req, res) => {
  try {
    const { id } = req.params;

    if (!(await db.shopExists(id))) {
      return res.status(404).json({ success: false, message: 'ไม่พบร้านอาหาร' });
    }

    const menus = await db.listMenusByShop(id);
    return res.json({ success: true, data: menus });
  } catch (err) {
    console.error('Error getting shop menus:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงรายการเมนู' });
  }
};

// PUT /api/shops/:id/menus/:menuId (ต้อง Login) — body: { isAvailable: boolean }
// แจ้งเมนูหมด / เปิดรับสต็อกใหม่ (หน้า Merchant Dashboard)
exports.updateMenuAvailability = async (req, res) => {
  try {
    const { id, menuId } = req.params;
    const { isAvailable } = req.body || {};
    const user = req.user;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ success: false, message: 'กรุณาระบุสถานะเมนู (isAvailable)' });
    }

    const shop = await db.getShopById(id);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'ไม่พบร้านอาหาร' });
    }
    if (user.role !== 'admin' && user.shopId !== id) {
      return res.status(403).json({ success: false, message: 'ท่านไม่มีสิทธิ์แก้ไขเมนูของร้านนี้' });
    }

    const menu = (shop.menus || []).find(m => m.id === menuId);
    if (!menu) {
      return res.status(404).json({ success: false, message: 'ไม่พบเมนูนี้' });
    }

    const updatedShop = await db.setMenuAvailability(id, menuId, isAvailable);

    return res.json({
      success: true,
      message: isAvailable ? `เปิดขาย "${menu.name}" แล้ว` : `แจ้ง "${menu.name}" หมดแล้ว`,
      data: toPublicShop(updatedShop)
    });
  } catch (err) {
    console.error('Error updating menu availability:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตเมนู' });
  }
};

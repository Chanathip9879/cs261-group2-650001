// server/controllers/authController.js
// U4: Log in จัดการร้านอาหาร (แม่ค้า Login ด้วยเบอร์โทร + PIN 4-6 หลัก)

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.json');

function readDb() {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

// 1. เข้าสู่ระบบด้วยเบอร์โทร + PIN
exports.login = (req, res) => {
  const { phone, pin } = req.body;

  if (!phone || !pin) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกเบอร์โทรศัพท์และรหัส PIN ให้ครบถ้วน'
    });
  }

  // Format เบอร์โทร (ตัดขีดหรือช่องว่างออก)
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const cleanPin = pin.trim();

  const db = readDb();

  // ตรวจสอบแอดมิน
  const admin = (db.admins || []).find(a => a.phone === cleanPhone && a.pin === cleanPin);
  if (admin) {
    const token = Buffer.from(`${admin.phone}:${admin.pin}:${Date.now()}`).toString('base64');
    return res.json({
      success: true,
      message: `ยินดีต้อนรับ ${admin.name}`,
      token,
      user: {
        role: 'admin',
        name: admin.name,
        phone: admin.phone
      }
    });
  }

  // ตรวจสอบแม่ค้า / เจ้าของร้าน
  const shop = db.shops.find(s => s.phone === cleanPhone && s.pin === cleanPin);
  if (shop) {
    const token = Buffer.from(`${shop.phone}:${shop.pin}:${Date.now()}`).toString('base64');
    return res.json({
      success: true,
      message: `เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ ${shop.vendorName} (${shop.name})`,
      token,
      user: {
        role: 'vendor',
        shopId: shop.id,
        shopName: shop.name,
        vendorName: shop.vendorName,
        phone: shop.phone,
        canteenName: shop.canteenName,
        boothNumber: shop.boothNumber,
        isOpen: shop.isOpen
      }
    });
  }

  // กรณีเบอร์โทรหรือ PIN ไม่ตรง
  return res.status(401).json({
    success: false,
    message: 'เบอร์โทรศัพท์หรือรหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'
  });
};

// 2. ดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบันจาก Token
exports.getMe = (req, res) => {
  const user = req.user;
  const db = readDb();

  if (user.role === 'vendor') {
    const currentShop = db.shops.find(s => s.id === user.shopId);
    if (!currentShop) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลร้านอาหาร' });
    }
    return res.json({
      success: true,
      user: {
        ...user,
        isOpen: currentShop.isOpen,
        statusNote: currentShop.statusNote,
        openingHours: currentShop.openingHours,
        menus: currentShop.menus
      }
    });
  }

  return res.json({
    success: true,
    user
  });
};

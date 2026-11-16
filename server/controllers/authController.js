// server/controllers/authController.js
// U4: Log in จัดการร้านอาหาร (แม่ค้า Login ด้วยเบอร์โทร + PIN 4-6 หลัก)
// ข้อมูลอ่านผ่าน server/db (MSSQL หรือ JSON ตาม DB_DRIVER)

const db = require('../db');

// 1. เข้าสู่ระบบด้วยเบอร์โทร + PIN
exports.login = async (req, res) => {
  try {
    const { phone, pin } = req.body || {};

    if (!phone || !pin) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกเบอร์โทรศัพท์และรหัส PIN ให้ครบถ้วน'
      });
    }

    // Format เบอร์โทร (ตัดขีดหรือช่องว่างออก)
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    const cleanPin = String(pin).trim();

    // ตรวจสอบแอดมิน
    const admin = await db.findAdminByCredentials(cleanPhone, cleanPin);
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
    const shop = await db.findShopByCredentials(cleanPhone, cleanPin);
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
  } catch (err) {
    console.error('Error in login:', err);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง'
    });
  }
};

// 2. ดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบันจาก Token
exports.getMe = async (req, res) => {
  try {
    const user = req.user;

    if (user.role === 'vendor') {
      const currentShop = await db.getShopById(user.shopId);
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
  } catch (err) {
    console.error('Error in getMe:', err);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง'
    });
  }
};

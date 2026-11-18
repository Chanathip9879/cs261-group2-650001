// server/controllers/authController.js
// U4: Log in จัดการร้านอาหาร (แม่ค้า Login ด้วยเบอร์โทร + PIN 4-6 หลัก)
// U7: ล็อกบัญชีชั่วคราวเมื่อกรอก PIN ผิดติดกันหลายครั้ง (สเปก docs/API_LOGIN_LOCKOUT.md)
// ข้อมูลอ่านผ่าน server/db (MSSQL หรือ JSON ตาม DB_DRIVER)

const db = require('../db');
const lockout = require('../utils/loginLockout');

const LOCKED_MESSAGE = 'บัญชีถูกล็อกชั่วคราว';
// ข้อความกลาง: ไม่แยกว่า "ไม่พบเบอร์" หรือ "PIN ผิด" (กันการเดาว่าเบอร์ไหนมีบัญชี)
const INVALID_CREDENTIALS_MESSAGE = 'เบอร์โทรศัพท์หรือรหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง';

// ตอบ 423 พร้อมเวลาปลอดล็อก (ใช้ retryAfterSeconds เป็นหลัก) + header Retry-After
function sendLocked(res, lock) {
  const retryAfterSeconds = Math.max(1, Math.ceil(lock.retryAfterMs / 1000));
  res.set('Retry-After', String(retryAfterSeconds));
  return res.status(423).json({
    success: false,
    locked: true,
    retryAfterSeconds,
    lockedUntil: new Date(lock.lockedUntil).toISOString(),
    message: LOCKED_MESSAGE
  });
}

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
    const cleanPhone = lockout.normalizePhone(phone);
    const cleanPin = String(pin).trim();

    // ถ้าเบอร์นี้ถูกล็อกอยู่ ตอบ 423 ทันที แม้จะส่ง PIN ถูก
    const lock = lockout.getLock(cleanPhone);
    if (lock) return sendLocked(res, lock);

    // ตรวจสอบแอดมิน
    const admin = await db.findAdminByCredentials(cleanPhone, cleanPin);
    if (admin) {
      lockout.reset(cleanPhone);
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
      lockout.reset(cleanPhone);
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

    // กรณีเบอร์โทรหรือ PIN ไม่ตรง: นับครั้งที่ผิด (รวมเบอร์ที่ไม่มีในระบบ)
    const failure = lockout.recordFailure(cleanPhone);
    if (failure.locked) return sendLocked(res, failure);

    return res.status(401).json({
      success: false,
      message: INVALID_CREDENTIALS_MESSAGE
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

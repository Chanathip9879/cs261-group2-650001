// server/middleware/authMiddleware.js
// ระบบตรวจสอบสิทธิ์สำหรับแม่ค้าและแอดมิน (U4: Log in จัดการร้านอาหาร)
// ตรวจสอบผู้ใช้ผ่าน server/db (MSSQL หรือ JSON ตาม DB_DRIVER)

const db = require('../db');

// ตรวจสอบ Bearer Token (token format: base64(phone:pin:timestamp))
async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ (Unauthorized)'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [phone, pin] = decoded.split(':');

    // ตรวจสอบว่าเป็นแอดมินหรือไม่
    const admin = await db.findAdminByCredentials(phone, pin);
    if (admin) {
      req.user = {
        role: 'admin',
        name: admin.name,
        phone: admin.phone
      };
      return next();
    }

    // ตรวจสอบว่าเป็นเจ้าของร้านหรือไม่
    const shop = await db.findShopByCredentials(phone, pin);
    if (shop) {
      req.user = {
        role: 'vendor',
        shopId: shop.id,
        shopName: shop.name,
        vendorName: shop.vendorName,
        phone: shop.phone
      };
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'โทเค็นไม่ถูกต้องหรือเซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'
    });
  } catch (err) {
    console.error('Error in authMiddleware:', err);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ กรุณาลองใหม่อีกครั้ง'
    });
  }
}

module.exports = authMiddleware;

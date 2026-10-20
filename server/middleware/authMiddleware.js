// server/middleware/authMiddleware.js
// ระบบตรวจสอบสิทธิ์สำหรับแม่ค้าและแอดมิน (U4: Log in จัดการร้านอาหาร)

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.json');

function readDb() {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

// ตรวจสอบ Bearer Token (token format: base64(phone:pin:timestamp))
function authMiddleware(req, res, next) {
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

    const db = readDb();

    // ตรวจสอบว่าเป็นแอดมินหรือไม่
    const admin = (db.admins || []).find(a => a.phone === phone && a.pin === pin);
    if (admin) {
      req.user = {
        role: 'admin',
        name: admin.name,
        phone: admin.phone
      };
      return next();
    }

    // ตรวจสอบว่าเป็นเจ้าของร้านหรือไม่
    const shop = db.shops.find(s => s.phone === phone && s.pin === pin);
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
    return res.status(401).json({
      success: false,
      message: 'รูปแบบ Token ไม่ถูกต้อง'
    });
  }
}

module.exports = authMiddleware;

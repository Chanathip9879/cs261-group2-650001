// server/controllers/shopController.js
// จัดการข้อมูลร้านอาหารและสถานะเปิด/ปิด
// U1: ตรวจสอบสถานะเปิด/ปิดร้านอาหารแบบ Real-time
// U2: ระบบค้นหาร้านอาหาร (ค้นหาชื่อร้าน ชื่อเมนู filter โรงอาหาร/ประเภทอาหาร)
// U3: แสดงร้านอาหารและที่ตั้ง
// U5: เปลี่ยนสถานะร้าน (เปิด/ปิดร้าน)

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.json');

function readDb() {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// 1. ดึงรายการร้านอาหารทั้งหมด พร้อมรองรับการค้นหาและฟิลเตอร์ (U1, U2, U3)
exports.getShops = (req, res) => {
  try {
    const { q, canteen, category, status } = req.query;
    const db = readDb();
    let result = [...db.shops];

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
        ...shop,
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
      data: currentShop
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
      data: shop
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
};

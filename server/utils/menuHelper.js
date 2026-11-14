// server/utils/menuHelper.js
// Task26 (U6): เมนูอาหารถูกย้ายไปเก็บใน db.menu_items แล้ว
// ไฟล์นี้ประกอบเมนูกลับเป็น shop.menus ให้ API เหมือนรูปแบบเดิม
// ฝั่ง client จึงไม่ต้องแก้โค้ด และยังใช้ m.isAvailable ได้ต่อ

// คืนรายการเมนูของร้านหนึ่งร้าน (แปลง is_sold_out -> isAvailable ที่ความหมายกลับกัน)
function getMenusForShop(db, shopId) {
  return (db.menu_items || [])
    .filter((item) => item.restaurant_id === shopId)
    .map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      is_sold_out: item.is_sold_out,
      isAvailable: !item.is_sold_out,
    }));
}

// ใส่ menus ให้ร้านหนึ่งร้าน (ไม่แก้ object เดิมใน db)
function withMenus(db, shop) {
  return { ...shop, menus: getMenusForShop(db, shop.id) };
}

module.exports = { getMenusForShop, withMenus };

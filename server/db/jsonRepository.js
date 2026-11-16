// server/db/jsonRepository.js
// Repository สำหรับโหมด DB_DRIVER=json (อ่าน/เขียน server/data/database.json)
// ทุกฟังก์ชันเป็น async เพื่อให้ controller ใช้โค้ดชุดเดียวกันกับโหมด MSSQL ได้

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.json');

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// แปลงเมนูให้รูปแบบเดียวกับ MSSQL: is_sold_out + isAvailable (ความหมายกลับกัน)
function normalizeMenu(menu, shopId) {
  const isSoldOut = menu.is_sold_out !== undefined
    ? menu.is_sold_out === true
    : menu.isAvailable === false;

  const result = {
    id: menu.id,
    restaurant_id: menu.restaurant_id || shopId,
    name: menu.name,
    price: Number(menu.price) || 0,
    is_sold_out: isSoldOut,
    isAvailable: !isSoldOut,
  };
  if (menu.note !== undefined && menu.note !== null) result.note = menu.note;
  return result;
}

function menusForShop(db, shopId) {
  // ถ้ามีตาราง menu_items แยก ให้ใช้ตารางนั้น ไม่งั้นใช้เมนูที่ฝังใน shops[].menus
  if (Array.isArray(db.menu_items) && db.menu_items.length) {
    return db.menu_items
      .filter((item) => item.restaurant_id === shopId)
      .map((item) => normalizeMenu(item, shopId));
  }

  const shop = (db.shops || []).find((s) => s.id === shopId);
  return (shop?.menus || []).map((menu) => normalizeMenu(menu, shopId));
}

function withMenus(db, shop) {
  return { ...shop, menus: menusForShop(db, shop.id) };
}

async function listCanteens() {
  return readDb().canteens || [];
}

async function listCategories() {
  return readDb().categories || [];
}

async function listShops() {
  const db = readDb();
  return (db.shops || []).map((shop) => withMenus(db, shop));
}

async function getShopById(id) {
  const db = readDb();
  const shop = (db.shops || []).find((s) => s.id === id);
  return shop ? withMenus(db, shop) : null;
}

async function shopExists(id) {
  return (readDb().shops || []).some((s) => s.id === id);
}

async function listMenusByShop(shopId) {
  return menusForShop(readDb(), shopId);
}

async function getMenuById(shopId, menuId) {
  const menus = await listMenusByShop(shopId);
  return menus.find((m) => m.id === menuId) || null;
}

async function findAdminByCredentials(phone, pin) {
  if (!phone || !pin) return null;
  const db = readDb();
  return (db.admins || []).find((a) => a.phone === phone && a.pin === pin) || null;
}

// ต้องมีทั้งเบอร์และ PIN และต้องตรงกัน — ร้านที่เบอร์/PIN ว่างจะ login ไม่ได้
async function findShopByCredentials(phone, pin) {
  if (!phone || !pin) return null;
  const db = readDb();
  const shop = (db.shops || []).find((s) => s.phone === phone && s.pin === pin);
  return shop ? withMenus(db, shop) : null;
}

async function updateShopStatus(id, { isOpen, statusNote, lastStatusUpdate }) {
  const db = readDb();
  const shop = (db.shops || []).find((s) => s.id === id);
  if (!shop) return null;

  shop.isOpen = isOpen;
  shop.statusNote = statusNote;
  shop.lastStatusUpdate = lastStatusUpdate;
  writeDb(db);
  return withMenus(db, shop);
}

async function updateShopDetails(id, { openingHours, statusNote, lastStatusUpdate }) {
  const db = readDb();
  const shop = (db.shops || []).find((s) => s.id === id);
  if (!shop) return null;

  if (openingHours) shop.openingHours = openingHours;
  if (statusNote) shop.statusNote = statusNote;
  shop.lastStatusUpdate = lastStatusUpdate;
  writeDb(db);
  return withMenus(db, shop);
}

async function setMenuAvailability(shopId, menuId, isAvailable) {
  const db = readDb();
  const isSoldOut = !isAvailable;
  let found = false;

  if (Array.isArray(db.menu_items) && db.menu_items.length) {
    const menu = db.menu_items.find((m) => m.id === menuId && m.restaurant_id === shopId);
    if (menu) {
      menu.is_sold_out = isSoldOut;
      found = true;
    }
  } else {
    const shop = (db.shops || []).find((s) => s.id === shopId);
    const menu = (shop?.menus || []).find((m) => m.id === menuId);
    if (menu) {
      menu.isAvailable = isAvailable;
      menu.is_sold_out = isSoldOut;
      found = true;
    }
  }

  if (!found) return null;

  const shop = (db.shops || []).find((s) => s.id === shopId);
  if (shop) shop.lastStatusUpdate = new Date().toISOString();
  writeDb(db);
  return shop ? withMenus(db, shop) : null;
}

module.exports = {
  driver: 'json',
  readDb,
  writeDb,
  listCanteens,
  listCategories,
  listShops,
  getShopById,
  shopExists,
  listMenusByShop,
  getMenuById,
  findAdminByCredentials,
  findShopByCredentials,
  updateShopStatus,
  updateShopDetails,
  setMenuAvailability,
};

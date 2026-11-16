// server/db/mssqlRepository.js
// Repository สำหรับโหมด DB_DRIVER=mssql (SQL Server)
// คืนข้อมูลรูปแบบเดียวกับ jsonRepository เพื่อให้ controller ใช้ร่วมกันได้

const sql = require('mssql');
const { getMssqlConfig } = require('./config');

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(getMssqlConfig())
      .connect()
      .catch((err) => {
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

const SHOP_COLUMNS = `
  id, name, canteen, canteenName, boothNumber, locationDetails,
  category, categoryName, isOpen, statusNote, openingHours,
  phone, line_id, facebook, other_contact, pin, vendorName,
  accentColor, rating, reviewCount, lastStatusUpdate, latitude, longitude
`;

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toIsoOrNull(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toDate(value) {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function mapMenu(row) {
  const isSoldOut = row.isSoldOut === true;
  const menu = {
    id: row.id,
    restaurant_id: row.shopId,
    name: row.name,
    price: Number(row.price) || 0,
    is_sold_out: isSoldOut,
    isAvailable: !isSoldOut,
  };
  if (row.note !== undefined && row.note !== null) menu.note = row.note;
  return menu;
}

function normalizeShop(row) {
  if (!row) return null;
  return {
    ...row,
    isOpen: row.isOpen === true,
    rating: toNumberOrNull(row.rating),
    reviewCount: row.reviewCount ?? 0,
    lastStatusUpdate: toIsoOrNull(row.lastStatusUpdate),
    latitude: toNumberOrNull(row.latitude),
    longitude: toNumberOrNull(row.longitude),
  };
}

async function loadMenusByShop(pool, shopId = null) {
  const request = pool.request();
  let query = 'SELECT id, shopId, name, price, isSoldOut, note FROM dbo.menu_items';
  if (shopId) {
    request.input('shopId', sql.NVarChar(50), shopId);
    query += ' WHERE shopId = @shopId';
  }
  query += ' ORDER BY shopId, sortOrder, id';

  const result = await request.query(query);
  const grouped = new Map();
  for (const row of result.recordset) {
    if (!grouped.has(row.shopId)) grouped.set(row.shopId, []);
    grouped.get(row.shopId).push(mapMenu(row));
  }
  return grouped;
}

async function listCanteens() {
  const pool = await getPool();
  const result = await pool.request().query(
    'SELECT id, name, shortName, description, landmark, totalShops, operatingHours FROM dbo.canteens ORDER BY sortOrder, id'
  );
  return result.recordset;
}

async function listCategories() {
  const pool = await getPool();
  const result = await pool.request().query(
    'SELECT id, name, icon FROM dbo.categories ORDER BY sortOrder, id'
  );
  return result.recordset;
}

async function listShops() {
  const pool = await getPool();
  const [shopsResult, menusByShop] = await Promise.all([
    pool.request().query(`SELECT ${SHOP_COLUMNS} FROM dbo.shops`),
    loadMenusByShop(pool),
  ]);

  return shopsResult.recordset.map((row) => ({
    ...normalizeShop(row),
    menus: menusByShop.get(row.id) || [],
  }));
}

async function getShopById(id) {
  const pool = await getPool();
  const shopResult = await pool.request()
    .input('id', sql.NVarChar(50), id)
    .query(`SELECT ${SHOP_COLUMNS} FROM dbo.shops WHERE id = @id`);

  const row = shopResult.recordset[0];
  if (!row) return null;

  const menusByShop = await loadMenusByShop(pool, id);
  return { ...normalizeShop(row), menus: menusByShop.get(id) || [] };
}

async function shopExists(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.NVarChar(50), id)
    .query('SELECT 1 AS found FROM dbo.shops WHERE id = @id');
  return result.recordset.length > 0;
}

async function listMenusByShop(shopId) {
  const pool = await getPool();
  const menusByShop = await loadMenusByShop(pool, shopId);
  return menusByShop.get(shopId) || [];
}

async function getMenuById(shopId, menuId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('shopId', sql.NVarChar(50), shopId)
    .input('menuId', sql.NVarChar(50), menuId)
    .query('SELECT id, shopId, name, price, isSoldOut, note FROM dbo.menu_items WHERE id = @menuId AND shopId = @shopId');
  return result.recordset[0] ? mapMenu(result.recordset[0]) : null;
}

async function findAdminByCredentials(phone, pin) {
  if (!phone || !pin) return null;
  const pool = await getPool();
  const result = await pool.request()
    .input('phone', sql.VarChar(20), phone)
    .input('pin', sql.VarChar(20), pin)
    .query('SELECT id, phone, pin, name, role FROM dbo.admins WHERE phone = @phone AND pin = @pin');
  return result.recordset[0] || null;
}

// ต้องมีทั้งเบอร์และ PIN — ร้านที่เบอร์/PIN ว่างจะ login ไม่ได้ (กันการ match ร้านผิด)
async function findShopByCredentials(phone, pin) {
  if (!phone || !pin) return null;
  const pool = await getPool();
  const result = await pool.request()
    .input('phone', sql.VarChar(20), phone)
    .input('pin', sql.VarChar(20), pin)
    .query(`SELECT TOP 1 ${SHOP_COLUMNS} FROM dbo.shops
            WHERE phone = @phone AND pin = @pin
              AND phone <> '' AND pin IS NOT NULL
            ORDER BY id`);

  const row = result.recordset[0];
  if (!row) return null;

  const menusByShop = await loadMenusByShop(pool, row.id);
  return { ...normalizeShop(row), menus: menusByShop.get(row.id) || [] };
}

async function updateShopStatus(id, { isOpen, statusNote, lastStatusUpdate }) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.NVarChar(50), id)
    .input('isOpen', sql.Bit, isOpen)
    .input('statusNote', sql.NVarChar(500), statusNote)
    .input('lastStatusUpdate', sql.DateTime2, toDate(lastStatusUpdate))
    .query(`UPDATE dbo.shops
            SET isOpen = @isOpen,
                statusNote = @statusNote,
                lastStatusUpdate = @lastStatusUpdate
            WHERE id = @id`);
  return getShopById(id);
}

async function updateShopDetails(id, { openingHours, statusNote, lastStatusUpdate }) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.NVarChar(50), id)
    .input('openingHours', sql.NVarChar(100), openingHours || null)
    .input('statusNote', sql.NVarChar(500), statusNote || null)
    .input('lastStatusUpdate', sql.DateTime2, toDate(lastStatusUpdate))
    .query(`UPDATE dbo.shops
            SET openingHours = COALESCE(@openingHours, openingHours),
                statusNote = COALESCE(@statusNote, statusNote),
                lastStatusUpdate = @lastStatusUpdate
            WHERE id = @id`);
  return getShopById(id);
}

async function setMenuAvailability(shopId, menuId, isAvailable) {
  const pool = await getPool();
  const result = await pool.request()
    .input('shopId', sql.NVarChar(50), shopId)
    .input('menuId', sql.NVarChar(50), menuId)
    .input('isSoldOut', sql.Bit, !isAvailable)
    .query(`UPDATE dbo.menu_items
            SET isSoldOut = @isSoldOut
            WHERE id = @menuId AND shopId = @shopId`);

  if (result.rowsAffected[0] === 0) return null;

  await pool.request()
    .input('id', sql.NVarChar(50), shopId)
    .input('lastStatusUpdate', sql.DateTime2, new Date())
    .query('UPDATE dbo.shops SET lastStatusUpdate = @lastStatusUpdate WHERE id = @id');

  return getShopById(shopId);
}

async function closePool() {
  if (poolPromise) {
    const pool = await poolPromise.catch(() => null);
    if (pool) await pool.close();
    poolPromise = null;
  }
}

module.exports = {
  driver: 'mssql',
  getPool,
  closePool,
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

// server/db/mssqlRepository.js
// Repository สำหรับโหมด DB_DRIVER=mssql (SQL Server)
// คืนข้อมูลรูปแบบเดียวกับ jsonRepository เพื่อให้ controller ใช้ร่วมกันได้

const sql = require('mssql');
const { getMssqlConfig } = require('./config');
const { resetSprint2Data: resetSprint2DataInDb } = require('./schema');

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
    pool.request().query(`SELECT ${SHOP_COLUMNS} FROM dbo.shops ORDER BY sort_order, id`),
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
            ORDER BY sort_order, id`);

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

const REVIEW_COLUMNS = 'id, shop_id, username, rating, comment, client_ip, created_at';

// shopId = null → คืนรีวิวทั้งหมด (ใช้ตรวจกันสแปมใน POST /reviews)
async function listReviews(shopId = null) {
  const pool = await getPool();
  const request = pool.request();
  let query = `SELECT ${REVIEW_COLUMNS} FROM dbo.reviews`;

  if (shopId) {
    request.input('shopId', sql.NVarChar(50), shopId);
    query += ' WHERE shop_id = @shopId';
  }
  query += ' ORDER BY created_at DESC, id';

  const result = await request.query(query);
  return result.recordset;
}

async function createReview(review) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.NVarChar(50), review.id)
    .input('shopId', sql.NVarChar(50), review.shop_id)
    .input('username', sql.NVarChar(100), review.username)
    .input('rating', sql.Int, review.rating)
    .input('comment', sql.NVarChar(500), review.comment)
    .input('clientIp', sql.NVarChar(64), review.client_ip ?? null)
    .input('createdAt', sql.DateTime2, toDate(review.created_at))
    .query(`INSERT INTO dbo.reviews (id, shop_id, username, rating, comment, client_ip, created_at)
            VALUES (@id, @shopId, @username, @rating, @comment, @clientIp, @createdAt)`);

  return review;
}

function mapWeeklyRow(row) {
  const openTime = row.open_time ? String(row.open_time).trim() : null;
  const closeTime = row.close_time ? String(row.close_time).trim() : null;
  return {
    day_of_week: row.day_of_week,
    day_name: row.day_name,
    is_closed: row.is_closed === true,
    open_time: openTime,
    close_time: closeTime,
  };
}

function mapHolidayRow(row) {
  return {
    id: row.id,
    date: row.holiday_date,
    is_closed: row.is_closed === true,
    open_time: row.open_time ? String(row.open_time).trim() : null,
    close_time: row.close_time ? String(row.close_time).trim() : null,
    note: row.note || '',
  };
}

async function getOpeningHours(shopId) {
  const pool = await getPool();
  const header = await pool.request()
    .input('shopId', sql.NVarChar(50), shopId)
    .query('SELECT shop_id, updated_at FROM dbo.opening_hours WHERE shop_id = @shopId');

  if (!header.recordset[0]) return null;

  const [weekly, holidays] = await Promise.all([
    pool.request()
      .input('shopId', sql.NVarChar(50), shopId)
      .query('SELECT day_of_week, day_name, is_closed, open_time, close_time FROM dbo.opening_hours_weekly WHERE shop_id = @shopId ORDER BY day_of_week'),
    pool.request()
      .input('shopId', sql.NVarChar(50), shopId)
      .query('SELECT id, holiday_date, is_closed, open_time, close_time, note FROM dbo.special_holidays WHERE shop_id = @shopId ORDER BY holiday_date'),
  ]);

  return {
    weekly: weekly.recordset.map(mapWeeklyRow),
    special_holidays: holidays.recordset.map(mapHolidayRow),
    updated_at: toIsoOrNull(header.recordset[0].updated_at),
  };
}

// บันทึกทั้งชุด (weekly / special_holidays ที่ route เตรียมมาแล้ว) แทนข้อมูลเดิมของร้าน
async function saveOpeningHours(shopId, { weekly, special_holidays, updated_at }) {
  const pool = await getPool();
  const updatedAt = toDate(updated_at || new Date());

  await pool.request()
    .input('shopId', sql.NVarChar(50), shopId)
    .input('updatedAt', sql.DateTime2, updatedAt)
    .query(`IF EXISTS (SELECT 1 FROM dbo.opening_hours WHERE shop_id = @shopId)
              UPDATE dbo.opening_hours SET updated_at = @updatedAt WHERE shop_id = @shopId;
            ELSE
              INSERT INTO dbo.opening_hours (shop_id, updated_at) VALUES (@shopId, @updatedAt);`);

  if (Array.isArray(weekly)) {
    await pool.request()
      .input('shopId', sql.NVarChar(50), shopId)
      .query('DELETE FROM dbo.opening_hours_weekly WHERE shop_id = @shopId');

    for (const day of weekly) {
      await pool.request()
        .input('shopId', sql.NVarChar(50), shopId)
        .input('dayOfWeek', sql.TinyInt, day.day_of_week)
        .input('dayName', sql.NVarChar(20), day.day_name ?? null)
        .input('isClosed', sql.Bit, day.is_closed === true)
        .input('openTime', sql.Char(5), day.is_closed ? null : day.open_time)
        .input('closeTime', sql.Char(5), day.is_closed ? null : day.close_time)
        .query(`INSERT INTO dbo.opening_hours_weekly
                  (shop_id, day_of_week, day_name, is_closed, open_time, close_time)
                VALUES (@shopId, @dayOfWeek, @dayName, @isClosed, @openTime, @closeTime)`);
    }
  }

  if (Array.isArray(special_holidays)) {
    await pool.request()
      .input('shopId', sql.NVarChar(50), shopId)
      .query('DELETE FROM dbo.special_holidays WHERE shop_id = @shopId');

    for (const holiday of special_holidays) {
      await pool.request()
        .input('id', sql.NVarChar(50), holiday.id)
        .input('shopId', sql.NVarChar(50), shopId)
        .input('holidayDate', sql.Char(10), holiday.date)
        .input('isClosed', sql.Bit, holiday.is_closed !== false)
        .input('openTime', sql.Char(5), holiday.is_closed ? null : holiday.open_time)
        .input('closeTime', sql.Char(5), holiday.is_closed ? null : holiday.close_time)
        .input('note', sql.NVarChar(300), holiday.note ?? null)
        .query(`INSERT INTO dbo.special_holidays
                  (id, shop_id, holiday_date, is_closed, open_time, close_time, note)
                VALUES (@id, @shopId, @holidayDate, @isClosed, @openTime, @closeTime, @note)`);
    }
  }

  return getOpeningHours(shopId);
}

// ใช้โดยเทสต์: ล้างข้อมูล Sprint 2 แล้ว seed ใหม่ผ่าน DB (ไม่แตะไฟล์ JSON)
async function resetSprint2Data() {
  const pool = await getPool();
  return resetSprint2DataInDb(pool);
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
  listReviews,
  createReview,
  getOpeningHours,
  saveOpeningHours,
  resetSprint2Data,
};

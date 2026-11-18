// server/db/schema.js
// สร้างตาราง MSSQL และ seed ข้อมูลตั้งต้นจาก server/data/database.json
// ใช้ร่วมกันทั้งสคริปต์ db:init และตอน server bootstrap

const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const { INITIAL_REVIEWS, buildOpeningHoursSeed } = require('./defaults');

const SEED_PATH = path.join(__dirname, '../data/database.json');

const SCHEMA_STATEMENTS = [
  `IF OBJECT_ID('dbo.canteens', 'U') IS NULL
   BEGIN
     CREATE TABLE dbo.canteens (
       id NVARCHAR(50) NOT NULL PRIMARY KEY,
       name NVARCHAR(200) NOT NULL,
       shortName NVARCHAR(100) NULL,
       description NVARCHAR(400) NULL,
       landmark NVARCHAR(200) NULL,
       totalShops INT NULL,
       operatingHours NVARCHAR(100) NULL,
       sortOrder INT NOT NULL CONSTRAINT DF_canteens_sortOrder DEFAULT 0
     );
   END`,

  `IF OBJECT_ID('dbo.categories', 'U') IS NULL
   BEGIN
     CREATE TABLE dbo.categories (
       id NVARCHAR(50) NOT NULL PRIMARY KEY,
       name NVARCHAR(100) NOT NULL,
       icon NVARCHAR(50) NULL,
       sortOrder INT NOT NULL CONSTRAINT DF_categories_sortOrder DEFAULT 0
     );
   END`,

  `IF OBJECT_ID('dbo.shops', 'U') IS NULL
   BEGIN
     CREATE TABLE dbo.shops (
       id NVARCHAR(50) NOT NULL PRIMARY KEY,
       name NVARCHAR(150) NOT NULL,
       canteen NVARCHAR(50) NOT NULL,
       canteenName NVARCHAR(200) NULL,
       boothNumber NVARCHAR(50) NULL,
       locationDetails NVARCHAR(300) NULL,
       category NVARCHAR(50) NULL,
       categoryName NVARCHAR(100) NULL,
       isOpen BIT NOT NULL CONSTRAINT DF_shops_isOpen DEFAULT 0,
       statusNote NVARCHAR(500) NULL,
       openingHours NVARCHAR(100) NULL,
       phone VARCHAR(20) NULL,
       line_id NVARCHAR(50) NULL,
       facebook NVARCHAR(200) NULL,
       other_contact NVARCHAR(200) NULL,
       pin VARCHAR(20) NULL,
       vendorName NVARCHAR(200) NULL,
       accentColor VARCHAR(20) NULL,
       rating DECIMAL(3,2) NULL,
       reviewCount INT NOT NULL CONSTRAINT DF_shops_reviewCount DEFAULT 0,
       lastStatusUpdate DATETIME2 NULL,
       latitude DECIMAL(9,6) NULL,
       longitude DECIMAL(9,6) NULL,
       -- ลำดับร้านตาม index ใน database.json shops[] (0, 1, 2, ...)
       sort_order INT NOT NULL CONSTRAINT DF_shops_sort_order DEFAULT 0,
       CONSTRAINT FK_shops_canteen FOREIGN KEY (canteen) REFERENCES dbo.canteens(id)
     );
   END`,

  // ตารางอาจถูกสร้างจากเวอร์ชันก่อนที่ยังไม่มีคอลัมน์เหล่านี้ — เติมให้ครบ
  `IF COL_LENGTH('dbo.shops', 'latitude') IS NULL
     ALTER TABLE dbo.shops ADD latitude DECIMAL(9,6) NULL;`,
  `IF COL_LENGTH('dbo.shops', 'longitude') IS NULL
     ALTER TABLE dbo.shops ADD longitude DECIMAL(9,6) NULL;`,
  `IF COL_LENGTH('dbo.shops', 'sort_order') IS NULL
     ALTER TABLE dbo.shops ADD sort_order INT NOT NULL CONSTRAINT DF_shops_sort_order DEFAULT 0;`,

  `IF OBJECT_ID('dbo.admins', 'U') IS NULL
   BEGIN
     CREATE TABLE dbo.admins (
       id NVARCHAR(50) NOT NULL PRIMARY KEY,
       phone VARCHAR(20) NOT NULL,
       pin VARCHAR(20) NOT NULL,
       name NVARCHAR(200) NULL,
       role VARCHAR(20) NOT NULL CONSTRAINT DF_admins_role DEFAULT 'admin'
     );
   END`,

  `IF OBJECT_ID('dbo.menu_items', 'U') IS NULL
   BEGIN
     CREATE TABLE dbo.menu_items (
       id NVARCHAR(50) NOT NULL PRIMARY KEY,
       shopId NVARCHAR(50) NOT NULL,
       name NVARCHAR(200) NOT NULL,
       price DECIMAL(10,2) NOT NULL CONSTRAINT DF_menu_items_price DEFAULT 0,
       isSoldOut BIT NOT NULL CONSTRAINT DF_menu_items_isSoldOut DEFAULT 0,
       note NVARCHAR(200) NULL,
       sortOrder INT NOT NULL CONSTRAINT DF_menu_items_sortOrder DEFAULT 0,
       CONSTRAINT FK_menu_items_shop FOREIGN KEY (shopId) REFERENCES dbo.shops(id)
     );
   END`,

  `IF COL_LENGTH('dbo.menu_items', 'note') IS NULL
     ALTER TABLE dbo.menu_items ADD note NVARCHAR(200) NULL;`,

  // ------------------------------------------------------------------
  // Sprint 2: รีวิว / เวลาเปิด-ปิดประจำสัปดาห์ / วันหยุดพิเศษ
  // DDL เขียนเองสำหรับ MSSQL (ไม่ใช้ server/migrations/sprint2_nuttakorn.sql)
  // ------------------------------------------------------------------
  `IF OBJECT_ID('dbo.reviews', 'U') IS NULL
   BEGIN
     CREATE TABLE dbo.reviews (
       id NVARCHAR(50) NOT NULL PRIMARY KEY,
       shop_id NVARCHAR(50) NOT NULL,
       username NVARCHAR(100) NOT NULL,
       rating INT NOT NULL CONSTRAINT DF_reviews_rating DEFAULT 5,
       comment NVARCHAR(500) NOT NULL,
       client_ip NVARCHAR(64) NULL,
       created_at DATETIME2 NOT NULL CONSTRAINT DF_reviews_created_at DEFAULT SYSUTCDATETIME(),
       CONSTRAINT FK_reviews_shop FOREIGN KEY (shop_id) REFERENCES dbo.shops(id)
     );
   END`,

  `IF OBJECT_ID('dbo.opening_hours', 'U') IS NULL
   BEGIN
     CREATE TABLE dbo.opening_hours (
       shop_id NVARCHAR(50) NOT NULL PRIMARY KEY,
       updated_at DATETIME2 NULL,
       CONSTRAINT FK_opening_hours_shop FOREIGN KEY (shop_id) REFERENCES dbo.shops(id) ON DELETE CASCADE
     );
   END`,

  `IF OBJECT_ID('dbo.opening_hours_weekly', 'U') IS NULL
   BEGIN
     CREATE TABLE dbo.opening_hours_weekly (
       shop_id NVARCHAR(50) NOT NULL,
       day_of_week TINYINT NOT NULL,
       day_name NVARCHAR(20) NULL,
       is_closed BIT NOT NULL CONSTRAINT DF_oh_weekly_is_closed DEFAULT 0,
       open_time CHAR(5) NULL,
       close_time CHAR(5) NULL,
       CONSTRAINT PK_opening_hours_weekly PRIMARY KEY (shop_id, day_of_week),
       CONSTRAINT FK_oh_weekly_hours FOREIGN KEY (shop_id)
         REFERENCES dbo.opening_hours(shop_id) ON DELETE CASCADE
     );
   END`,

  `IF OBJECT_ID('dbo.special_holidays', 'U') IS NULL
   BEGIN
     CREATE TABLE dbo.special_holidays (
       id NVARCHAR(50) NOT NULL PRIMARY KEY,
       shop_id NVARCHAR(50) NOT NULL,
       holiday_date CHAR(10) NOT NULL,
       is_closed BIT NOT NULL CONSTRAINT DF_special_holidays_is_closed DEFAULT 1,
       open_time CHAR(5) NULL,
       close_time CHAR(5) NULL,
       note NVARCHAR(300) NULL,
       CONSTRAINT UQ_special_holidays_shop_date UNIQUE (shop_id, holiday_date),
       CONSTRAINT FK_special_holidays_hours FOREIGN KEY (shop_id)
         REFERENCES dbo.opening_hours(shop_id) ON DELETE CASCADE
     );
   END`,
];

// คอลัมน์ที่ใช้ทั้งตอน bulk insert และตอนนับ/ล้างตาราง
const TABLE_DEFINITIONS = {
  canteens: [
    ['id', sql.NVarChar(50)],
    ['name', sql.NVarChar(200)],
    ['shortName', sql.NVarChar(100)],
    ['description', sql.NVarChar(400)],
    ['landmark', sql.NVarChar(200)],
    ['totalShops', sql.Int],
    ['operatingHours', sql.NVarChar(100)],
    ['sortOrder', sql.Int],
  ],
  categories: [
    ['id', sql.NVarChar(50)],
    ['name', sql.NVarChar(100)],
    ['icon', sql.NVarChar(50)],
    ['sortOrder', sql.Int],
  ],
  shops: [
    ['id', sql.NVarChar(50)],
    ['name', sql.NVarChar(150)],
    ['canteen', sql.NVarChar(50)],
    ['canteenName', sql.NVarChar(200)],
    ['boothNumber', sql.NVarChar(50)],
    ['locationDetails', sql.NVarChar(300)],
    ['category', sql.NVarChar(50)],
    ['categoryName', sql.NVarChar(100)],
    ['isOpen', sql.Bit],
    ['statusNote', sql.NVarChar(500)],
    ['openingHours', sql.NVarChar(100)],
    ['phone', sql.VarChar(20)],
    ['line_id', sql.NVarChar(50)],
    ['facebook', sql.NVarChar(200)],
    ['other_contact', sql.NVarChar(200)],
    ['pin', sql.VarChar(20)],
    ['vendorName', sql.NVarChar(200)],
    ['accentColor', sql.VarChar(20)],
    ['rating', sql.Decimal(3, 2)],
    ['reviewCount', sql.Int],
    ['lastStatusUpdate', sql.DateTime2],
    ['latitude', sql.Decimal(9, 6)],
    ['longitude', sql.Decimal(9, 6)],
    ['sort_order', sql.Int],
  ],
  admins: [
    ['id', sql.NVarChar(50)],
    ['phone', sql.VarChar(20)],
    ['pin', sql.VarChar(20)],
    ['name', sql.NVarChar(200)],
    ['role', sql.VarChar(20)],
  ],
  menu_items: [
    ['id', sql.NVarChar(50)],
    ['shopId', sql.NVarChar(50)],
    ['name', sql.NVarChar(200)],
    ['price', sql.Decimal(10, 2)],
    ['isSoldOut', sql.Bit],
    ['note', sql.NVarChar(200)],
    ['sortOrder', sql.Int],
  ],
};

async function ensureSchema(pool) {
  for (const statement of SCHEMA_STATEMENTS) {
    await pool.request().query(statement);
  }
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// สร้างแถว seed จาก database.json (ไม่ hardcode ข้อมูลร้าน)
function buildSeedRows(db) {
  const canteens = (db.canteens || []).map((row, index) => ({
    id: row.id,
    name: row.name,
    shortName: row.shortName ?? null,
    description: row.description ?? null,
    landmark: row.landmark ?? null,
    totalShops: row.totalShops ?? 0,
    operatingHours: row.operatingHours ?? null,
    sortOrder: index,
  }));

  const categories = (db.categories || []).map((row, index) => ({
    id: row.id,
    name: row.name,
    icon: row.icon ?? null,
    sortOrder: index,
  }));

  const shops = (db.shops || []).map((row, index) => ({
    id: row.id,
    name: row.name,
    canteen: row.canteen,
    canteenName: row.canteenName ?? null,
    boothNumber: row.boothNumber ?? null,
    locationDetails: row.locationDetails ?? null,
    category: row.category ?? null,
    categoryName: row.categoryName ?? null,
    isOpen: row.isOpen === true,
    statusNote: row.statusNote ?? null,
    openingHours: row.openingHours ?? null,
    phone: row.phone ?? null,
    line_id: row.line_id ?? null,
    facebook: row.facebook ?? null,
    other_contact: row.other_contact ?? null,
    pin: row.pin ?? null,
    vendorName: row.vendorName ?? null,
    accentColor: row.accentColor ?? null,
    rating: toNumberOrNull(row.rating),
    reviewCount: row.reviewCount ?? 0,
    lastStatusUpdate: toDate(row.lastStatusUpdate),
    latitude: toNumberOrNull(row.latitude),
    longitude: toNumberOrNull(row.longitude),
    sort_order: index,
  }));

  const admins = (db.admins || []).map((row) => ({
    id: row.id,
    phone: row.phone,
    pin: row.pin,
    name: row.name ?? null,
    role: row.role || 'admin',
  }));

  // เมนู: ใช้ db.menu_items ถ้ามี ไม่งั้นดึงจาก shops[].menus ที่ฝังอยู่
  const sourceMenus = Array.isArray(db.menu_items) && db.menu_items.length
    ? db.menu_items
    : (db.shops || []).flatMap((shop) =>
        (shop.menus || []).map((menu) => ({
          id: menu.id,
          restaurant_id: shop.id,
          name: menu.name,
          price: menu.price,
          is_sold_out: menu.is_sold_out !== undefined
            ? menu.is_sold_out === true
            : menu.isAvailable === false,
          note: menu.note,
        })));

  const menuItems = sourceMenus.map((row, index) => ({
    id: row.id,
    shopId: row.restaurant_id || row.shopId,
    name: row.name,
    price: Number(row.price) || 0,
    isSoldOut: row.is_sold_out === true || row.isSoldOut === true,
    note: row.note ?? null,
    sortOrder: index,
  }));

  return { canteens, categories, shops, admins, menuItems };
}

async function insertRows(pool, tableName, rows) {
  if (!rows.length) return;

  const columns = TABLE_DEFINITIONS[tableName];
  const columnList = columns.map(([name]) => `[${name}]`).join(', ');
  const valueList = columns.map(([name]) => `@${name}`).join(', ');
  const statement = `INSERT INTO dbo.[${tableName}] (${columnList}) VALUES (${valueList})`;

  for (const row of rows) {
    const request = pool.request();
    for (const [name, type] of columns) {
      request.input(name, type, row[name] === undefined ? null : row[name]);
    }
    await request.query(statement);
  }
}

const DELETE_ORDER = ['menu_items', 'shops', 'admins', 'categories', 'canteens'];

async function clearTables(pool) {
  for (const table of DELETE_ORDER) {
    await pool.request().query(`DELETE FROM dbo.[${table}]`);
  }
}

async function countRows(pool, table) {
  const result = await pool.request().query(`SELECT COUNT(*) AS total FROM dbo.[${table}]`);
  return result.recordset[0].total;
}

async function countAll(pool) {
  const counts = {};
  for (const table of ['canteens', 'categories', 'shops', 'admins', 'menu_items']) {
    counts[table] = await countRows(pool, table);
  }
  return counts;
}

// seed ข้อมูลเมื่อตาราง shops ว่าง (หรือเมื่อ reset = true)
async function seedDatabase(pool, db, { reset = false } = {}) {
  if (reset) {
    // ล้างข้อมูล Sprint 2 ก่อน เพราะ reviews อ้างอิง shops
    await clearSprint2Tables(pool);
    await clearTables(pool);
  } else if (await countRows(pool, 'shops') > 0) {
    return { seeded: false, counts: await countAll(pool) };
  } else {
    // มีข้อมูลค้างบางตารางแต่ไม่มีร้าน ให้ล้างก่อนเพื่อไม่ให้ FK ชน
    await clearSprint2Tables(pool);
    await clearTables(pool);
  }

  const rows = buildSeedRows(db);

  await insertRows(pool, 'canteens', rows.canteens);
  await insertRows(pool, 'categories', rows.categories);
  await insertRows(pool, 'shops', rows.shops);
  await insertRows(pool, 'admins', rows.admins);
  await insertRows(pool, 'menu_items', rows.menuItems);

  return {
    seeded: true,
    counts: {
      canteens: rows.canteens.length,
      categories: rows.categories.length,
      shops: rows.shops.length,
      admins: rows.admins.length,
      menu_items: rows.menuItems.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Sprint 2 seed (reviews / opening_hours / special_holidays)
// ---------------------------------------------------------------------------

function buildSprint2SeedRows(db) {
  const reviews = INITIAL_REVIEWS.map((review) => ({
    ...review,
    created_at: toDate(review.created_at)
  }));

  // เวลาเปิด-ปิด seed จากสตริง openingHours ของแต่ละร้าน (เปิดทุกวันเวลาเดียวกัน)
  // แล้วเติมวันหยุดพิเศษตั้งต้นของร้านทดสอบ — ไม่มี override ตายตัวแล้ว
  const openingHours = [...buildOpeningHoursSeed(db.shops || []).values()];

  return { reviews, openingHours };
}

const SPRINT2_DELETE_ORDER = [
  'special_holidays',
  'opening_hours_weekly',
  'opening_hours',
  'reviews',
];

async function clearSprint2Tables(pool) {
  for (const table of SPRINT2_DELETE_ORDER) {
    if (!(await tableExists(pool, table))) continue;
    await pool.request().query(`DELETE FROM dbo.[${table}]`);
  }
}

async function tableExists(pool, table) {
  const result = await pool
    .request()
    .input('table', sql.NVarChar(100), table)
    .query(`SELECT 1 AS found FROM sys.tables WHERE name = @table AND schema_id = SCHEMA_ID('dbo')`);
  return result.recordset.length > 0;
}

async function insertOpeningHoursRecord(pool, record) {
  await pool
    .request()
    .input('shopId', sql.NVarChar(50), record.shop_id)
    .input('updatedAt', sql.DateTime2, toDate(record.updated_at))
    .query('INSERT INTO dbo.opening_hours (shop_id, updated_at) VALUES (@shopId, @updatedAt)');

  for (const day of record.weekly) {
    await pool
      .request()
      .input('shopId', sql.NVarChar(50), record.shop_id)
      .input('dayOfWeek', sql.TinyInt, day.day_of_week)
      .input('dayName', sql.NVarChar(20), day.day_name ?? null)
      .input('isClosed', sql.Bit, day.is_closed === true)
      .input('openTime', sql.Char(5), day.is_closed ? null : day.open_time)
      .input('closeTime', sql.Char(5), day.is_closed ? null : day.close_time)
      .query(`INSERT INTO dbo.opening_hours_weekly
                (shop_id, day_of_week, day_name, is_closed, open_time, close_time)
              VALUES (@shopId, @dayOfWeek, @dayName, @isClosed, @openTime, @closeTime)`);
  }

  for (const holiday of record.special_holidays) {
    await pool
      .request()
      .input('id', sql.NVarChar(50), holiday.id)
      .input('shopId', sql.NVarChar(50), record.shop_id)
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

// seed แบบ idempotent: ใส่รีวิวตั้งต้นเมื่อตารางว่าง และสร้างเวลาเปิด-ปิดให้ร้านที่ยังไม่มี
async function seedSprint2Data(pool, db, { reset = false } = {}) {
  if (reset) await clearSprint2Tables(pool);

  const rows = buildSprint2SeedRows(db);
  const counts = { reviews: 0, opening_hours: 0, special_holidays: 0 };

  if (reset || (await countRows(pool, 'reviews')) === 0) {
    for (const review of rows.reviews) {
      await pool
        .request()
        .input('id', sql.NVarChar(50), review.id)
        .input('shopId', sql.NVarChar(50), review.shop_id)
        .input('username', sql.NVarChar(100), review.username)
        .input('rating', sql.Int, review.rating)
        .input('comment', sql.NVarChar(500), review.comment)
        .input('clientIp', sql.NVarChar(64), review.client_ip ?? null)
        .input('createdAt', sql.DateTime2, review.created_at)
        .query(`INSERT INTO dbo.reviews (id, shop_id, username, rating, comment, client_ip, created_at)
                VALUES (@id, @shopId, @username, @rating, @comment, @clientIp, @createdAt)`);
      counts.reviews += 1;
    }
  }

  for (const record of rows.openingHours) {
    if (!reset) {
      const exists = await pool
        .request()
        .input('shopId', sql.NVarChar(50), record.shop_id)
        .query('SELECT 1 AS found FROM dbo.opening_hours WHERE shop_id = @shopId');
      if (exists.recordset.length > 0) continue;
    }

    const shopExists = await pool
      .request()
      .input('shopId', sql.NVarChar(50), record.shop_id)
      .query('SELECT 1 AS found FROM dbo.shops WHERE id = @shopId');
    if (shopExists.recordset.length === 0) continue;

    await insertOpeningHoursRecord(pool, record);
    counts.opening_hours += 1;
    counts.special_holidays += record.special_holidays.length;
  }

  return counts;
}

// ใช้โดยเทสต์ (resetStore) — ล้างข้อมูล Sprint 2 แล้ว seed ใหม่จาก database.json
async function resetSprint2Data(pool) {
  const db = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
  return seedSprint2Data(pool, db, { reset: true });
}

module.exports = {
  SCHEMA_STATEMENTS,
  TABLE_DEFINITIONS,
  ensureSchema,
  buildSeedRows,
  seedDatabase,
  seedSprint2Data,
  resetSprint2Data,
  buildSprint2SeedRows,
};

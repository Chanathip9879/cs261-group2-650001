// server/db/schema.js
// สร้างตาราง MSSQL และ seed ข้อมูลตั้งต้นจาก server/data/database.json
// ใช้ร่วมกันทั้งสคริปต์ db:init และตอน server bootstrap

const sql = require('mssql');

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
       CONSTRAINT FK_shops_canteen FOREIGN KEY (canteen) REFERENCES dbo.canteens(id)
     );
   END`,

  // ตารางอาจถูกสร้างจากเวอร์ชันก่อนที่ยังไม่มีคอลัมน์เหล่านี้ — เติมให้ครบ
  `IF COL_LENGTH('dbo.shops', 'latitude') IS NULL
     ALTER TABLE dbo.shops ADD latitude DECIMAL(9,6) NULL;`,
  `IF COL_LENGTH('dbo.shops', 'longitude') IS NULL
     ALTER TABLE dbo.shops ADD longitude DECIMAL(9,6) NULL;`,

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

  const shops = (db.shops || []).map((row) => ({
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
    await clearTables(pool);
  } else if (await countRows(pool, 'shops') > 0) {
    return { seeded: false, counts: await countAll(pool) };
  } else {
    // มีข้อมูลค้างบางตารางแต่ไม่มีร้าน ให้ล้างก่อนเพื่อไม่ให้ FK ชน
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

module.exports = {
  SCHEMA_STATEMENTS,
  TABLE_DEFINITIONS,
  ensureSchema,
  buildSeedRows,
  seedDatabase,
};

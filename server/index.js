// server/index.js
// ระบบ Backend API - HiwKhaw TU Rangsit (หิวข้าว มธ. รังสิต)

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const { bootstrapMssql } = require('./db/bootstrap');
const authController = require('./controllers/authController');
const shopController = require('./controllers/shopController');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

const nearbyShopsRoutes = require('./routes/nearbyShops');
const reviewRoutes = require('./routes/reviews');
const openingHoursRoutes = require('./routes/openingHours');

// Middleware
app.use(cors());
app.use(express.json());

// routes ของ Sprint 2 (reviews / opening-hours) อ่าน-เขียนผ่านชั้น server/db (MSSQL หรือ JSON)
app.use('/api/shops', nearbyShopsRoutes);
app.use('/api', reviewRoutes);
app.use('/api', openingHoursRoutes);

// Log incoming requests in dev
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString('th-TH')}] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'HiwKhaw - TU Rangsit Food Status',
    sprint: 'Sprint 1',
    database: db.driver,
    time: new Date().toISOString()
  });
});

// --- Auth Routes (U4: Log in จัดการร้านอาหาร) ---
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', authMiddleware, authController.getMe);

// --- Shop & Canteen Routes (U1, U2, U3, U5) ---
app.get('/api/shops', shopController.getShops);
app.get('/api/shops/:id', shopController.getShopById);
app.get('/api/canteens', shopController.getCanteens);
app.get('/api/categories', shopController.getCategories);

// U5: เปลี่ยนสถานะร้าน (Toggle Open/Closed) - ต้อง Login ก่อน
app.put('/api/shops/:id/status', authMiddleware, shopController.toggleShopStatus);
app.put('/api/shops/:id/details', authMiddleware, shopController.updateShopDetails);

// Task 27: ดึงรายการเมนูของร้าน
app.get('/api/shops/:id/menus', shopController.getMenusByShop);
app.put('/api/shops/:id/menus/:menuId', authMiddleware, shopController.updateMenuAvailability);

// เวลาเปิด-ปิดรายวัน (U12 ดู / U13 ตั้งเวลา) ให้ routes/openingHours.js เป็นผู้ให้บริการ

// ==========================================
// Serve Static Frontend (Production Build)
// ==========================================
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    // If not API route, send index.html
    if (!req.url.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// ==========================================
// Start Server
// ==========================================
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// โหมด MSSQL: เตรียม database/ตาราง/seed ก่อนเปิด server (ปิดได้ด้วย DB_AUTO_INIT=false)
async function prepareDatabase() {
  if (db.driver !== 'mssql') return;
  if (String(process.env.DB_AUTO_INIT || 'true').toLowerCase() === 'false') return;

  const reset = String(process.env.DB_AUTO_RESET || 'false').toLowerCase() === 'true';
  const attempts = Number(process.env.DB_INIT_RETRIES || 15);

  console.log('🔌 กำลังเตรียมฐานข้อมูล MSSQL...');
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await bootstrapMssql({ reset });
      if (result) {
        console.log(result.seeded
          ? `✅ seed ข้อมูลตั้งต้นแล้ว (shops=${result.counts.shops}, menus=${result.counts.menu_items})`
          : '✅ ฐานข้อมูลพร้อมใช้งาน (มีข้อมูลอยู่แล้ว)');
      }
      return;
    } catch (err) {
      console.warn(`[db] รอ SQL Server (${attempt}/${attempts}): ${err.message}`);
      if (attempt === attempts) throw err;
      await sleep(3000);
    }
  }
}

async function start() {
  await prepareDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  🌾 HiwKhaw (หิวข้าว) - TU Rangsit Backend Ready!  `);
    console.log(`  🚀 Server running at: http://localhost:${PORT}      `);
    console.log(`  🗄️  Database driver: ${db.driver}                  `);
    console.log(`  📋 Sprint 1 APIs active: U1, U2, U3, U4, U5        `);
    console.log(`====================================================`);
  });
}

start().catch((err) => {
  console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', err.message);
  console.error('   ตรวจสอบ SQL Server หรือตั้ง DB_DRIVER=json เพื่อใช้ database.json');
  process.exit(1);
});

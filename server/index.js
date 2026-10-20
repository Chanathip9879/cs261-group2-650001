// server/index.js
// ระบบ Backend API - HiwKhaw TU Rangsit (หิวข้าว มธ. รังสิต)

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authController = require('./controllers/authController');
const shopController = require('./controllers/shopController');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
    time: new Date().toISOString()
  });
});

// --- Auth Routes (U4: Log in จัดการร้านอาหาร) ---
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', authMiddleware, authController.getMe);

// --- Shop & Canteen Routes (U1, U2, U3, U5) ---
// U1: ตรวจสอบสถานะเปิด/ปิดร้านอาหารแบบ Real-time
// U2: ระบบค้นหาร้านอาหาร (ค้นหาชื่อร้าน ชื่อเมนู filter โรงอาหาร/หมวดหมู่)
// U3: แสดงร้านอาหารและที่ตั้ง
app.get('/api/shops', shopController.getShops);
app.get('/api/shops/:id', shopController.getShopById);
app.get('/api/canteens', shopController.getCanteens);
app.get('/api/categories', shopController.getCategories);

// U5: เปลี่ยนสถานะร้าน (Toggle Open/Closed) - ต้อง Login ก่อน
app.put('/api/shops/:id/status', authMiddleware, shopController.toggleShopStatus);
app.put('/api/shops/:id/details', authMiddleware, shopController.updateShopDetails);

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

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`  🌾 HiwKhaw (หิวข้าว) - TU Rangsit Backend Ready!  `);
  console.log(`  🚀 Server running at: http://localhost:${PORT}      `);
  console.log(`  📋 Sprint 1 APIs active: U1, U2, U3, U4, U5        `);
  console.log(`====================================================`);
});

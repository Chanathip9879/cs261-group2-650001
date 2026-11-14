const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load Database
let db = {
  canteens: [],
  categories: [],
  restaurants: [],
  owners: [],
  reviews: []
};

function loadDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      db = JSON.parse(raw);
      console.log('Database loaded successfully:', {
        restaurants: db.restaurants.length,
        owners: db.owners.length,
        reviews: db.reviews.length
      });
    }
  } catch (err) {
    console.error('Error loading data.json:', err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data.json:', err);
  }
}

loadDatabase();

// In-Memory Sessions & Brute force tracking
const activeSessions = new Map(); // token -> { ownerId, restaurantId, phone, expiresAt }
const failedAttempts = new Map(); // phone -> { count, lockedUntil }

// 1. Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', service: 'TU Canteen WebApp', timestamp: new Date().toISOString() });
});

// 2. Canteens List
app.get('/api/canteens', (req, res) => {
  res.json(db.canteens);
});

// 3. Categories List
app.get('/api/categories', (req, res) => {
  res.json(db.categories);
});

// 4. Search & Filter Restaurants (U2 & U3)
app.get('/api/restaurants/search', (req, res) => {
  const { q, canteen, category, status } = req.query;

  let results = db.restaurants.map(r => {
    const shopReviews = db.reviews.filter(rev => rev.restaurantId === r.id);
    const avgRating = shopReviews.length > 0
      ? Number((shopReviews.reduce((sum, rev) => sum + rev.rating, 0) / shopReviews.length).toFixed(1))
      : r.rating;

    return {
      ...r,
      rating: avgRating,
      reviewCount: shopReviews.length
    };
  });

  // Filter Canteen (Green Canteen or Science Faculty)
  if (canteen && canteen !== 'ALL') {
    results = results.filter(r => r.canteenCode === canteen);
  }

  // Filter Open/Closed Status
  if (status && status !== 'ALL') {
    if (status === 'OPEN') results = results.filter(r => r.isOpen);
    if (status === 'CLOSED') results = results.filter(r => !r.isOpen);
  }

  // Filter Category
  if (category && category !== 'ทั้งหมด' && category !== 'ALL') {
    results = results.filter(r => r.categories && r.categories.includes(category));
  }

  // Search by Query (Shop Name or Product Name)
  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    results = results.filter(r => {
      const matchName = r.name.toLowerCase().includes(query);
      const matchStall = (r.stallNumber || '').toLowerCase().includes(query);
      const matchProduct = r.products && r.products.some(p => p.name.toLowerCase().includes(query));
      return matchName || matchStall || matchProduct;
    });
  }

  res.json({
    total: results.length,
    canteenFilter: canteen || 'ALL',
    categoryFilter: category || 'ALL',
    data: results
  });
});

// 5. Get Single Restaurant Detail with Products & Reviews
app.get('/api/restaurants/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const restaurant = db.restaurants.find(r => r.id === id);

  if (!restaurant) {
    return res.status(404).json({ message: 'ไม่พบร้านอาหาร' });
  }

  const shopReviews = db.reviews.filter(r => r.restaurantId === id);
  res.json({
    ...restaurant,
    reviews: shopReviews
  });
});

// 6. Owner Authentication: Phone (10 digits) + PIN (4-6 digits) (U4)
app.post('/api/auth/owner/login', (req, res) => {
  const { phone, pin } = req.body;

  if (!phone || !pin) {
    return res.status(400).json({ message: 'กรุณากรอกเบอร์โทรศัพท์และ PIN' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก' });
  }
  if (pin.length < 4 || pin.length > 6) {
    return res.status(400).json({ message: 'PIN ต้องเป็นตัวเลข 4-6 หลัก' });
  }

  // Check Brute Force Lockout
  const attempt = failedAttempts.get(cleanPhone) || { count: 0, lockedUntil: null };
  const now = Date.now();
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    const remainingSec = Math.ceil((attempt.lockedUntil - now) / 1000);
    return res.status(429).json({
      message: `บัญชีถูกระงับชั่วคราวเนื่องจากใส่รหัสผิดเกิน 5 ครั้ง กรุณารอ ${remainingSec} วินาที`,
      retryAfterSeconds: remainingSec
    });
  }

  // Verify phone and pin
  const owner = db.owners.find(o => o.phone === cleanPhone && String(o.pin) === String(pin));

  if (!owner) {
    attempt.count += 1;
    if (attempt.count >= 5) {
      attempt.lockedUntil = now + (5 * 60 * 1000); // Lock 5 minutes
      failedAttempts.set(cleanPhone, attempt);
      return res.status(429).json({
        message: 'กรอก PIN ผิดเกิน 5 ครั้ง บัญชีถูกล็อก 5 นาที',
        retryAfterSeconds: 300
      });
    }
    failedAttempts.set(cleanPhone, attempt);
    return res.status(401).json({ message: 'เบอร์โทรศัพท์หรือ PIN ไม่ถูกต้อง' });
  }

  // Reset failed attempts on success
  failedAttempts.delete(cleanPhone);

  // Generate Session Token
  const token = 'tu_token_' + Math.random().toString(36).substring(2) + Date.now();
  const sessionData = {
    ownerId: owner.id,
    restaurantId: owner.restaurantId,
    phone: owner.phone,
    role: 'OWNER',
    expiresAt: now + (8 * 60 * 60 * 1000) // 8 Hours
  };
  activeSessions.set(token, sessionData);

  const restaurant = db.restaurants.find(r => r.id === owner.restaurantId);

  res.json({
    token,
    tokenType: 'Bearer',
    role: 'OWNER',
    ownerId: owner.id,
    restaurantId: owner.restaurantId,
    restaurantName: restaurant ? restaurant.name : '',
    expiresInSeconds: 28800
  });
});

// 7. Verify Auth Token (Route Guard /api/auth/me)
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'ยังไม่ได้เข้าสู่ระบบ' });
  }

  const token = authHeader.substring(7).trim();
  const session = activeSessions.get(token);

  if (!session || Date.now() > session.expiresAt) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ message: 'Token หมดอายุหรือเซสชันไม่ถูกต้อง' });
  }

  const restaurant = db.restaurants.find(r => r.id === session.restaurantId);
  res.json({
    ownerId: session.ownerId,
    restaurantId: session.restaurantId,
    restaurantName: restaurant ? restaurant.name : '',
    canteenCode: restaurant ? restaurant.canteenCode : '',
    phone: session.phone,
    role: session.role
  });
});

// 8. Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    activeSessions.delete(token);
  }
  res.status(204).end();
});

// 9. Toggle Open/Close Status (U5 & Task 22)
app.patch('/api/restaurants/:id/status', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (!status || !['OPEN', 'CLOSED', 'BUSY'].includes(status)) {
    return res.status(400).json({ message: 'สถานะไม่ถูกต้อง (ต้องเป็น OPEN หรือ CLOSED)' });
  }

  const restaurant = db.restaurants.find(r => r.id === id);
  if (!restaurant) {
    return res.status(404).json({ message: 'ไม่พบร้านอาหาร' });
  }

  restaurant.isOpen = (status === 'OPEN');
  restaurant.updatedAt = new Date().toISOString();
  saveDatabase();

  res.json({
    restaurantId: id,
    status: restaurant.isOpen ? 'OPEN' : 'CLOSED',
    isOpen: restaurant.isOpen,
    message: restaurant.isOpen ? 'เปิดร้านเรียบร้อย' : 'ปิดร้านเรียบร้อย'
  });
});

// 10. Update Operating Hours
app.patch('/api/restaurants/:id/hours', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { openTime, closeTime } = req.body;

  const restaurant = db.restaurants.find(r => r.id === id);
  if (!restaurant) {
    return res.status(404).json({ message: 'ไม่พบร้านอาหาร' });
  }

  if (openTime) restaurant.openTime = openTime;
  if (closeTime) restaurant.closeTime = closeTime;
  saveDatabase();

  res.json({
    restaurantId: id,
    openTime: restaurant.openTime,
    closeTime: restaurant.closeTime,
    message: 'บันทึกเวลาเปิด-ปิดร้านสำเร็จ'
  });
});

// 11. Toggle Product Sold Out (เมนูหมด) (U6 & Merchant feature)
app.patch('/api/products/:id/soldout', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const { isSoldOut } = req.body;

  let foundProduct = null;
  let targetShop = null;

  for (const shop of db.restaurants) {
    const prod = shop.products.find(p => p.id === productId);
    if (prod) {
      foundProduct = prod;
      targetShop = shop;
      break;
    }
  }

  if (!foundProduct) {
    return res.status(404).json({ message: 'ไม่พบเมนูอาหาร' });
  }

  foundProduct.isSoldOut = typeof isSoldOut === 'boolean' ? isSoldOut : !foundProduct.isSoldOut;
  saveDatabase();

  res.json({
    productId: foundProduct.id,
    name: foundProduct.name,
    isSoldOut: foundProduct.isSoldOut,
    message: foundProduct.isSoldOut ? 'ตั้งค่าเป็น: สินค้าหมด' : 'ตั้งค่าเป็น: พร้อมขาย'
  });
});

// 12. Add New Product to Restaurant
app.post('/api/restaurants/:id/products', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: 'กรุณาระบุชื่อเมนูและราคา' });
  }

  const restaurant = db.restaurants.find(r => r.id === id);
  if (!restaurant) {
    return res.status(404).json({ message: 'ไม่พบร้านอาหาร' });
  }

  const newProduct = {
    id: Date.now(),
    name: name.trim(),
    price: parseFloat(price) || 40,
    isSoldOut: false
  };

  restaurant.products.push(newProduct);
  saveDatabase();

  res.status(201).json(newProduct);
});

// 13. Add Review Without Login (User Requirement)
app.post('/api/restaurants/:id/reviews', (req, res) => {
  const restaurantId = parseInt(req.params.id, 10);
  const { userName, rating, comment } = req.body;

  if (!comment || !comment.trim()) {
    return res.status(400).json({ message: 'กรุณากรอกข้อความรีวิว' });
  }

  const restaurant = db.restaurants.find(r => r.id === restaurantId);
  if (!restaurant) {
    return res.status(404).json({ message: 'ไม่พบร้านอาหาร' });
  }

  const newReview = {
    id: Date.now(),
    restaurantId,
    userName: (userName && userName.trim()) ? userName.trim() : 'นักศึกษา มธ.',
    rating: parseInt(rating, 10) || 5,
    comment: comment.trim(),
    date: new Date().toISOString().split('T')[0]
  };

  db.reviews.unshift(newReview);
  saveDatabase();

  res.status(201).json(newReview);
});

// 14. Admin Add New Restaurant (Admin Requirement)
app.post('/api/admin/restaurants', (req, res) => {
  const { name, canteenCode, stallNumber, openTime, closeTime, category, initialOwnerPhone, initialOwnerPin } = req.body;

  if (!name || !canteenCode) {
    return res.status(400).json({ message: 'กรุณาระบุชื่อร้านและโรงอาหาร' });
  }

  const canteen = db.canteens.find(c => c.code === canteenCode);
  const newId = Date.now();

  const newShop = {
    id: newId,
    name: name.trim(),
    canteenCode,
    canteenName: canteen ? canteen.nameTh : 'โรงอาหาร มธ.รังสิต',
    stallNumber: stallNumber || 'ล็อคใหม่',
    isOpen: true,
    openTime: openTime || '08:00',
    closeTime: closeTime || '16:00',
    rating: 5.0,
    categories: category ? [category] : ['อาหารตามสั่ง'],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
    products: []
  };

  db.restaurants.push(newShop);

  // If initial owner credentials provided
  if (initialOwnerPhone && initialOwnerPin) {
    db.owners.push({
      id: Date.now() + 1,
      phone: initialOwnerPhone.replace(/\D/g, ''),
      pin: initialOwnerPin,
      restaurantId: newId
    });
  }

  saveDatabase();
  res.status(201).json(newShop);
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`TU Canteen Food WebApp running at: http://localhost:${PORT}`);
  console.log(`Demo Canteens: Green Canteen & Science Faculty`);
  console.log(`Demo Merchant: Phone 0812345678, PIN 1234`);
  console.log(`===================================================`);
});

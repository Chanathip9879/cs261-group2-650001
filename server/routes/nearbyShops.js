const express = require('express');
const router = express.Router();
const { readStore } = require('../utils/dbAdapter');
const { calculateHaversineDistance, validateCoordinates } = require('../utils/haversine');

/**
 * GET /api/shops/nearby?lat=14.0735&lng=100.6015
 * รองรับตัวกรองเสริม: canteen, q, category
 */
router.get('/nearby', (req, res) => {
  try {
    const { lat: rawLat, lng: rawLng, canteen, q, category } = req.query;

    // 1. ตรวจสอบความถูกต้องของพิกัดผู้ใช้
    const validation = validateCoordinates(rawLat, rawLng);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const userLat = validation.lat;
    const userLng = validation.lng;

    // 2. ดึงข้อมูลร้านค้าทั้งหมด
    const store = readStore();
    const shops = Array.isArray(store.shops) ? store.shops : [];

    const nearbyOpenShops = [];

    for (const shop of shops) {
      // 3. กรองเฉพาะร้านที่เปิดอยู่ (Open)
      const isOpen =
        shop.is_open === true ||
        shop.is_open === 1 ||
        String(shop.status || '').toUpperCase() === 'OPEN';

      if (!isOpen) {
        continue;
      }

      // 4. ข้ามร้านที่ไม่มีพิกัด (null / undefined / NaN) โดยไม่ทำให้ระบบล่ม
      if (
        shop.latitude === null ||
        shop.latitude === undefined ||
        shop.longitude === null ||
        shop.longitude === undefined ||
        String(shop.latitude).trim() === '' ||
        String(shop.longitude).trim() === ''
      ) {
        continue;
      }

      const shopLat = Number(shop.latitude);
      const shopLng = Number(shop.longitude);

      if (!Number.isFinite(shopLat) || !Number.isFinite(shopLng)) {
        continue;
      }

      // กรองตาม query เสริม (ถ้ามีการส่งมา)
      if (canteen && String(shop.canteen || '').toLowerCase() !== String(canteen).toLowerCase()) {
        continue;
      }
      if (category && String(shop.category || '').toLowerCase() !== String(category).toLowerCase()) {
        continue;
      }
      if (q && !String(shop.name || '').toLowerCase().includes(String(q).toLowerCase())) {
        continue;
      }

      // 5. คำนวณระยะทางด้วยสูตร Haversine
      const { distance_km, distance_m } = calculateHaversineDistance(
        userLat,
        userLng,
        shopLat,
        shopLng
      );

      nearbyOpenShops.push({
        ...shop,
        distance_km,
        distance_m
      });
    }

    // 6. เรียงผลลัพธ์จากใกล้ไปไกล (Ascending)
    nearbyOpenShops.sort((a, b) => a.distance_km - b.distance_km);

    return res.status(200).json({
      success: true,
      user_location: {
        lat: userLat,
        lng: userLng
      },
      total: nearbyOpenShops.length,
      data: nearbyOpenShops
    });
  } catch (error) {
    console.error('[GET /api/shops/nearby] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ขณะค้นหาร้านใกล้ฉัน'
    });
  }
});

module.exports = router;
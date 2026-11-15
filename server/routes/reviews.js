const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { readStore, writeStore } = require('../utils/dbAdapter');

// ตั้งค่ากันสแปมเบื้องต้น
const COOLDOWN_SAME_SHOP_MS = 60 * 1000; // ห้ามโพสต์ร้านเดิมซ้ำภายใน 60 วินาที
const WINDOW_RATE_LIMIT_MS = 10 * 60 * 1000; // ช่วงเวลา 10 นาที
const MAX_REVIEWS_PER_WINDOW = 5; // โพสต์ได้สูงสุด 5 รีวิวต่อ 10 นาที
const DUPLICATE_COMMENT_WINDOW_MS = 24 * 60 * 60 * 1000; // ห้ามโพสต์ข้อความเดิมซ้ำใน 24 ชม.

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

// client_ip ใช้ภายในสำหรับกันสแปมเท่านั้น ห้ามส่งออกไปกับ response
function toPublicReview(review) {
  const { client_ip, ...publicReview } = review;
  return publicReview;
}

function handleGetReviews(req, res, shopId) {
  try {
    if (!shopId || String(shopId).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุรหัสร้านค้า (shop_id)'
      });
    }

    const store = readStore();
    const shopExists = (store.shops || []).some((s) => s.id === shopId);
    if (!shopExists) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบร้านค้ารหัส ${shopId}`
      });
    }

    const shopReviews = (store.reviews || [])
      .filter((r) => r.shop_id === shopId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const totalReviews = shopReviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round(
            (shopReviews.reduce((sum, item) => sum + Number(item.rating || 5), 0) / totalReviews) *
              10
          ) / 10
        : 0;

    return res.status(200).json({
      success: true,
      shop_id: shopId,
      total: totalReviews,
      average_rating: averageRating,
      data: shopReviews.map(toPublicReview)
    });
  } catch (error) {
    console.error('[GET Reviews] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ขณะดึงรายการรีวิว'
    });
  }
}

function handleCreateReview(req, res, shopIdFromParam) {
  try {
    const shopId = shopIdFromParam || req.body.shop_id || req.body.shopId;
    const rawUsername = req.body.username;
    const rawComment = req.body.comment ?? req.body.message ?? req.body.text;
    const rawRating = req.body.rating;

    // 1. ตรวจสอบรหัสร้านค้า
    if (!shopId || String(shopId).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุรหัสร้านค้า (shop_id)'
      });
    }

    const store = readStore();
    const shopExists = (store.shops || []).some((s) => s.id === shopId);
    if (!shopExists) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบร้านค้ารหัส ${shopId}`
      });
    }

    // 2. ตรวจสอบ username
    if (typeof rawUsername !== 'string' || rawUsername.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อผู้รีวิว (username)'
      });
    }
    const username = rawUsername.trim();
    if (username.length < 2 || username.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อผู้รีวิวต้องมีความยาว 2 ถึง 50 ตัวอักษร'
      });
    }

    // 3. ตรวจสอบข้อความรีวิว (ค่าว่าง, สั้นเกินไป < 10 ตัวอักษร, ยาวเกิน 500 ตัวอักษร)
    if (typeof rawComment !== 'string' || rawComment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อความรีวิว ห้ามเว้นว่าง'
      });
    }
    const comment = rawComment.trim();
    if (comment.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'ข้อความรีวิวสั้นเกินไป กรุณากรอกอย่างน้อย 10 ตัวอักษร'
      });
    }
    if (comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'ข้อความรีวิวต้องไม่เกิน 500 ตัวอักษร'
      });
    }

    // 4. ตรวจสอบคะแนนดาว (ถ้ามีการส่งมา)
    let rating = 5;
    if (rawRating !== undefined && rawRating !== null && String(rawRating).trim() !== '') {
      const parsedRating = Number(rawRating);
      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'คะแนนดาว (rating) ต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 5'
        });
      }
      rating = parsedRating;
    }

    // 5. ระบบกันสแปมเบื้องต้น
    const clientIp = getClientIp(req);
    const now = Date.now();
    const allReviews = Array.isArray(store.reviews) ? store.reviews : [];

    // 5.1 เช็กจำนวนครั้งทั้งหมดในช่วง 10 นาทีล่าสุดจากผู้ใช้หรือ IP เดียวกัน
    const recentUserReviews = allReviews.filter((r) => {
      const createdTime = new Date(r.created_at).getTime();
      const sameActor =
        r.username.toLowerCase() === username.toLowerCase() ||
        (r.client_ip && r.client_ip === clientIp && clientIp !== 'unknown');
      return sameActor && now - createdTime < WINDOW_RATE_LIMIT_MS;
    });

    if (recentUserReviews.length >= MAX_REVIEWS_PER_WINDOW) {
      return res.status(429).json({
        success: false,
        message: 'คุณส่งรีวิวบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง'
      });
    }

    // 5.2 เช็ก Cooldown การโพสต์ร้านเดิมซ้ำภายใน 60 วินาที
    const lastSameShopReview = allReviews
      .filter((r) => {
        const sameActor =
          r.username.toLowerCase() === username.toLowerCase() ||
          (r.client_ip && r.client_ip === clientIp && clientIp !== 'unknown');
        return r.shop_id === shopId && sameActor;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    if (lastSameShopReview) {
      const elapsedMs = now - new Date(lastSameShopReview.created_at).getTime();
      if (elapsedMs < COOLDOWN_SAME_SHOP_MS) {
        const retryAfterSec = Math.ceil((COOLDOWN_SAME_SHOP_MS - elapsedMs) / 1000);
        return res.status(429).json({
          success: false,
          message: `กรุณารออีก ${retryAfterSec} วินาที ก่อนส่งรีวิวให้ร้านนี้อีกครั้ง`,
          retry_after_seconds: retryAfterSec
        });
      }
    }

    // 5.3 เช็กข้อความซ้ำเดิมในร้านเดียวกันภายใน 24 ชั่วโมง
    const isDuplicateComment = allReviews.some((r) => {
      const createdTime = new Date(r.created_at).getTime();
      return (
        r.shop_id === shopId &&
        r.username.toLowerCase() === username.toLowerCase() &&
        r.comment.trim().toLowerCase() === comment.toLowerCase() &&
        now - createdTime < DUPLICATE_COMMENT_WINDOW_MS
      );
    });

    if (isDuplicateComment) {
      return res.status(429).json({
        success: false,
        message: 'ตรวจพบข้อความรีวิวซ้ำกับที่คุณเคยส่งไปแล้ว'
      });
    }

    // 6. บันทึกข้อมูลรีวิวลงฐานข้อมูล
    const newReview = {
      id: `rev-${crypto.randomUUID().slice(0, 8)}`,
      shop_id: shopId,
      username,
      rating,
      comment,
      client_ip: clientIp,
      created_at: new Date(now).toISOString()
    };

    store.reviews = [newReview, ...allReviews];
    writeStore(store);

    return res.status(201).json({
      success: true,
      message: 'บันทึกรีวิวสำเร็จ',
      data: toPublicReview(newReview)
    });
  } catch (error) {
    console.error('[POST Reviews] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ขณะบันทึกรีวิว'
    });
  }
}

// รองรับทั้งรูปแบบ /api/shops/:shopId/reviews และ /api/reviews
router.get('/shops/:shopId/reviews', (req, res) => {
  return handleGetReviews(req, res, req.params.shopId);
});

router.post('/shops/:shopId/reviews', (req, res) => {
  return handleCreateReview(req, res, req.params.shopId);
});

router.get('/reviews', (req, res) => {
  const shopId = req.query.shop_id || req.query.shopId;
  return handleGetReviews(req, res, shopId);
});

router.post('/reviews', (req, res) => {
  return handleCreateReview(req, res, null);
});

module.exports = router;
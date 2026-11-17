const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { DEFAULT_WEEKLY_HOURS } = require('../db/defaults');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function isValidCalendarDate(dateStr) {
  if (!DATE_ISO_REGEX.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Middleware ตรวจสอบสิทธิ์เฉพาะเจ้าของร้านนั้นๆ (หรือแอดมิน)
 * ใช้ Token ตัวเดียวกับที่ได้จาก POST /api/auth/login และตรวจด้วย authMiddleware ตัวเดียวกับ API อื่น
 * (เดิมถอด payload จาก Token เองโดยไม่ตรวจกับฐานข้อมูล ทำให้ Token ของ Login ใช้ไม่ได้ และปลอมสิทธิ์ได้)
 */
function requireShopOwner(req, res, next) {
  authMiddleware(req, res, () => {
    const user = req.user || {};
    if (user.role !== 'admin' && user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึง: เฉพาะเจ้าของร้านเท่านั้นที่แก้ไขเวลาเปิด/ปิดได้'
      });
    }

    if (user.role === 'vendor' && user.shopId !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์แก้ไขเวลาเปิด/ปิดของร้านอื่น'
      });
    }

    next();
  });
}

/**
 * ตรวจสอบความถูกต้องของข้อมูลเวลาเปิด/ปิดประจำสัปดาห์และวันหยุดพิเศษ
 */
function validateOpeningHoursPayload(body) {
  const { weekly, special_holidays } = body;

  if (weekly === undefined && special_holidays === undefined) {
    return {
      valid: false,
      error: 'กรุณาส่งข้อมูล weekly หรือ special_holidays อย่างน้อย 1 รายการ'
    };
  }

  let normalizedWeekly = undefined;
  if (weekly !== undefined) {
    if (!Array.isArray(weekly) || weekly.length === 0) {
      return {
        valid: false,
        error: 'ข้อมูล weekly ต้องเป็น Array ของตารางเวลาเปิด/ปิดประจำสัปดาห์'
      };
    }

    const seenDays = new Set();
    normalizedWeekly = [];

    for (const item of weekly) {
      const dayOfWeek = Number(item.day_of_week);
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return {
          valid: false,
          error: `ค่า day_of_week ไม่ถูกต้อง (${item.day_of_week}) ต้องเป็นตัวเลข 0 ถึง 6`
        };
      }

      if (seenDays.has(dayOfWeek)) {
        return {
          valid: false,
          error: `พบข้อมูลวันซ้ำกันในสัปดาห์ (day_of_week: ${dayOfWeek})`
        };
      }
      seenDays.add(dayOfWeek);

      const isClosed = Boolean(item.is_closed);
      if (isClosed) {
        normalizedWeekly.push({
          day_of_week: dayOfWeek,
          day_name: DAY_NAMES[dayOfWeek],
          is_closed: true,
          open_time: null,
          close_time: null
        });
        continue;
      }

      const openTime = String(item.open_time || '').trim();
      const closeTime = String(item.close_time || '').trim();

      if (!TIME_24H_REGEX.test(openTime) || !TIME_24H_REGEX.test(closeTime)) {
        return {
          valid: false,
          error: `รูปแบบเวลาของวัน${DAY_NAMES[dayOfWeek]}ไม่ถูกต้อง ต้องเป็น HH:MM (เช่น 08:00 - 19:00)`
        };
      }

      if (timeToMinutes(closeTime) <= timeToMinutes(openTime)) {
        return {
          valid: false,
          error: `ช่วงเวลาของวัน${DAY_NAMES[dayOfWeek]}ไม่สมเหตุสมผล เวลาปิด (${closeTime}) ต้องหลังเวลาเปิด (${openTime})`
        };
      }

      normalizedWeekly.push({
        day_of_week: dayOfWeek,
        day_name: DAY_NAMES[dayOfWeek],
        is_closed: false,
        open_time: openTime,
        close_time: closeTime
      });
    }

    normalizedWeekly.sort((a, b) => a.day_of_week - b.day_of_week);
  }

  let normalizedHolidays = undefined;
  if (special_holidays !== undefined) {
    if (!Array.isArray(special_holidays)) {
      return {
        valid: false,
        error: 'ข้อมูล special_holidays ต้องเป็น Array'
      };
    }

    const seenDates = new Set();
    normalizedHolidays = [];

    for (const h of special_holidays) {
      const dateStr = String(h.date || h.holiday_date || '').trim();
      if (!isValidCalendarDate(dateStr)) {
        return {
          valid: false,
          error: `รูปแบบวันที่วันหยุดพิเศษไม่ถูกต้อง (${dateStr}) ต้องเป็น YYYY-MM-DD`
        };
      }

      if (seenDates.has(dateStr)) {
        return {
          valid: false,
          error: `พบวันที่วันหยุดพิเศษซ้ำกัน (${dateStr})`
        };
      }
      seenDates.add(dateStr);

      const isClosed = h.is_closed === undefined ? true : Boolean(h.is_closed);
      const note = h.note ? String(h.note).trim() : '';

      if (isClosed) {
        normalizedHolidays.push({
          id: h.id || `hol-${crypto.randomUUID().slice(0, 8)}`,
          date: dateStr,
          is_closed: true,
          open_time: null,
          close_time: null,
          note
        });
        continue;
      }

      const openTime = String(h.open_time || '').trim();
      const closeTime = String(h.close_time || '').trim();

      if (!TIME_24H_REGEX.test(openTime) || !TIME_24H_REGEX.test(closeTime)) {
        return {
          valid: false,
          error: `รูปแบบเวลาของวันที่ ${dateStr} ไม่ถูกต้อง ต้องเป็น HH:MM`
        };
      }

      if (timeToMinutes(closeTime) <= timeToMinutes(openTime)) {
        return {
          valid: false,
          error: `ช่วงเวลาของวันที่ ${dateStr} ไม่สมเหตุสมผล เวลาปิด (${closeTime}) ต้องหลังเวลาเปิด (${openTime})`
        };
      }

      normalizedHolidays.push({
        id: h.id || `hol-${crypto.randomUUID().slice(0, 8)}`,
        date: dateStr,
        is_closed: false,
        open_time: openTime,
        close_time: closeTime,
        note
      });
    }

    normalizedHolidays.sort((a, b) => a.date.localeCompare(b.date));
  }

  return {
    valid: true,
    weekly: normalizedWeekly,
    special_holidays: normalizedHolidays
  };
}

/**
 * GET /api/shops/:id/opening-hours
 * ดึงข้อมูลตารางเวลาเปิด/ปิดประจำสัปดาห์และวันหยุดพิเศษของร้าน
 */
router.get('/shops/:id/opening-hours', async (req, res) => {
  try {
    const shopId = req.params.id;

    if (!(await db.shopExists(shopId))) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบร้านค้ารหัส ${shopId}`
      });
    }

    const record = (await db.getOpeningHours(shopId)) || {
      weekly: DEFAULT_WEEKLY_HOURS,
      special_holidays: []
    };

    return res.status(200).json({
      success: true,
      shop_id: shopId,
      data: record
    });
  } catch (error) {
    console.error('[GET Opening Hours] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ขณะดึงเวลาเปิด/ปิดร้าน'
    });
  }
});

/**
 * PUT /api/shops/:id/opening-hours (และ POST alias)
 * ตั้งเวลาเปิด/ปิดประจำสัปดาห์และวันหยุดพิเศษ (เฉพาะ OWNER ของร้านนั้น)
 */
async function handleUpdateOpeningHours(req, res) {
  try {
    const shopId = req.params.id;

    if (!(await db.shopExists(shopId))) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบร้านค้ารหัส ${shopId}`
      });
    }

    const validation = validateOpeningHoursPayload(req.body || {});
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const existing = (await db.getOpeningHours(shopId)) || {
      weekly: JSON.parse(JSON.stringify(DEFAULT_WEEKLY_HOURS)),
      special_holidays: []
    };

    const updated = {
      weekly: validation.weekly !== undefined ? validation.weekly : existing.weekly,
      special_holidays:
        validation.special_holidays !== undefined
          ? validation.special_holidays
          : existing.special_holidays,
      updated_at: new Date().toISOString()
    };

    await db.saveOpeningHours(shopId, updated);

    return res.status(200).json({
      success: true,
      message: 'บันทึกตารางเวลาเปิด/ปิดร้านเรียบร้อยแล้ว',
      shop_id: shopId,
      data: updated
    });
  } catch (error) {
    console.error('[PUT Opening Hours] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ขณะบันทึกเวลาเปิด/ปิดร้าน'
    });
  }
}

router.put('/shops/:id/opening-hours', requireShopOwner, handleUpdateOpeningHours);
router.post('/shops/:id/opening-hours', requireShopOwner, handleUpdateOpeningHours);

module.exports = router;
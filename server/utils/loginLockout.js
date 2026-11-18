// server/utils/loginLockout.js
// U7: ล็อกบัญชีชั่วคราวเมื่อกรอก PIN ผิดติดกันหลายครั้ง (เก็บใน memory)
// สเปก response อยู่ที่ docs/API_LOGIN_LOCKOUT.md
//
// หมายเหตุ: เก็บในหน่วยความจำของโปรเซสเท่านั้น — รีสตาร์ท server แล้วค่าจะถูกล้าง
// ทุกฟังก์ชันรับ `now` (ms) เป็นพารามิเตอร์ได้ เพื่อให้เทสต์ส่งเวลาเองโดยไม่ต้องรอจริง

require('dotenv').config();

function toPositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// ผิดครบ 5 ครั้ง -> ล็อก 5 นาที (ปรับได้ผ่าน env)
const MAX_ATTEMPTS = toPositiveInt(process.env.LOGIN_MAX_ATTEMPTS, 5);
const LOCK_SECONDS = toPositiveInt(process.env.LOGIN_LOCK_SECONDS, 5 * 60);
const LOCK_MS = LOCK_SECONDS * 1000;

// normalized phone -> { failures, lockedUntil } (lockedUntil = 0 แปลว่ายังไม่ล็อก)
const records = new Map();

// ตัดอักขระที่ไม่ใช่ตัวเลขออก เพื่อให้เบอร์รูปแบบต่างกันนับรวมกัน
function normalizePhone(phone) {
  return String(phone == null ? '' : phone).replace(/\D/g, '');
}

// คืนข้อมูลการล็อกถ้ายังล็อกอยู่ (ถ้าหมดเวลาแล้วจะปลดและล้างค่าให้อัตโนมัติ)
function getLock(phone, now = Date.now()) {
  const key = normalizePhone(phone);
  if (!key) return null;
  const record = records.get(key);
  if (!record || !record.lockedUntil) return null;
  if (record.lockedUntil <= now) {
    records.delete(key);
    return null;
  }
  return { lockedUntil: record.lockedUntil, retryAfterMs: record.lockedUntil - now };
}

// นับครั้งที่ผิด คืนสถานะว่าครั้งนี้ทำให้ถูกล็อกหรือไม่
function recordFailure(phone, now = Date.now()) {
  const key = normalizePhone(phone);
  if (!key) return { locked: false, failures: 0 };

  let record = records.get(key);
  // ล็อกหมดอายุแล้ว -> เริ่มนับใหม่
  if (record && record.lockedUntil && record.lockedUntil <= now) {
    record = undefined;
  }
  // ยังล็อกอยู่ -> ไม่ต้องนับเพิ่ม
  if (record && record.lockedUntil && record.lockedUntil > now) {
    return { locked: true, lockedUntil: record.lockedUntil, retryAfterMs: record.lockedUntil - now };
  }

  const failures = (record ? record.failures : 0) + 1;
  if (failures >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCK_MS;
    records.set(key, { failures: 0, lockedUntil });
    return { locked: true, lockedUntil, retryAfterMs: LOCK_MS };
  }

  records.set(key, { failures, lockedUntil: 0 });
  return { locked: false, failures, remaining: MAX_ATTEMPTS - failures };
}

// ล้างสถานะเมื่อเข้าสู่ระบบสำเร็จ
function reset(phone) {
  const key = normalizePhone(phone);
  if (key) records.delete(key);
}

module.exports = {
  MAX_ATTEMPTS,
  LOCK_SECONDS,
  LOCK_MS,
  normalizePhone,
  getLock,
  recordFailure,
  reset
};

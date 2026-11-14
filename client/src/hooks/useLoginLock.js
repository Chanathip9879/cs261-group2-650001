// client/src/hooks/useLoginLock.js
// U7: จัดการสถานะบัญชีถูกล็อกจากการกรอก PIN ผิดเกินกำหนด
// - เก็บเวลาปลดล็อกแยกตามเบอร์โทร ใน localStorage (รีเฟรชหน้าแล้วยังนับถอยหลังต่อ)
// - นับถอยหลังทุก 1 วินาที และปลดล็อกอัตโนมัติเมื่อหมดเวลา

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'hiwkhaw_login_locks';
const MAX_LOCK_MS = 24 * 60 * 60 * 1000; // กันค่าผิดปกติจาก server (ไม่เกิน 24 ชม.)

export const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '');

function readLocks() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const now = Date.now();
    // ทิ้งรายการที่หมดเวลาแล้ว
    return Object.fromEntries(Object.entries(raw).filter(([, until]) => Number(until) > now));
  } catch {
    return {};
  }
}

function writeLocks(locks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locks));
  } catch {
    // storage ใช้ไม่ได้: ยังล็อกได้ภายในหน้านี้
  }
}

// แปลงมิลลิวินาทีเป็น "นาที:วินาที" เช่น 4:05 (เกิน 1 ชม. แสดง ชม.:นาที:วินาที)
export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

export default function useLoginLock(phone) {
  const key = normalizePhone(phone);
  const [locks, setLocks] = useState(readLocks);
  const [now, setNow] = useState(Date.now());

  const unlockAt = key ? locks[key] || null : null;
  const remainingMs = unlockAt ? Math.max(0, unlockAt - now) : 0;
  const isLocked = remainingMs > 0;

  // นับถอยหลังเฉพาะตอนที่ถูกล็อกอยู่
  useEffect(() => {
    if (!unlockAt) return undefined;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [unlockAt]);

  // หมดเวลาล็อก -> ลบออกจาก storage
  useEffect(() => {
    if (unlockAt && remainingMs === 0) {
      setLocks((prev) => {
        const next = { ...prev };
        delete next[key];
        writeLocks(next);
        return next;
      });
    }
  }, [unlockAt, remainingMs, key]);

  const lock = useCallback((lockPhone, until) => {
    const k = normalizePhone(lockPhone);
    if (!k || !until) return;
    const safeUntil = Math.min(until, Date.now() + MAX_LOCK_MS);
    setLocks((prev) => {
      const next = { ...prev, [k]: safeUntil };
      writeLocks(next);
      return next;
    });
    setNow(Date.now());
  }, []);

  return { isLocked, remainingMs, unlockAt, lock };
}

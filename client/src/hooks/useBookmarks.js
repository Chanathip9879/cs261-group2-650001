// client/src/hooks/useBookmarks.js
// US14: บันทึกร้านโปรด เก็บเฉพาะรหัสร้านใน localStorage ของเครื่อง (ไม่ต้องล็อกอิน)

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'hiwkhaw_bookmarks';

function readIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage เต็มหรือถูกปิด: ข้ามไป state ในหน้ายังใช้งานได้
  }
}

export default function useBookmarks() {
  const [ids, setIds] = useState(readIds);

  // ซิงก์กับแท็บอื่นของเบราว์เซอร์เดียวกัน
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setIds(readIds());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isBookmarked = useCallback((shopId) => ids.includes(shopId), [ids]);

  // คืนค่า true ถ้าหลังกดแล้วร้านถูกบันทึกไว้
  const toggleBookmark = useCallback((shopId) => {
    const current = readIds();
    const exists = current.includes(shopId);
    const next = exists ? current.filter((x) => x !== shopId) : [...current, shopId];
    writeIds(next);
    setIds(next);
    return !exists;
  }, []);

  return { bookmarkedIds: ids, isBookmarked, toggleBookmark };
}

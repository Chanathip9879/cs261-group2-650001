// client/src/hooks/useLocalList.js
// state ที่เก็บใน localStorage (ใช้กับรีวิว, วันหยุดพิเศษ, ข้อมูลลูกค้า ที่ยังไม่มี API ฝั่ง server)

import { useCallback, useState } from 'react';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function useLocalState(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback));
  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        try {
          if (resolved === null || resolved === undefined) localStorage.removeItem(key);
          else localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // storage ถูกปิด: ใช้งานต่อได้ภายในหน้า
        }
        return resolved;
      });
    },
    [key]
  );
  return [value, update];
}

// client/src/components/BookmarkButton.jsx
// US14 / Task51: ปุ่มหัวใจบันทึกร้านโปรด (ใช้ในการ์ดร้านและหน้ารายละเอียดร้าน)

import React from 'react';
import { Heart } from 'lucide-react';

export default function BookmarkButton({ active, onToggle, shopName, className = '' }) {
  const handleClick = (e) => {
    // กันไม่ให้การกดหัวใจไปเปิดหน้ารายละเอียดร้าน
    e.stopPropagation();
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={(e) => e.stopPropagation()}
      aria-pressed={active}
      aria-label={active ? `เอา ${shopName} ออกจากร้านโปรด` : `บันทึก ${shopName} เป็นร้านโปรด`}
      title={active ? 'เอาออกจากร้านโปรด' : 'บันทึกเป็นร้านโปรด'}
      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition active:scale-90 focus:outline-none focus:ring-2 focus:ring-rose-400/40 ${
        active
          ? 'bg-rose-50 border-rose-200 text-rose-500'
          : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200'
      } ${className}`}
    >
      <Heart className="w-[18px] h-[18px]" fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}

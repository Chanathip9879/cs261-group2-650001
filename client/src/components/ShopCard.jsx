// client/src/components/ShopCard.jsx
// U1: ตรวจสอบสถานะเปิด/ปิดร้านอาหารแบบ Real-time
// U3: แสดงร้านอาหารและที่ตั้ง

import React from 'react';
import { MapPin, Clock, ChevronRight, UtensilsCrossed } from 'lucide-react';

export default function ShopCard({ shop, onSelect }) {
  const isOpen = shop.isOpen;

  // สีและสไตล์ตามโรงอาหาร
  const isGreenCanteen = shop.canteen === 'green';

  return (
    <div
      onClick={() => onSelect(shop)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(shop)}
      className={`group relative overflow-hidden rounded-2xl border transition duration-200 cursor-pointer active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
        isOpen
          ? 'bg-white border-slate-200/90 hover:border-emerald-500/50 hover:shadow-md'
          : 'bg-slate-100/80 border-slate-200 opacity-80 hover:opacity-95'
      }`}
    >
      {/* แถบสีด้านบนสะท้อนความสดใสของร้าน */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: isOpen ? shop.accentColor || '#10B981' : '#94A3B8' }}
      />

      <div className="p-4 space-y-3">
        {/* แถวที่ 1: สถานะเปิด/ปิด (U1) และ ป้ายโรงอาหาร (U3) */}
        <div className="flex items-center justify-between gap-2">
          {/* สถานะเปิด/ปิด แบบ Real-time */}
          {isOpen ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live"></span>
              เปิดอยู่
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              ปิดแล้ว
            </span>
          )}

          {/* ป้ายโรงอาหารและล็อค */}
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                isGreenCanteen
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-sky-100 text-sky-800'
              }`}
            >
              {shop.canteenName}
            </span>
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {shop.boothNumber}
            </span>
          </div>
        </div>

        {/* แถวที่ 2: ชื่อร้านและหมวดหมู่อาหาร */}
        <div>
          <h3 className={`text-base font-bold leading-tight ${isOpen ? 'text-slate-900 group-hover:text-emerald-700 transition' : 'text-slate-600'}`}>
            {shop.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <span>{shop.categoryName}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {shop.openingHours} น.
            </span>
          </p>
        </div>

        {/* สถานะเพิ่มเติมจากแม่ค้า (ถ้ามี) */}
        {shop.statusNote && (
          <div className={`p-2 rounded-xl text-xs ${isOpen ? 'bg-emerald-50/60 text-emerald-900' : 'bg-slate-200/60 text-slate-700'}`}>
            <span className="font-medium">{isOpen ? '📢 ' : '⚠️ '}{shop.statusNote}</span>
          </div>
        )}

        {/* แถวที่ 3: เมนูตัวอย่าง (Preview 2-3 เมนู) */}
        {shop.menus && shop.menus.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <UtensilsCrossed className="w-3 h-3" />
                เมนูแนะนำ
              </span>
              <span className="text-[11px] text-emerald-600 group-hover:translate-x-0.5 transition flex items-center">
                ดูทั้งหมด ({shop.menus.length})
                <ChevronRight className="w-3 h-3 inline" />
              </span>
            </div>
            <div className="space-y-1">
              {shop.menus.slice(0, 2).map((menu) => (
                <div key={menu.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 truncate max-w-[200px]">{menu.name}</span>
                  <span className="font-semibold text-slate-800">฿{menu.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* แถวที่ 4: ที่ตั้งร้าน (U3) */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-1">
          <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
          <span className="truncate">{shop.locationDetails}</span>
        </div>
      </div>
    </div>
  );
}

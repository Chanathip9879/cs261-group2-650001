// client/src/components/ShopDetailModal.jsx
// U3: แสดงร้านอาหารและที่ตั้ง (แสดงรายละเอียดร้าน ผังโรงอาหาร และรายการเมนู)

import React from 'react';
import { X, MapPin, Clock, Phone, Utensils, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ShopDetailModal({ shop, onClose }) {
  if (!shop) return null;

  const isOpen = shop.isOpen;
  const isGreenCanteen = shop.canteen === 'green';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card / Bottom Sheet */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                isGreenCanteen ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
              }`}
            >
              {shop.canteenName}
            </span>
            <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
              {shop.boothNumber}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* ชื่อร้าน & สถานะเปิด/ปิด (U1, U3) */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {shop.name}
              </h2>

              {isOpen ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-live"></span>
                  เปิดอยู่
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  ปิดแล้ว
                </span>
              )}
            </div>

            <p className="text-sm text-slate-500">{shop.categoryName} • จัดการโดย {shop.vendorName}</p>
          </div>

          {/* ป้ายข้อความแจ้งเตือนจากร้าน */}
          {shop.statusNote && (
            <div className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-sm ${
              isOpen ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-amber-50 text-amber-900 border border-amber-200'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs uppercase tracking-wider text-slate-500 mb-0.5">ข้อความจากร้าน</p>
                <p className="font-medium">{shop.statusNote}</p>
              </div>
            </div>
          )}

          {/* ข้อมูลที่ตั้ง & เวลาเปิดปิด (U3) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">ข้อมูลที่ตั้งและเวลาทำการ</h4>

            <div className="flex items-start gap-2.5 text-sm text-slate-700">
              <MapPin className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <span className="font-semibold">{shop.locationDetails}</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {shop.canteenInfo?.landmark || (isGreenCanteen ? 'ข้างอาคารบรรยายรวม SC และ TU Dome' : 'ใกล้อาคาร บร.4 และศูนย์คอมพิวเตอร์')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <Clock className="w-4 h-4 flex-shrink-0 text-slate-500" />
              <span>เวลาเปิด-ปิด: <strong className="font-semibold">{shop.openingHours} น.</strong></span>
            </div>

            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <Phone className="w-4 h-4 flex-shrink-0 text-slate-500" />
              <span>เบอร์ติดต่อร้าน: <strong className="font-semibold">{shop.phone}</strong></span>
            </div>
          </div>

          {/* รายการเมนูอาหารทั้งหมด (U3) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-emerald-600" />
                รายการเมนูอาหาร ({shop.menus ? shop.menus.length : 0})
              </h4>
              <span className="text-xs text-slate-400">ราคามาตรฐาน มธ.</span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-2xs">
              {shop.menus && shop.menus.length > 0 ? (
                shop.menus.map((m) => (
                  <div key={m.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-sm font-medium text-slate-800">{m.name}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-700">฿{m.price}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">ยังไม่มีรายการเมนู</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white p-4 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl text-sm transition active:scale-98 shadow-sm"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

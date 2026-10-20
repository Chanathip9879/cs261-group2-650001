// client/src/components/VendorDashboard.jsx
// U5: เปลี่ยนสถานะร้าน (ปุ่มกดเปิด/ปิดร้านของแม่ค้า และอัปเดตข้อความแจ้งเตือน)

import React, { useState } from 'react';
import { Power, Check, AlertCircle, LogOut, Store, Clock, MapPin, Save } from 'lucide-react';
import { updateShopStatus } from '../services/api';

export default function VendorDashboard({
  currentUser,
  currentShop,
  onStatusUpdated,
  onLogout,
  onClose
}) {
  if (!currentUser || !currentShop) return null;

  const [isOpen, setIsOpen] = useState(currentShop.isOpen);
  const [statusNote, setStatusNote] = useState(currentShop.statusNote || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // สลับสถานะเปิด/ปิดร้านด้วยการแตะครั้งเดียว (U5)
  const handleToggleStatus = async () => {
    const nextStatus = !isOpen;
    setIsUpdating(true);
    setFeedback(null);

    try {
      const res = await updateShopStatus(currentShop.id, nextStatus, statusNote);
      setIsOpen(nextStatus);
      onStatusUpdated(res.data, res.message);
      setFeedback({ type: 'success', text: `เปลี่ยนสถานะเป็น ${nextStatus ? 'เปิดร้าน' : 'ปิดร้าน'} สำเร็จ!` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'ไม่สามารถเปลี่ยนสถานะได้' });
    } finally {
      setIsUpdating(false);
    }
  };

  // บันทึกข้อความแจ้งเตือนลูกค้า
  const handleSaveNote = async () => {
    setIsUpdating(true);
    setFeedback(null);

    try {
      const res = await updateShopStatus(currentShop.id, isOpen, statusNote);
      onStatusUpdated(res.data, 'บันทึกข้อความเรียบร้อย');
      setFeedback({ type: 'success', text: 'บันทึกข้อความแจ้งเตือนสำเร็จ' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header Profile */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {currentShop.name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>{currentShop.canteenName}</span>
                <span>•</span>
                <span>{currentShop.boothNumber}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95"
            title="ออกจากระบบ"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {feedback.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* U5: สวิตช์ควบคุมสถานะร้านหลัก (Master Toggle) */}
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                สถานะร้านอาหารปัจจุบัน
              </span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {isOpen ? '🟢 ร้านเปิดให้บริการอยู่ (OPEN)' : '🔴 ร้านปิดให้บริการ (CLOSED)'}
              </p>
            </div>
          </div>

          {/* ปุ่มสวิตช์ขนาดใหญ่ สัมผัสง่ายสำหรับมือถือ */}
          <button
            onClick={handleToggleStatus}
            disabled={isUpdating}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-md active:scale-98 ${
              isOpen
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-4 ring-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-800/30'
            }`}
          >
            <Power className={`w-5 h-5 ${isOpen ? 'animate-pulse' : ''}`} />
            <span>
              {isUpdating
                ? 'กำลังอัปเดตสถานะ...'
                : isOpen
                ? 'กดที่นี่เพื่อ "ปิดร้าน"'
                : 'กดที่นี่เพื่อ "เปิดร้าน"'}
            </span>
          </button>

          <p className="text-[11px] text-center text-slate-400">
            *เมื่อเปลี่ยนสถานะ หน้าร้านของนักศึกษาจะอัปเดตตามทันที
          </p>
        </div>

        {/* ข้อความแจ้งเตือนลูกค้า (เช่น ของหมด, พักเบรก 15 นาที) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            ข้อความแจ้งลูกค้าหน้าร้าน (Status Note)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="เช่น เปิดปกติ มีกับข้าวร้อนๆ, ของหมดแล้วจ้า"
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            <button
              onClick={handleSaveNote}
              disabled={isUpdating}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึก</span>
            </button>
          </div>
        </div>

        {/* ข้อมูลทั่วไปของร้าน */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> เวลาทำการตามตาราง
            </span>
            <span className="font-semibold text-slate-800">{currentShop.openingHours} น.</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> ตำแหน่งที่ตั้ง
            </span>
            <span className="font-semibold text-slate-800">{currentShop.locationDetails}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition"
        >
          กลับสู่หน้าร้านทั่วไป
        </button>
      </div>
    </div>
  );
}

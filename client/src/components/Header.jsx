// client/src/components/Header.jsx
// ส่วนหัวของเว็บ Mobile-First แสดงชื่อแอป สถานะ Real-time และปุ่มสลับไปยังโหมดแม่ค้า (U4)

import React, { useState, useEffect } from 'react';
import { Store, RefreshCw, UserCheck, LogIn, Clock } from 'lucide-react';

export default function Header({
  currentUser,
  onOpenLogin,
  onOpenDashboard,
  onRefresh,
  isRefreshing,
  activeShopStatus
}) {
  const [currentTime, setCurrentTime] = useState('');

  // อัปเดตเวลานาฬิกาแบบ Real-time ทุก 1 นาที
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-2xl mx-auto px-4 py-3">
        {/* แถวบน: โลโก้แอป, ข้อมูลวิทยาเขต และปุ่มจัดการ */}
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Campus */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  HiwKhaw <span className="text-emerald-600 font-medium text-base">หิวข้าว</span>
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-tu-red">
                  มธ.รังสิต
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live inline-block"></span>
                <span className="font-medium text-emerald-700">Live Status</span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3 inline text-slate-400" />
                  {currentTime}
                </span>
              </p>
            </div>
          </div>

          {/* ปุ่มการกระทำฝั่งขวา */}
          <div className="flex items-center gap-1.5">
            {/* ปุ่มกด Refresh สดเหมือน Grab */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="รีเฟรชข้อมูลสถานะร้าน"
              className="p-2 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-slate-100 active:scale-95 transition"
              title="รีเฟรชสถานะสด"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            {/* ปุ่มสำหรับแม่ค้า/แอดมิน */}
            {currentUser ? (
              <button
                onClick={onOpenDashboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 active:scale-95 transition"
              >
                <span className={`w-2 h-2 rounded-full ${activeShopStatus ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <UserCheck className="w-3.5 h-3.5" />
                <span className="max-w-[110px] truncate">{currentUser.vendorName || currentUser.name}</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-sm transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>สำหรับแม่ค้า</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

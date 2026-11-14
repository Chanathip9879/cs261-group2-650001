// client/src/components/OpeningHoursTable.jsx
// U12 / Task46: แสดงเวลาเปิด/ปิดของร้านในหน้าร้าน (สรุปวันนี้ + ตารางรายสัปดาห์)

import React, { useState, useEffect } from 'react';
import { Clock, CalendarDays } from 'lucide-react';
import { getOpeningHours } from '../services/api';
import { DAY_NAMES, DISPLAY_ORDER } from '../utils/openingHours';

export default function OpeningHoursTable({ shopId, fallbackText }) {
  const [rows, setRows] = useState(null); // null = กำลังโหลด
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setFailed(false);
    getOpeningHours(shopId)
      .then((data) => !cancelled && setRows(data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  // โหลดไม่ได้ หรือร้านยังไม่มีตารางรายวัน -> แสดงข้อความเวลาเดิมของร้าน
  if (failed || (rows && rows.length === 0)) {
    return (
      <div className="flex items-center gap-2.5 text-sm text-slate-700">
        <Clock className="w-4 h-4 flex-shrink-0 text-slate-500" />
        <span>เวลาเปิด-ปิด: <strong className="font-semibold">{fallbackText} น.</strong></span>
      </div>
    );
  }

  if (rows === null) {
    return <div className="h-24 rounded-xl bg-slate-100 animate-pulse" aria-label="กำลังโหลดเวลาเปิด-ปิด" />;
  }

  const today = new Date().getDay();
  const todayRow = rows.find((r) => r.day_of_week === today);
  const todayClosed = !todayRow || todayRow.is_closed;

  return (
    <div className="space-y-3">
      {/* สรุปเวลาของวันนี้ */}
      <div
        className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm ${
          todayClosed ? 'bg-rose-50 text-rose-800' : 'bg-orange-50 text-orange-900'
        }`}
      >
        <span className="flex items-center gap-2 font-medium">
          <Clock className="w-4 h-4" />
          วันนี้ ({DAY_NAMES[today]})
        </span>
        <strong className="font-bold">
          {todayClosed ? 'ร้านหยุด' : `${todayRow.open_time} - ${todayRow.close_time} น.`}
        </strong>
      </div>

      {/* ตารางประจำสัปดาห์ จันทร์ - อาทิตย์ */}
      <div>
        <p className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" /> ตารางเวลาประจำสัปดาห์
        </p>
        <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl bg-white overflow-hidden">
          {DISPLAY_ORDER.map((day) => {
            const row = rows.find((r) => r.day_of_week === day);
            const closed = !row || row.is_closed;
            const isToday = day === today;
            return (
              <li
                key={day}
                className={`flex items-center justify-between px-3.5 py-2 text-sm ${isToday ? 'bg-orange-50/60' : ''}`}
              >
                <span className={`flex items-center gap-2 ${isToday ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                  {DAY_NAMES[day]}
                  {isToday && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500 text-white">วันนี้</span>
                  )}
                </span>
                {closed ? (
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">หยุด</span>
                ) : (
                  <span className="font-semibold text-slate-800">
                    {row.open_time} - {row.close_time} น.
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

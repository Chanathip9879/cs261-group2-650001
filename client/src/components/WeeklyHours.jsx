// client/src/components/WeeklyHours.jsx
// U12 / Task46: ตารางเวลาเปิด-ปิดรายสัปดาห์ในหน้าร้าน (ดีไซน์ใหม่)
// rows = ผลจาก getOpeningHours: undefined = กำลังโหลด, null = โหลดไม่สำเร็จ, [] = ร้านยังไม่ตั้งตาราง

import React, { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { buildFullWeek, DAY_NAMES, DISPLAY_ORDER } from '../utils/openingHours';

export default function WeeklyHours({ rows, fallbackText, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  if (rows === undefined) {
    return <div className="h-11 animate-pulse rounded-xl bg-surface-low" aria-label="กำลังโหลดเวลาเปิด-ปิด" />;
  }

  // โหลดไม่สำเร็จ หรือร้านยังไม่ได้ตั้งตารางรายวัน -> ใช้เวลาเดิมของร้านทุกวัน
  const week = buildFullWeek(rows || [], fallbackText);
  const usingFallback = !rows || rows.length === 0;
  const today = new Date().getDay();

  return (
    <div className="overflow-hidden rounded-xl bg-surface-low">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="weekly-hours"
        className="flex w-full items-center justify-between gap-2 p-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <CalendarDays className="size-4 text-brand" /> เวลาเปิด-ปิดทั้งสัปดาห์
        </span>
        <ChevronDown className={`size-4 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id="weekly-hours" className="px-3 pb-3">
          <ul className="divide-y divide-surface-mid rounded-lg bg-white">
            {DISPLAY_ORDER.map((day) => {
              const d = week.find((x) => x.day_of_week === day);
              const isToday = day === today;
              return (
                <li
                  key={day}
                  aria-current={isToday ? 'date' : undefined}
                  className={`flex items-center justify-between px-3 py-2 text-xs ${isToday ? 'bg-brand-peach/40 font-semibold' : ''}`}
                >
                  <span className="flex items-center gap-1.5 text-ink">
                    {DAY_NAMES[day]}
                    {isToday && <span className="rounded bg-brand-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">วันนี้</span>}
                  </span>
                  {d.is_closed ? (
                    <span className="font-medium text-danger">ปิดทำการ</span>
                  ) : (
                    <span className="tabular-nums text-ink">{d.open_time} - {d.close_time} น.</span>
                  )}
                </li>
              );
            })}
          </ul>
          {usingFallback && (
            <p className="mt-2 text-[11px] text-ink-muted">ร้านยังไม่ได้ตั้งเวลารายวัน แสดงเวลาทำการปกติของร้าน</p>
          )}
        </div>
      )}
    </div>
  );
}

// client/src/components/OpeningHoursForm.jsx
// U13 / Task49: ฟอร์มตั้งเวลาเปิด/ปิดร้านรายวันใน Dashboard ของแม่ค้า
// หน้าตาอิงจาก Figma: Store Hours Schedule (การ์ดต่อวัน, สวิตช์, ช่องเวลาเปิด/ปิด, Quick Apply)

import React, { useState, useEffect } from 'react';
import { CalendarClock, Save, Loader2, Sun } from 'lucide-react';
import { getOpeningHours, saveOpeningHours } from '../services/api';
import {
  DAY_NAMES,
  DAY_NAMES_EN,
  DAY_INITIALS,
  DISPLAY_ORDER,
  buildFullWeek,
  validateWeek,
  weekToPayload
} from '../utils/openingHours';

export default function OpeningHoursForm({ shop, onSaved }) {
  const [week, setWeek] = useState(() => buildFullWeek([], shop.openingHours));
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getOpeningHours(shop.id)
      .then((rows) => !cancelled && setWeek(buildFullWeek(rows, shop.openingHours)))
      .catch(() => !cancelled && setMessage({ type: 'error', text: 'โหลดเวลาปัจจุบันไม่ได้ แสดงค่าเริ่มต้นแทน' }))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [shop.id, shop.openingHours]);

  const updateDay = (day, patch) => {
    setWeek((prev) => prev.map((d) => (d.day_of_week === day ? { ...d, ...patch } : d)));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
    setMessage(null);
  };

  const mondayRow = week.find((d) => d.day_of_week === 1);

  // Quick Apply: ใช้เวลาของวันจันทร์กับทุกวัน (ตามสถานะเปิด/หยุดของวันจันทร์)
  const applyMondayToAll = () => {
    setWeek((prev) =>
      prev.map((d) => ({
        ...d,
        is_closed: mondayRow.is_closed,
        open_time: mondayRow.open_time,
        close_time: mondayRow.close_time
      }))
    );
    setErrors({});
    setMessage(null);
  };

  // Quick Apply: เปิดทุกวัน ด้วยเวลาของวันจันทร์
  const openEveryDay = () => {
    setWeek((prev) =>
      prev.map((d) => ({ ...d, is_closed: false, open_time: mondayRow.open_time, close_time: mondayRow.close_time }))
    );
    setErrors({});
    setMessage(null);
  };

  const handleSave = async () => {
    const found = validateWeek(week);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage({ type: 'error', text: 'กรุณาแก้เวลาที่ไม่ถูกต้องก่อนบันทึก' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const res = await saveOpeningHours(shop.id, weekToPayload(week));
      setWeek(buildFullWeek(res.data, shop.openingHours));
      setMessage({ type: 'success', text: 'บันทึกเวลาเปิด-ปิดร้านเรียบร้อยแล้ว' });
      if (onSaved) onSaved(res.message);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const openDays = week.filter((d) => !d.is_closed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <CalendarClock className="w-4 h-4 text-orange-600" />
          ตารางเวลาประจำสัปดาห์
        </h4>
        <span className="text-xs text-slate-400">{openDays} วันทำการ</span>
      </div>

      {/* Quick Apply (เทมเพลตด่วน) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 tracking-wide">เทมเพลตด่วน (QUICK APPLY)</span>
          <button
            type="button"
            onClick={applyMondayToAll}
            disabled={isLoading}
            className="text-[11px] font-bold text-orange-800 hover:text-orange-900 disabled:opacity-50"
          >
            ใช้เวลาเดียวกันทุกวัน
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openEveryDay}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-orange-300 disabled:opacity-50"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            เปิดทุกวัน ({mondayRow.open_time} - {mondayRow.close_time})
          </button>
        </div>
      </div>

      {/* การ์ดรายวัน */}
      <ul className="space-y-2.5">
        {DISPLAY_ORDER.map((day) => {
          const d = week.find((x) => x.day_of_week === day);
          const inputId = `hours-${day}`;
          const hasError = !!errors[day];
          return (
            <li key={day} className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      d.is_closed ? 'bg-indigo-50 text-slate-700' : 'bg-orange-100 text-orange-900'
                    }`}
                  >
                    {DAY_INITIALS[day]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-1.5 flex-wrap">
                      {DAY_NAMES[day]}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          d.is_closed ? 'bg-rose-100 text-rose-700' : 'bg-emerald-200 text-emerald-900'
                        }`}
                      >
                        {d.is_closed ? 'ปิดทำการ' : 'เปิดปกติ'}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">{DAY_NAMES_EN[day]}</p>
                  </div>
                </div>

                {/* สวิตช์ เปิด/หยุด */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={!d.is_closed}
                  aria-label={`${DAY_NAMES[day]} ${d.is_closed ? 'ร้านหยุด' : 'ร้านเปิด'}`}
                  onClick={() => updateDay(day, { is_closed: !d.is_closed })}
                  disabled={isLoading}
                  className={`relative w-12 h-7 rounded-full transition flex-shrink-0 ${
                    d.is_closed ? 'bg-indigo-100' : 'bg-emerald-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                      d.is_closed ? '' : 'translate-x-5'
                    }`}
                  />
                </button>
              </div>

              {!d.is_closed && (
                <div className="mt-3 flex items-center gap-2">
                  <label htmlFor={`${inputId}-open`} className="flex-1 block px-3 py-2 rounded-xl bg-indigo-50/60">
                    <span className="block text-[11px] font-bold text-slate-600">เวลาเปิด</span>
                    <input
                      id={`${inputId}-open`}
                      type="time"
                      value={d.open_time}
                      onChange={(e) => updateDay(day, { open_time: e.target.value })}
                      className={`w-full mt-0.5 bg-transparent text-lg font-bold text-slate-900 focus:outline-none ${
                        hasError ? 'text-rose-600' : ''
                      }`}
                    />
                  </label>
                  <span className="text-sm font-bold text-slate-600">ถึง</span>
                  <label htmlFor={`${inputId}-close`} className="flex-1 block px-3 py-2 rounded-xl bg-indigo-50/60">
                    <span className="block text-[11px] font-bold text-slate-600">เวลาปิด</span>
                    <input
                      id={`${inputId}-close`}
                      type="time"
                      value={d.close_time}
                      onChange={(e) => updateDay(day, { close_time: e.target.value })}
                      className={`w-full mt-0.5 bg-transparent text-lg font-bold text-slate-900 focus:outline-none ${
                        hasError ? 'text-rose-600' : ''
                      }`}
                    />
                  </label>
                </div>
              )}
              {hasError && <p className="mt-1.5 text-[11px] text-rose-600 font-medium">{errors[day]}</p>}
            </li>
          );
        })}
      </ul>

      {message && (
        <div
          role="status"
          className={`p-2.5 rounded-2xl text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isLoading || isSaving}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition active:scale-95"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {isSaving ? 'กำลังบันทึก...' : 'บันทึกเวลาเปิด-ปิด'}
      </button>
    </div>
  );
}

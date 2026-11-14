// client/src/components/OpeningHoursForm.jsx
// U13 / Task49: ฟอร์มตั้งเวลาเปิด/ปิดร้านรายวันใน Dashboard ของแม่ค้า

import React, { useState, useEffect } from 'react';
import { CalendarClock, Copy, Save, Loader2 } from 'lucide-react';
import { getOpeningHours, saveOpeningHours } from '../services/api';
import {
  DAY_NAMES,
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

  // คัดลอกเวลาของวันจันทร์ไปทุกวันที่เปิด
  const copyMondayToAll = () => {
    const monday = week.find((d) => d.day_of_week === 1);
    setWeek((prev) =>
      prev.map((d) => ({
        ...d,
        is_closed: monday.is_closed,
        open_time: monday.open_time,
        close_time: monday.close_time
      }))
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <CalendarClock className="w-4 h-4 text-orange-500" />
          ตั้งเวลาเปิด-ปิดร้านรายวัน
        </h4>
        <button
          type="button"
          onClick={copyMondayToAll}
          disabled={isLoading}
          className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 disabled:opacity-50"
        >
          <Copy className="w-3 h-3" /> ใช้เวลาวันจันทร์ทุกวัน
        </button>
      </div>

      <ul className="space-y-2">
        {DISPLAY_ORDER.map((day) => {
          const d = week.find((x) => x.day_of_week === day);
          const inputId = `hours-${day}`;
          return (
            <li key={day} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {/* สวิตช์ เปิด/หยุด */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!d.is_closed}
                    aria-label={`${DAY_NAMES[day]} ${d.is_closed ? 'ร้านหยุด' : 'ร้านเปิด'}`}
                    onClick={() => updateDay(day, { is_closed: !d.is_closed })}
                    disabled={isLoading}
                    className={`relative w-11 h-6 rounded-full transition flex-shrink-0 ${
                      d.is_closed ? 'bg-slate-300' : 'bg-emerald-500'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        d.is_closed ? '' : 'translate-x-5'
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-none">{DAY_NAMES[day]}</p>
                    <p className={`text-[11px] mt-1 ${d.is_closed ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {d.is_closed ? 'ปิดทำการทั้งวัน' : 'เปิดทำการ'}
                    </p>
                  </div>
                </div>

                {!d.is_closed && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <label htmlFor={`${inputId}-open`} className="sr-only">เวลาเปิด {DAY_NAMES[day]}</label>
                    <input
                      id={`${inputId}-open`}
                      type="time"
                      value={d.open_time}
                      onChange={(e) => updateDay(day, { open_time: e.target.value })}
                      className={`px-2 py-1.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 ${
                        errors[day] ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                    <span>ถึง</span>
                    <label htmlFor={`${inputId}-close`} className="sr-only">เวลาปิด {DAY_NAMES[day]}</label>
                    <input
                      id={`${inputId}-close`}
                      type="time"
                      value={d.close_time}
                      onChange={(e) => updateDay(day, { close_time: e.target.value })}
                      className={`px-2 py-1.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 ${
                        errors[day] ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                  </div>
                )}
              </div>
              {errors[day] && <p className="mt-1.5 text-[11px] text-rose-600 font-medium">{errors[day]}</p>}
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

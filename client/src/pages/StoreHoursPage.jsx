// client/src/pages/StoreHoursPage.jsx
// ตั้งเวลาเปิดปิดร้านอาหาร (Store Hours Schedule) — U13 ใช้ API /opening-hours เดิม
// วันหยุดพิเศษยังไม่มี API ฝั่ง server จึงเก็บไว้ในเครื่อง (localStorage) และแจ้งให้ผู้ใช้ทราบ

import React, { useEffect, useMemo, useState } from 'react';
import {
  Store, Clock, CalendarDays, CalendarX2, Plus, Trash2, Copy, Save, RotateCcw, Infinity as InfinityIcon, Sun, Moon,
  CheckCircle2, Loader2, Lightbulb, ChevronRight, AlertCircle,
} from 'lucide-react';
import { Toggle, Spinner } from '../components/ui/Primitives';
import useLocalState from '../hooks/useLocalList';
import { getOpeningHours, saveOpeningHours } from '../services/api';
import {
  DAY_NAMES, DAY_NAMES_EN, DISPLAY_ORDER, buildFullWeek, validateWeek, weekToPayload,
} from '../utils/openingHours';
import { getShopImage } from '../utils/shopDisplay';

const DAY_COLORS = ['bg-danger-soft text-danger', 'bg-[#fff3c4] text-[#8a6d00]', 'bg-[#ffe1ef] text-[#a3245f]', 'bg-ok-soft/60 text-ok', 'bg-brand-peach text-brand', 'bg-[#dbeafe] text-[#1d4ed8]', 'bg-[#ede4ff] text-[#6d28d9]'];

const PRESETS = [
  { label: 'เปิดทุกวัน (10:00 - 21:00)', Icon: InfinityIcon, apply: (w) => w.map((d) => ({ ...d, is_closed: false, open_time: '10:00', close_time: '21:00' })) },
  { label: 'จันทร์-ศุกร์ (07:00 - 15:30)', Icon: Sun, apply: (w) => w.map((d) => ({ ...d, is_closed: d.day_of_week === 0 || d.day_of_week === 6, open_time: '07:00', close_time: '15:30' })) },
  { label: 'รอบเย็น (16:00 - 22:00)', Icon: Moon, apply: (w) => w.map((d) => ({ ...d, is_closed: false, open_time: '16:00', close_time: '22:00' })) },
];

const sameWeek = (a, b) => JSON.stringify(weekToPayload(a)) === JSON.stringify(weekToPayload(b));

export default function StoreHoursPage({ shop, showToast }) {
  const [saved, setSaved] = useState(null);
  const [week, setWeek] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [holidays, setHolidays] = useLocalState(`hiwkhaw_holidays_${shop?.id || 'none'}`, []);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });
  const [showHolidayForm, setShowHolidayForm] = useState(false);

  useEffect(() => {
    if (!shop?.id) return;
    let cancelled = false;
    setWeek(null);
    setLoadError('');
    getOpeningHours(shop.id)
      .then((rows) => {
        if (cancelled) return;
        const full = buildFullWeek(rows, shop.openingHours);
        setSaved(full);
        setWeek(full);
      })
      .catch((err) => !cancelled && setLoadError(err.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  const errors = useMemo(() => (week ? validateWeek(week) : {}), [week]);
  const dirty = week && saved && !sameWeek(week, saved);
  const today = new Date().getDay();
  const todayRow = week?.find((d) => d.day_of_week === today);

  if (!shop) return <p className="py-24 text-center text-sm text-ink-muted">ไม่พบข้อมูลร้าน</p>;

  const update = (day, patch) => setWeek((w) => w.map((d) => (d.day_of_week === day ? { ...d, ...patch } : d)));

  const copyToAll = () => {
    const src = week.find((d) => d.day_of_week === 1) || week[0];
    setWeek((w) => w.map((d) => ({ ...d, open_time: src.open_time, close_time: src.close_time, is_closed: src.is_closed })));
    showToast('คัดลอกเวลาของวันจันทร์ไปทุกวันแล้ว (ยังไม่บันทึก)', 'info');
  };

  const save = async () => {
    if (Object.keys(errors).length) {
      showToast('มีเวลาที่ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await saveOpeningHours(shop.id, weekToPayload(week));
      const full = buildFullWeek(res.data, shop.openingHours);
      setSaved(full);
      setWeek(full);
      showToast(res.message || 'บันทึกเวลาเปิด-ปิดเรียบร้อยแล้ว', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addHoliday = (e) => {
    e.preventDefault();
    if (!newHoliday.date || !newHoliday.name.trim()) return;
    setHolidays((prev) => [...prev, { id: `h-${Date.now()}`, date: newHoliday.date, name: newHoliday.name.trim() }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewHoliday({ date: '', name: '' });
    setShowHolidayForm(false);
  };

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 pb-20 lg:pb-0">
      <div className="space-y-3">
        <nav className="hidden items-center gap-1 text-[11px] text-ink-muted lg:flex">
          การจัดการร้าน <ChevronRight className="size-3" /> <span className="font-semibold text-brand">เวลาเปิด-ปิด & ตารางรายสัปดาห์</span>
        </nav>
        <h1 className="font-display text-xl font-bold text-ink lg:text-2xl">ตั้งเวลาเปิด-ปิดร้านอาหาร มธ. ศูนย์รังสิต เพื่อแจ้งนักศึกษาแบบ Real-time</h1>
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2 text-[11px] shadow-card">
          <span className="px-1 text-ink-muted">เทมเพลตด่วน:</span>
          {PRESETS.map(({ label, Icon, apply }) => (
            <button
              key={label}
              type="button"
              disabled={!week}
              onClick={() => setWeek((w) => apply(w))}
              className="flex items-center gap-1 rounded-md bg-surface-low px-2.5 py-1 text-ink hover:bg-surface-mid"
            >
              <Icon className="size-3.5 text-brand" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Today summary */}
      <section className="relative overflow-hidden rounded-xl bg-white p-5 shadow-card">
        <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-ok-soft/30" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className={`flex size-12 items-center justify-center rounded-xl ${shop.isOpen ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'}`}>
              <Store className="size-6" />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <span className={`size-2 rounded-full ${shop.isOpen ? 'bg-ok' : 'bg-danger'}`} /> มุมมองลูกค้าขณะนี้
              </p>
              <p className={`font-display text-lg font-bold ${shop.isOpen ? 'text-ok' : 'text-danger'}`}>
                {shop.isOpen ? 'กำลังเปิดให้บริการ' : 'ปิดให้บริการอยู่'}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-surface-low p-3 text-xs sm:min-w-72">
            <p className="flex justify-between gap-3 text-ink-muted">
              รอบเปิดวันนี้ ({DAY_NAMES[today]}):
              <span className="font-semibold text-brand">
                {todayRow ? (todayRow.is_closed ? 'ปิดทำการ' : `${todayRow.open_time} - ${todayRow.close_time} น.`) : '...'}
              </span>
            </p>
            <p className="mt-1 flex items-center gap-1 text-ink-muted">
              <CheckCircle2 className="size-3.5 text-ok" /> สถานะเปิด/ปิดจริงสลับได้ที่แดชบอร์ดร้าน
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Weekly schedule */}
        <section className="space-y-4 rounded-xl bg-white p-4 shadow-card sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <CalendarDays className="size-5 text-brand" /> ตารางเวลาประจำวัน (จันทร์-อาทิตย์)
              </h2>
              <p className="text-xs text-ink-muted">{shop.canteenName} {shop.boothNumber}</p>
            </div>
            <button type="button" onClick={copyToAll} disabled={!week} className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
              <Copy className="size-3.5" /> คัดลอกเวลาวันจันทร์ไปทุกวัน
            </button>
          </div>

          {loadError ? (
            <p className="flex items-center gap-2 rounded-lg bg-danger-soft/50 p-3 text-sm text-danger"><AlertCircle className="size-4" /> {loadError}</p>
          ) : !week ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <ul className="space-y-2">
              {DISPLAY_ORDER.map((day, idx) => {
                const d = week.find((x) => x.day_of_week === day);
                const err = errors[day];
                return (
                  <li key={day} className={`rounded-xl p-3 sm:p-4 ${d.is_closed ? 'bg-surface-low' : 'border border-surface-mid'} ${err ? 'ring-2 ring-danger/40' : ''}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${DAY_COLORS[day]}`}>
                        {DAY_NAMES[day].slice(0, 1)}
                      </span>
                      <div className="min-w-24 flex-1 sm:flex-none">
                        <p className="font-display text-base font-semibold text-ink">
                          วัน{DAY_NAMES[day]}
                          {(day === 0 || day === 6) && <span className="ml-1.5 rounded bg-brand-peach px-1.5 py-0.5 text-[10px] font-semibold text-brand">WEEKEND</span>}
                        </p>
                        <p className={`text-[11px] ${d.is_closed ? 'text-danger' : 'text-ok'}`}>
                          {d.is_closed ? 'ปิดทำการทั้งวัน' : 'เปิดปกติ'} • {DAY_NAMES_EN[idx]}
                        </p>
                      </div>
                      <div className="order-last flex w-full items-center gap-2 sm:order-none sm:w-auto sm:flex-1 sm:justify-center">
                        {d.is_closed ? (
                          <span className="text-xs text-ink-muted">ปิดรับออเดอร์หน้าร้าน (วันหยุดประจำสัปดาห์)</span>
                        ) : (
                          <div className="flex w-full items-center gap-2 rounded-lg bg-surface-low px-3 py-1.5 sm:w-auto">
                            <Clock className="size-4 shrink-0 text-ink-muted" />
                            <input
                              type="time"
                              aria-label={`เวลาเปิดวัน${DAY_NAMES[day]}`}
                              value={d.open_time}
                              onChange={(e) => update(day, { open_time: e.target.value })}
                              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none"
                            />
                            <span className="text-xs text-ink-muted">ถึง</span>
                            <input
                              type="time"
                              aria-label={`เวลาปิดวัน${DAY_NAMES[day]}`}
                              value={d.close_time}
                              onChange={(e) => update(day, { close_time: e.target.value })}
                              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-brand outline-none"
                            />
                          </div>
                        )}
                      </div>
                      <Toggle
                        checked={!d.is_closed}
                        onChange={(on) => update(day, { is_closed: !on })}
                        label={`เปิดร้านวัน${DAY_NAMES[day]}`}
                      />
                    </div>
                    {err && <p className="mt-2 text-xs text-danger">{err}</p>}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Desktop save bar */}
          <div className="hidden items-center justify-end gap-3 border-t border-surface-mid pt-4 lg:flex">
            {dirty && <span className="mr-auto text-xs text-brand">มีการเปลี่ยนแปลงที่ยังไม่บันทึก</span>}
            <button type="button" disabled={!dirty || saving} onClick={() => setWeek(saved)} className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-muted hover:bg-surface-low disabled:opacity-40">
              <RotateCcw className="size-4" /> รีเซ็ต
            </button>
            <button type="button" disabled={!dirty || saving} onClick={save} className="flex items-center gap-2 rounded-lg bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white shadow-card disabled:opacity-40">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} บันทึกการตั้งค่าเวลา
            </button>
          </div>
        </section>

        <div className="space-y-6">
          {/* Holidays */}
          <section className="space-y-3 rounded-xl bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <CalendarX2 className="size-5 text-danger" /> วันหยุดพิเศษล่วงหน้า
              </h2>
              <button
                type="button"
                onClick={() => setShowHolidayForm((v) => !v)}
                className="flex items-center gap-1 rounded-lg bg-brand-peach/60 px-2.5 py-1.5 text-[11px] font-semibold text-brand-deep"
              >
                <Plus className="size-3.5" /> เพิ่มวันหยุด
              </button>
            </div>
            <p className="text-xs text-ink-muted">บันทึกวันหยุดนักขัตฤกษ์หรือวันปิดปรับปรุงร้านไว้เตือนตัวเอง</p>

            {showHolidayForm && (
              <form onSubmit={addHoliday} className="space-y-2 rounded-lg bg-surface-low p-3">
                <input
                  type="date"
                  required
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday((h) => ({ ...h, date: e.target.value }))}
                  className="w-full rounded-md bg-white px-2 py-1.5 text-sm text-ink"
                />
                <input
                  required
                  maxLength={60}
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday((h) => ({ ...h, name: e.target.value }))}
                  placeholder="เช่น วันสงกรานต์, ปิดปรับปรุงร้าน"
                  className="w-full rounded-md bg-white px-2 py-1.5 text-sm text-ink"
                />
                <button type="submit" className="w-full rounded-md bg-brand py-1.5 text-xs font-semibold text-white">บันทึกวันหยุด</button>
              </form>
            )}

            {holidays.length === 0 ? (
              <p className="rounded-lg bg-surface-low p-3 text-center text-xs text-ink-muted">ยังไม่มีวันหยุดพิเศษ</p>
            ) : (
              <ul className="space-y-2">
                {holidays.map((h) => {
                  const dt = new Date(`${h.date}T00:00:00`);
                  return (
                    <li key={h.id} className="flex items-center gap-3 rounded-lg bg-surface-low p-3">
                      <span className="flex w-11 shrink-0 flex-col items-center rounded-md bg-white py-1 text-center shadow-card">
                        <span className="text-[10px] text-danger">{dt.toLocaleDateString('th-TH', { month: 'short' })}</span>
                        <span className="text-base font-bold text-ink">{dt.getDate()}</span>
                      </span>
                      <span className="min-w-0 flex-1 text-xs">
                        <span className="block truncate font-semibold text-ink">{h.name}</span>
                        <span className="text-danger">หยุดทำการหน้าร้าน 1 วัน</span>
                      </span>
                      <button
                        type="button"
                        aria-label={`ลบ ${h.name}`}
                        onClick={() => setHolidays((prev) => prev.filter((x) => x.id !== h.id))}
                        className="rounded p-1 text-ink-muted hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="flex gap-2 rounded-lg bg-ok-soft/30 p-3 text-[11px] text-ink">
              <Lightbulb className="size-4 shrink-0 text-ok" />
              วันหยุดพิเศษเก็บไว้ในเครื่องนี้เท่านั้น (ยังไม่แสดงให้ลูกค้า) — ในวันหยุดให้ปิดร้านที่แดชบอร์ดหรือปิดวันนั้นในตารางด้านซ้าย
            </p>
          </section>

          <section className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-card">
            <img src={getShopImage(shop)} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 text-xs">
              <p className="truncate font-semibold text-ink">{shop.name}</p>
              <p className="text-ink-muted">ตารางเวลานี้มีผลกับรอบสั่งอาหารของนักศึกษา อาจารย์ และบุคลากร มธ. รังสิต</p>
            </div>
          </section>
        </div>
      </div>

      {/* Mobile sticky save bar */}
      <div className="fixed inset-x-0 bottom-16 z-30 flex gap-2 bg-white/95 p-3 shadow-nav backdrop-blur lg:hidden">
        <button type="button" disabled={!dirty || saving} onClick={() => setWeek(saved)} className="rounded-xl bg-surface-high px-4 text-sm font-semibold text-ink disabled:opacity-40">
          รีเซ็ต
        </button>
        <button type="button" disabled={!dirty || saving} onClick={save} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-accent py-3 text-sm font-semibold text-white disabled:opacity-40">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} บันทึกการตั้งค่าเวลา
        </button>
      </div>
    </div>
  );
}

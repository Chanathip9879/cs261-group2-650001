// client/src/pages/MerchantDashboardPage.jsx
// แดชบอร์ดจัดการร้าน (Merchant Dashboard) — U5 เปิด/ปิดร้าน + แจ้งเมนูหมด

import React, { useEffect, useState } from 'react';
import {
  Store, Power, History, Archive, Contact, Phone, MapPin, Eye, Clock, ChevronRight, ShieldCheck, Star, UtensilsCrossed, Loader2,
} from 'lucide-react';
import { Toggle, LiveDot } from '../components/ui/Primitives';
import { updateMenuAvailability } from '../services/api';
import { getMenuImage, formatBaht, formatPhone, hoursText, timeAgo, canteenShort } from '../utils/shopDisplay';
import { routes } from '../router';

const NOTE_PRESETS_OPEN = ['เปิดให้บริการตามปกติ', 'กับข้าวร้อนๆ พร้อมเสิร์ฟ', 'คิวยาว รอประมาณ 10 นาที'];
const NOTE_PRESETS_CLOSED = ['วัตถุดิบหมด ปิดก่อนเวลา', 'หยุดพักชั่วคราว', 'ปิดทำการวันนี้'];

export default function MerchantDashboardPage({ shop, onSetStatus, statusBusy, onShopUpdated, showToast }) {
  const [note, setNote] = useState(shop?.statusNote || '');
  const [busyMenu, setBusyMenu] = useState(null);

  useEffect(() => setNote(shop?.statusNote || ''), [shop?.id, shop?.statusNote]);

  if (!shop) {
    return <p className="py-24 text-center text-sm text-ink-muted">ไม่พบข้อมูลร้านของบัญชีนี้</p>;
  }

  const menus = shop.menus || [];
  const ready = menus.filter((m) => m.isAvailable).length;
  const out = menus.length - ready;
  const presets = shop.isOpen ? NOTE_PRESETS_OPEN : NOTE_PRESETS_CLOSED;

  const toggleMenu = async (menu) => {
    setBusyMenu(menu.id);
    try {
      const res = await updateMenuAvailability(shop.id, menu.id, !menu.isAvailable);
      onShopUpdated(res.data);
      showToast(res.message, menu.isAvailable ? 'info' : 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusyMenu(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      {/* Shop header card */}
      <section className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-card lg:p-6">
        <span className="hidden size-14 shrink-0 items-center justify-center rounded-xl bg-brand-peach text-brand sm:flex">
          <Store className="size-7" />
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-ok-soft/50 px-2 py-0.5 text-[11px] font-semibold text-ok">
              <ShieldCheck className="size-3.5" /> เข้าสู่ระบบปลอดภัย
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-ok">
              <LiveDot /> ระบบเชื่อมต่อเรียลไทม์
            </span>
          </div>
          <h1 className="font-display text-xl font-bold text-ink lg:text-2xl">{shop.name}</h1>
          <p className="text-xs text-ink-muted">
            แดชบอร์ดผู้ดูแลร้าน • {canteenShort(shop)} {shop.boothNumber} มธ. ศูนย์รังสิต
          </p>
        </div>
      </section>

      {/* Status card */}
      <section
        className={`relative overflow-hidden rounded-xl p-5 shadow-card lg:p-7 ${
          shop.isOpen ? 'bg-gradient-to-r from-surface-low via-white to-[#fff7f0]' : 'bg-gradient-to-r from-danger-soft/50 via-white to-white'
        }`}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={`hidden size-12 shrink-0 items-center justify-center rounded-full sm:flex ${
                shop.isOpen ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'
              }`}
            >
              <Power className="size-6" />
            </span>
            <div className="space-y-1">
              <h2 className="flex flex-wrap items-center gap-2 font-display text-lg font-bold text-ink lg:text-xl">
                <LiveDot open={shop.isOpen} className="sm:hidden" />
                สถานะ: {shop.isOpen ? 'เปิดให้บริการ (รับออเดอร์)' : 'ปิดร้านชั่วคราว'}
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold text-white ${shop.isOpen ? 'bg-ok' : 'bg-danger'}`}>
                  {shop.isOpen ? 'ONLINE' : 'OFFLINE'}
                </span>
              </h2>
              <p className="text-sm text-ink-muted">สลับเพื่อปิดร้านชั่วคราวทันทีหากออเดอร์ในครัวแน่นเกินไป หรือวัตถุดิบหมดก่อนกำหนด</p>
              <p className="flex items-center gap-1 text-[11px] text-ink-muted">
                <History className="size-3.5" /> อัปเดตสถานะล่าสุด: <strong className="text-ink">{timeAgo(shop.lastStatusUpdate)}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-white/80 p-3 shadow-card lg:justify-start">
            <span className="text-xs">
              <span className="block font-semibold text-ink">{shop.isOpen ? 'รับออเดอร์ปกติ' : 'ปิดรับออเดอร์'}</span>
              <span className="text-ink-muted">คลิกเพื่อสลับ</span>
            </span>
            <Toggle checked={shop.isOpen} onChange={(next) => onSetStatus(next, note)} disabled={statusBusy} size="lg" label="เปิด/ปิดร้าน" />
          </div>
        </div>

        <div className="mt-5 space-y-2 border-t border-surface-mid pt-4">
          <label htmlFor="status-note" className="text-xs font-semibold text-ink">ข้อความแจ้งลูกค้าหน้าร้าน (Status Note)</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="status-note"
              value={note}
              maxLength={80}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น วัตถุดิบหมด ปิดก่อนเวลา, เปิดปกติ กับข้าวร้อนๆ"
              className="h-11 flex-1 rounded-lg bg-white px-3 text-sm text-ink shadow-card outline-none focus:ring-2 focus:ring-brand-accent/40"
            />
            <button
              type="button"
              disabled={statusBusy || note === (shop.statusNote || '')}
              onClick={() => onSetStatus(shop.isOpen, note)}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-ink-navy px-4 text-xs font-semibold text-white disabled:opacity-40"
            >
              {statusBusy && <Loader2 className="size-3.5 animate-spin" />} บันทึกข้อความ
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button key={p} type="button" onClick={() => setNote(p)} className="rounded-full bg-white px-2.5 py-1 text-[11px] text-ink-muted shadow-card hover:text-brand">
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile stat cards */}
      <section className="grid grid-cols-2 gap-3 lg:hidden">
        <div className="rounded-xl bg-white p-4 shadow-card">
          <p className="flex items-center justify-between text-xs font-semibold text-ink">เมนูพร้อมขาย <UtensilsCrossed className="size-4 text-ok" /></p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{ready}/{menus.length}</p>
          <p className="text-[11px] text-ink-muted">รายการ</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-card">
          <p className="flex items-center justify-between text-xs font-semibold text-ink">เรตติ้งนักศึกษา <Star className="size-4 fill-brand-accent text-brand-accent" /></p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{Number(shop.rating).toFixed(1)}</p>
          <p className="text-[11px] text-ink-muted">({shop.reviewCount} รีวิว)</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Menu stock */}
        <section id="menu-stock" className="scroll-mt-24 space-y-4 rounded-xl bg-white p-5 shadow-card lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink lg:text-xl">
                <Archive className="size-5 text-brand" /> แจ้งเมนูหมดทันที
              </h2>
              <p className="text-xs text-ink-muted">สลับสถานะเมนูใน 1 แตะ ให้นักศึกษาเห็นสถานะทันที ป้องกันการเดินมาเก้อ</p>
            </div>
            <div className="flex gap-2 text-[11px]">
              <span className="flex items-center gap-1 rounded-lg bg-surface-mid px-2.5 py-1.5 text-ink">
                <span className="size-2 rounded-full bg-ok" /> พร้อมขาย {ready}
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-surface-mid px-2.5 py-1.5 text-ink">
                <span className="size-2 rounded-full bg-danger" /> หมดแล้ว {out}
              </span>
            </div>
          </div>

          <ul className="space-y-3">
            {menus.map((m, i) => {
              const soldOut = !m.isAvailable;
              const busy = busyMenu === m.id;
              return (
                <li
                  key={m.id}
                  className={`flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:p-4 ${soldOut ? 'bg-danger-soft/30' : 'bg-surface-low'}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <img
                      src={getMenuImage(shop, i)}
                      alt=""
                      className={`size-14 shrink-0 rounded-lg object-cover sm:size-16 ${soldOut ? 'grayscale' : ''}`}
                    />
                    <div className="min-w-0">
                      <p className={`truncate font-display text-base font-semibold ${soldOut ? 'text-ink-muted line-through' : 'text-ink'}`}>{m.name}</p>
                      <p className={`flex items-center gap-1 text-[11px] ${soldOut ? 'text-danger' : 'text-ok'}`}>
                        <span className={`size-1.5 rounded-full ${soldOut ? 'bg-danger' : 'bg-ok'}`} />
                        {soldOut ? 'สินค้าหมดแล้ว' : 'พร้อมขายปกติ'}
                      </p>
                      <p className={`text-sm font-semibold ${soldOut ? 'text-ink-muted' : 'text-brand'}`}>{formatBaht(m.price)}.00</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleMenu(m)}
                    className={`flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition disabled:opacity-60 ${
                      soldOut ? 'bg-brand-accent text-white shadow-card' : 'bg-surface-high text-ink hover:bg-danger hover:text-white'
                    }`}
                  >
                    {busy && <Loader2 className="size-3.5 animate-spin" />}
                    {soldOut ? 'เปิดรับสต็อกใหม่' : 'กดแจ้งหมด'}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-[11px] text-ink-muted">* รายการที่กดแจ้งหมดจะแสดงป้าย “หมด” บนหน้าร้านฝั่งลูกค้าทันที</p>
        </section>

        <div className="space-y-6">
          {/* Hours shortcut */}
          <section className="space-y-3 rounded-xl bg-white p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-peach text-brand">
                <Clock className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-ink">ตั้งเวลาเปิด/ปิดรายวัน</h2>
                <p className="text-xs text-ink-muted">กำหนดตารางเวลาให้นักศึกษาเห็นล่วงหน้า</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-lg bg-surface-mid px-2.5 py-1 text-[11px] text-ink">ปัจจุบัน: {hoursText(shop)}</span>
              <a href={`#${routes.merchantHours}`} className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white">
                แก้เวลา <ChevronRight className="size-3.5" />
              </a>
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-3 rounded-xl bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink lg:text-lg">
              <Contact className="size-5 text-brand" /> ข้อมูลการติดต่อและพิกัด
            </h2>
            <div className="flex items-start gap-3 rounded-lg bg-surface-low p-3">
              <Phone className="mt-0.5 size-4 text-ink" />
              <div>
                <p className="text-[11px] text-ink-muted">เบอร์โทรศัพท์ร้าน</p>
                <p className="text-base font-semibold text-ink">{formatPhone(shop.phone)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-surface-low p-3">
              <MapPin className="mt-0.5 size-4 text-ink" />
              <div>
                <p className="text-[11px] text-ink-muted">พิกัดร้าน</p>
                <p className="text-sm text-ink">{shop.canteenName} {shop.boothNumber}</p>
                <p className="text-xs text-ink-muted">{shop.locationDetails}</p>
              </div>
            </div>
            <a
              href={`#${routes.shop(shop.id)}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-accent py-2.5 text-sm font-semibold text-white shadow-card"
            >
              <Eye className="size-4" /> ดูหน้าร้านแบบที่ลูกค้าเห็น
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}

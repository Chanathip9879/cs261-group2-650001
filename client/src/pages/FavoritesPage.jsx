// client/src/pages/FavoritesPage.jsx
// ร้านอาหารโปรด (Bookmarks) — US14 เก็บร้านโปรดใน localStorage

import React, { useMemo, useState } from 'react';
import {
  Bookmark, BellRing, AlertTriangle, CheckCircle2, Clock, Info, Phone, Map, Ban, MapPin, Star, HeartHandshake, ArrowRight, Store,
} from 'lucide-react';
import { HeartButton, LiveDot, Spinner } from '../components/ui/Primitives';
import {
  getShopImage, soldOutMenus, parseHours, canteenShort, locationText, menuSummary, priceRange, telHref,
} from '../utils/shopDisplay';
import { navigate, routes } from '../router';

export default function FavoritesPage({ allShops, loading, bookmarkedIds, onToggleBookmark }) {
  const [tab, setTab] = useState('all');

  const saved = useMemo(
    () => bookmarkedIds.map((id) => allShops.find((s) => s.id === id)).filter(Boolean),
    [bookmarkedIds, allShops]
  );
  const openCount = saved.filter((s) => s.isOpen).length;
  const best = saved.reduce((m, s) => Math.max(m, Number(s.rating) || 0), 0);

  const list = useMemo(() => {
    if (tab === 'open') return saved.filter((s) => s.isOpen);
    if (tab === 'top') return [...saved].sort((a, b) => b.rating - a.rating);
    return saved;
  }, [saved, tab]);

  const tabBtn = (id, label) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      aria-pressed={tab === id}
      className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
        tab === id ? 'bg-brand-accent text-white shadow-card' : 'bg-surface-mid text-ink hover:bg-surface-high'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 px-4 pb-28 pt-4 lg:space-y-8 lg:px-8 lg:pb-12 lg:pt-8">
      <div>
        <nav className="mb-3 hidden text-xs text-ink-muted lg:block">
          <a href="#/" className="hover:text-brand">หน้าแรก</a> / <span className="font-semibold text-ink">ร้านอาหารโปรด</span>
        </nav>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink lg:text-3xl">
          <Bookmark className="size-6 fill-brand text-brand" /> ร้านอาหารโปรด
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          คอลเลกชันความอร่อยที่คุณเลือกไว้ <span className="font-semibold text-brand">{saved.length} ร้านที่บันทึกไว้</span>
        </p>
      </div>

      {loading && saved.length === 0 && bookmarkedIds.length > 0 ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : saved.length === 0 ? (
        <EmptyFavorites />
      ) : (
        <>
          {/* Status summary panel */}
          <section className="rounded-xl border border-surface-high bg-white p-4 shadow-card lg:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-mid pb-3">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-accent text-white">
                  <BellRing className="size-4" />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold text-ink lg:text-lg">
                    สถานะเปิด-ปิดร้านโปรดของคุณใน มธ. รังสิต วันนี้
                  </h2>
                  <p className="text-xs text-ink-muted">อัปเดตสถานะครัว เมนูหมด และความพร้อมให้บริการแบบเรียลไทม์</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-ok-soft/40 px-3 py-1 text-[11px] font-semibold text-ok">
                <LiveDot /> เชื่อมต่อระบบครัวสด
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {saved.map((s) => (
                <StatusRow key={s.id} shop={s} />
              ))}
            </div>
          </section>

          {/* Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
              {tabBtn('all', `ทั้งหมด (${saved.length})`)}
              {tabBtn('open', `เปิดอยู่ตอนนี้ (${openCount})`)}
              {tabBtn('top', `คะแนนสูงสุด (${best.toFixed(1)} ดาว)`)}
            </div>
            <p className="flex items-center gap-3 text-xs text-ink-muted">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-ok" /> {openCount} ร้านเปิดบริการ</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-danger" /> {saved.length - openCount} ร้านปิดบริการ</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {list.map((s) => (
              <FavoriteCard key={s.id} shop={s} onRemove={() => onToggleBookmark(s)} />
            ))}
            <a
              href="#/"
              className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-danger-soft p-6 text-center hover:bg-white"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-white shadow-card">
                <HeartHandshake className="size-5 text-brand" />
              </span>
              <p className="font-display text-base font-bold text-ink">ค้นหาร้านโปรดเพิ่ม</p>
              <p className="text-xs text-ink-muted">กดหัวใจที่หน้าร้านโปรด เพื่อเพิ่มไว้ในคลังส่วนตัว</p>
              <span className="flex items-center gap-1 text-xs font-semibold text-brand">
                สำรวจร้านเด็ดรอบรั้ว มธ. รังสิต <ArrowRight className="size-3.5" />
              </span>
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function StatusRow({ shop }) {
  const soldOut = soldOutMenus(shop);
  const h = parseHours(shop.openingHours);
  const border = !shop.isOpen ? 'border-danger' : soldOut.length ? 'border-brand-accent' : 'border-ok';
  return (
    <button
      type="button"
      onClick={() => navigate(routes.shop(shop.id))}
      className={`space-y-1.5 rounded-lg border-l-4 bg-surface-low p-3 text-left transition hover:bg-surface-mid ${border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <LiveDot open={shop.isOpen} /> {shop.isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'} • {shop.name}
        </p>
        <span className="shrink-0 rounded bg-white px-1.5 text-[10px] text-ink-muted">โซน {canteenShort(shop)}</span>
      </div>
      <p className={`flex items-center gap-1.5 text-xs ${!shop.isOpen ? 'text-ink-muted' : soldOut.length ? 'text-danger' : 'text-ok'}`}>
        {!shop.isOpen ? <Info className="size-3.5" /> : soldOut.length ? <AlertTriangle className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
        {!shop.isOpen
          ? shop.statusNote || 'ปิดให้บริการวันนี้'
          : soldOut.length
          ? `แจ้งเตือน: ${soldOut.map((m) => m.name).join(', ')} หมดแล้ว`
          : `เมนูพร้อมเสิร์ฟ: ${shop.statusNote || 'ครบทุกเมนู'}`}
      </p>
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" /> {h ? (shop.isOpen ? `ปิด ${h.close}` : `เปิดรอบถัดไป ${h.open}`) : shop.openingHours}
        </span>
        <span className={`font-semibold ${shop.isOpen ? 'text-ok' : 'text-ink'}`}>{shop.isOpen ? 'เปิดบริการ' : 'ปิดบริการ'}</span>
      </div>
    </button>
  );
}

function FavoriteCard({ shop, onRemove }) {
  const soldOut = soldOutMenus(shop);
  const h = parseHours(shop.openingHours);
  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white shadow-card">
      <div className="relative h-44">
        <img src={getShopImage(shop)} alt={shop.name} loading="lazy" className={`size-full object-cover ${shop.isOpen ? '' : 'grayscale-[50%]'}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span
          className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            shop.isOpen ? 'bg-white/90 text-ok' : 'bg-danger-soft text-danger-deep'
          }`}
        >
          <LiveDot open={shop.isOpen} />
          {shop.isOpen ? `เปิดอยู่${h ? ` • ปิด ${h.close}` : ''}` : `ปิดแล้ว${h ? ` • เปิด ${h.open}` : ''}`}
        </span>
        <HeartButton active onClick={onRemove} className="absolute right-3 top-3 [&_svg]:fill-brand-accent [&_svg]:text-brand-accent" />
        <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] text-white">
          <MapPin className="size-3.5" /> {locationText(shop)}
        </span>
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink">
          <Star className="size-3 fill-brand-accent text-brand-accent" /> {Number(shop.rating).toFixed(1)}
          <span className="font-normal text-ink-muted">({shop.reviewCount})</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-ink">{shop.name}</h3>
          <span className="shrink-0 rounded bg-surface-low px-1.5 py-0.5 text-[10px] text-ink-muted">โซน {canteenShort(shop)}</span>
        </div>
        {!shop.isOpen ? (
          <p className="flex items-center gap-1.5 rounded-lg border border-surface-high bg-surface-low px-2.5 py-1.5 text-xs text-ink-muted">
            <Ban className="size-3.5" /> {shop.statusNote || 'ปิดให้บริการวันนี้'}
          </p>
        ) : soldOut.length ? (
          <p className="flex items-center gap-1.5 rounded-lg border border-danger-soft bg-danger-soft/30 px-2.5 py-1.5 text-xs text-danger">
            <AlertTriangle className="size-3.5 shrink-0" /> <span className="truncate">{soldOut.map((m) => m.name).join(', ')} หมดแล้ว</span>
          </p>
        ) : (
          <p className="flex items-center gap-1.5 rounded-lg border border-surface-high bg-surface-low px-2.5 py-1.5 text-xs text-ok">
            <CheckCircle2 className="size-3.5" /> เมนูพร้อมเสิร์ฟครบ
          </p>
        )}
        <p className="truncate text-sm text-ink-muted">{menuSummary(shop)}</p>
        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Store className="size-3.5" /> {canteenShort(shop)} มธ. รังสิต • ฿ ({priceRange(shop)})
        </p>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <a href={telHref(shop.phone)} className="flex items-center justify-center gap-1.5 rounded-lg bg-surface-low py-2.5 text-xs font-semibold text-ink hover:bg-surface-mid">
            <Phone className="size-4 text-brand" /> โทรสอบถามร้าน
          </a>
          <button
            type="button"
            onClick={() => navigate(routes.shop(shop.id))}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold ${
              shop.isOpen ? 'bg-brand-accent text-white' : 'bg-surface-mid text-ink'
            }`}
          >
            <Map className="size-4" /> ดูรายละเอียด & พิกัด
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyFavorites() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-xl bg-white p-10 text-center shadow-card">
      <span className="flex size-16 items-center justify-center rounded-full bg-brand-peach">
        <HeartHandshake className="size-7 text-brand" />
      </span>
      <h2 className="font-display text-xl font-bold text-ink">ยังไม่มีร้านโปรด</h2>
      <p className="max-w-sm text-sm text-ink-muted">กดหัวใจบนการ์ดร้านอาหารเพื่อบันทึกไว้ แล้วกลับมาเช็กสถานะเปิด-ปิดได้ทันที</p>
      <a href="#/" className="mt-2 rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white">สำรวจร้านอาหาร</a>
    </section>
  );
}

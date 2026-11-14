// client/src/components/RestaurantCard.jsx
// การ์ดร้านอาหาร (หน้าแรก / ผลการค้นหาไม่พบ) ตามดีไซน์ Restaurant Card ใน Figma

import React from 'react';
import { MapPin, Clock, XCircle, AlertTriangle, CheckCircle2, CalendarX, UtensilsCrossed, Info } from 'lucide-react';
import { StatusPill, RatingBadge, HeartButton } from './ui/Primitives';
import { getShopImage, closingText, soldOutMenus, locationText, priceLevel, menuSummary } from '../utils/shopDisplay';
import { navigate, routes } from '../router';

export default function RestaurantCard({ shop, isBookmarked, onToggleBookmark }) {
  const soldOut = soldOutMenus(shop);
  const price = priceLevel(shop);
  const open = shop.isOpen;
  const go = () => navigate(routes.shop(shop.id));

  let badge;
  let note;
  if (!open) {
    badge = <span className="rounded-full bg-surface-mid px-2 py-0.5 text-[11px] font-semibold text-ink-muted">ปิดบริการ</span>;
    note = (
      <div className="flex items-center gap-1.5 rounded-lg bg-surface-mid px-2.5 py-1 text-xs text-ink-muted">
        <CalendarX className="size-3.5 shrink-0" />
        <span className="truncate">{shop.statusNote || 'ปิดให้บริการวันนี้'}</span>
      </div>
    );
  } else if (soldOut.length) {
    badge = <span className="rounded-full bg-[rgba(255,106,100,0.3)] px-2 py-0.5 text-[11px] font-semibold text-danger-rose">มีเมนูหมด</span>;
    note = (
      <div className="flex items-center gap-1.5 rounded-lg bg-danger-soft/50 px-2.5 py-1 text-xs text-danger">
        <AlertTriangle className="size-3.5 shrink-0" />
        <span className="truncate">
          หมด: <strong className="font-semibold">{soldOut.map((m) => m.name).join(', ')}</strong>
        </span>
      </div>
    );
  } else {
    badge = <span className="rounded-full bg-ok-soft/50 px-2 py-0.5 text-[11px] font-semibold text-ok">ครบทุกเมนู</span>;
    note = (
      <div className="flex items-center gap-1.5 rounded-lg bg-ok/10 px-2.5 py-1 text-xs text-ok">
        <CheckCircle2 className="size-3.5 shrink-0" />
        <span className="truncate">{shop.statusNote || 'วัตถุดิบครบ พร้อมเสิร์ฟ'}</span>
      </div>
    );
  }

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition hover:shadow-lift lg:rounded-xl ${
        open ? '' : 'opacity-90'
      }`}
    >
      <div className="relative h-44 w-full bg-surface-mid lg:h-48">
        <img
          src={getShopImage(shop)}
          alt={shop.name}
          loading="lazy"
          className={`size-full object-cover ${open ? '' : 'grayscale-[60%]'}`}
        />
        {!open && <div className="absolute inset-0 bg-ink-navy/20" />}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          <StatusPill open={open}>{open ? 'เปิดอยู่' : 'ปิดแล้ววันนี้'}</StatusPill>
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <RatingBadge rating={shop.rating} count={shop.reviewCount} />
          {onToggleBookmark && <HeartButton active={isBookmarked} onClick={onToggleBookmark} />}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-display text-lg font-semibold leading-6 text-ink">{shop.name}</h3>
          <span className="shrink-0 pt-0.5">{badge}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <MapPin className="size-3.5 shrink-0 text-brand" />
          <span className="truncate">{locationText(shop)}</span>
          <span className="ml-auto shrink-0 font-semibold text-brand">
            {price.symbol} • {price.label}
          </span>
        </div>
        <p className="truncate text-xs text-ink-muted">{menuSummary(shop)}</p>
        {note}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-surface-mid pt-2.5">
          <span className={`flex items-center gap-1 text-[11px] font-medium ${open ? 'text-ink-muted' : 'text-danger'}`}>
            {open ? <Clock className="size-3.5 text-ok" /> : <XCircle className="size-3.5" />}
            {open ? closingText(shop) : 'ปิดให้บริการ'}
          </span>
          <button
            type="button"
            onClick={go}
            className={`flex items-center gap-1 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-card transition active:scale-95 ${
              open ? 'bg-brand text-white hover:bg-brand/90' : 'bg-surface-mid text-ink hover:bg-surface-high'
            }`}
          >
            {open ? <UtensilsCrossed className="size-3" /> : <Info className="size-3.5" />}
            {open ? 'ดูเมนู & สถานะร้าน' : 'ดูสถานะร้าน & พิกัด'}
          </button>
        </div>
      </div>
    </article>
  );
}

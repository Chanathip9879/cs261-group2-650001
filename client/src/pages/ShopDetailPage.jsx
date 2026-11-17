// client/src/pages/ShopDetailPage.jsx
// รายละเอียดร้านค้า & เมนู (Restaurant Detail) — U3 ที่ตั้ง, U12 เวลาเปิด-ปิดวันนี้, รีวิว

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Clock, Store, CheckCircle2, XCircle, Phone, Share2, Heart, Navigation, MapPin,
  MessageSquarePlus, Ban, BadgeCheck, AlertCircle,
} from 'lucide-react';
import { StatusPill, HeartButton, Stars, Spinner, LiveDot } from '../components/ui/Primitives';
import { getOpeningHours } from '../services/api';
import { getEffectiveStatus } from '../utils/openingHours';
import WeeklyHours from '../components/WeeklyHours';
import ShopContactCard from '../components/ShopContactCard';
import {
  getShopImage, getMenuImage, locationText, canteenShort, formatBaht, telHref, formatPhone, isSoldOut,
} from '../utils/shopDisplay';
import { navigate, routes, goBack } from '../router';
import ReviewList from '../components/ReviewList';

export default function ShopDetailPage({ shop, canteens, isBookmarked, onToggleBookmark, justPosted, showToast, loading }) {
  // U12: ตารางเวลารายวัน (undefined = กำลังโหลด, null = โหลดไม่สำเร็จ)
  const [hoursRows, setHoursRows] = useState(undefined);

  useEffect(() => {
    if (!shop?.id) return;
    let cancelled = false;
    setHoursRows(undefined);
    getOpeningHours(shop.id)
      .then((rows) => !cancelled && setHoursRows(rows))
      .catch(() => !cancelled && setHoursRows(null));
    return () => {
      cancelled = true;
    };
  }, [shop?.id]);

  const canteen = canteens.find((c) => c.id === shop?.canteen);
  const menus = shop?.menus || [];
  const availableCount = menus.filter((m) => !isSoldOut(m)).length;

  const status = shop?.effectiveStatus || getEffectiveStatus(shop, shop?.todayHours || hoursRows || []);
  const todayHours = status.todayText;

  const rating = Number(shop?.rating || 0);
  const reviewCount = Number(shop?.reviewCount || 0);

  if (!shop) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-24 text-center text-ink-muted">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <AlertCircle className="size-10" />
            <p className="text-sm">ไม่พบร้านอาหารนี้</p>
            <a href="#/" className="text-sm font-semibold text-brand">กลับหน้าแรก</a>
          </>
        )}
      </div>
    );
  }

  const share = async () => {
    const url = window.location.href;
    const text = `${shop.name} — ${status.open ? 'เปิดอยู่' : 'ปิดแล้ว'} (${locationText(shop)})`;
    try {
      if (navigator.share) await navigator.share({ title: shop.name, text, url });
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        showToast('คัดลอกลิงก์สถานะร้านแล้ว', 'success');
      }
    } catch {
      // ผู้ใช้ยกเลิกการแชร์
    }
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${canteen?.name || shop.canteenName} มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต`
  )}`;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-0 pb-28 lg:px-8 lg:pb-12 lg:pt-6">
      {/* Breadcrumb (desktop) */}
      <nav className="mb-6 hidden items-center gap-1 text-xs text-ink-muted lg:flex">
        <button type="button" onClick={() => goBack()} className="flex items-center gap-1 font-semibold text-ink hover:text-brand">
          <ArrowLeft className="size-3.5" /> ร้านอาหารทั้งหมด
        </button>
        <span>/ มธ. ศูนย์รังสิต / {canteenShort(shop)} /</span>
        <span className="font-semibold text-ink">{shop.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:gap-6">
        <div className="space-y-6 lg:space-y-8">
          {/* Hero */}
          <section className="overflow-hidden bg-white lg:rounded-xl lg:shadow-card">
            <div className="relative h-60 lg:h-72">
              <img src={getShopImage(shop)} alt={shop.name} className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                <StatusPill open={status.open}>
                  {status.open ? `เปิดให้บริการหน้าร้าน • ${todayHours}` : 'ปิดแล้ว'}
                </StatusPill>
              </div>
              <HeartButton active={isBookmarked} onClick={onToggleBookmark} className="absolute right-3 top-3" />
              <div className="absolute inset-x-4 bottom-4 space-y-2 lg:inset-x-5">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-semibold text-ink">
                    ★ {rating.toFixed(1)} <span className="font-normal text-ink-muted">({reviewCount} รีวิว)</span>
                  </span>
                  <span className="rounded-md bg-brand-accent px-2 py-0.5 font-medium text-white">
                    {shop.categoryName} • {canteenShort(shop)}
                  </span>
                  <span className="hidden rounded-md bg-black/40 px-2 py-0.5 text-white lg:inline">{shop.locationDetails}</span>
                </div>
                <h1 className="font-display text-2xl font-bold text-white lg:text-3xl">{shop.name}</h1>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 lg:p-5">
              <InfoItem icon={<Clock className="size-4" />} label="เวลาเปิด-ปิดวันนี้" value={todayHours} />
              <InfoItem icon={<Store className="size-4" />} label="พิกัด" value={`${canteenShort(shop)} ${shop.boothNumber || ''}`} />
              <InfoItem
                icon={status.open ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                label="สถานะบริการ"
                value={status.open
                  ? (shop.statusNote || 'เปิดรับหน้าร้านปกติ')
                  : (status.reason === 'vendor_closed' ? (shop.statusNote || 'ปิดให้บริการ') : 'ปิดตามเวลาทำการ')}
                tone={status.open ? 'ok' : 'danger'}
              />
            </div>
          </section>

          {/* Menu status */}
          <section className="space-y-4 px-4 lg:px-0">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink lg:text-xl">
                <span className="hidden h-5 w-1.5 rounded-full bg-brand-accent lg:inline-block" />
                สถานะเมนู & ความพร้อมเสิร์ฟวันนี้
              </h2>
              <span className="rounded-full bg-brand-peach/60 px-2 py-0.5 text-[11px] text-brand-deep lg:bg-transparent lg:text-ink-muted">
                พร้อมเสิร์ฟ {availableCount}/{menus.length} รายการ
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
              {menus.map((m, i) => (
                <MenuCard key={m.id} shop={shop} menu={m} index={i} shopClosed={!status.open} />
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section id="reviews" className="mx-4 space-y-4 rounded-xl bg-white p-4 shadow-card lg:mx-0 lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">รีวิวจากลูกค้าตัวจริง</h2>
                <p className="text-xs text-ink-muted">คะแนนสะสมจากผู้ใช้ที่สั่งซื้อและทานจริงในระบบ Hiwkaw</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(routes.review(shop.id))}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-peach/60 px-3 py-2 text-xs font-semibold text-brand-deep lg:bg-surface-low lg:text-ink"
              >
                <MessageSquarePlus className="size-4" /> เขียนรีวิวให้ร้านนี้
              </button>
            </div>
            <div className="flex flex-col gap-4 rounded-xl bg-surface-low p-4 sm:flex-row sm:items-start lg:p-6">
              <div className="flex shrink-0 flex-col items-center justify-center px-6 py-2 text-center">
                <p className="font-display text-5xl font-bold text-ink">{rating.toFixed(1)}</p>
                <Stars value={rating} />
                <p className="mt-1 text-xs text-ink-muted">จากทั้งหมด {reviewCount} รีวิว</p>
              </div>
              <div className="min-w-0 flex-1">
                <ReviewList shopId={shop.id} justPosted={justPosted} />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar: location & contact */}
        <aside className="mx-4 h-fit space-y-0 overflow-hidden rounded-xl bg-white shadow-lift lg:sticky lg:top-24 lg:mx-0">
          <div className="flex items-start justify-between gap-2 bg-surface-high p-4">
            <h2 className="flex items-start gap-2 font-display text-lg font-bold text-ink">
              <Navigation className="mt-1 size-4 text-brand" /> พิกัด & ตำแหน่งร้านใน มธ. รังสิต
            </h2>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${status.open ? 'bg-ok' : 'bg-danger'}`}
            >
              {status.open ? '• เปิดให้บริการ' : '• ปิดแล้ว'}
            </span>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex gap-3 rounded-xl bg-surface-low p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-card">
                <MapPin className="size-4 text-brand" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] text-ink-muted">พิกัดร้านอาหาร</p>
                <p className="font-display text-base font-semibold text-ink">
                  {canteen?.shortName || canteenShort(shop)} {shop.boothNumber}
                </p>
                <p className="text-xs text-ink-muted">{shop.locationDetails}</p>
                {canteen?.landmark && <p className="mt-1 text-[11px] text-ink-muted">ใกล้: {canteen.landmark}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-low p-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-ink" />
                <div>
                  <p className="text-[10px] text-ink-muted">เวลาเปิดปิดวันนี้</p>
                  <p className="text-sm text-ink">{todayHours}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.open ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'}`}>
                <LiveDot open={status.open} /> {status.open ? 'กำลังเปิด' : 'ปิดแล้ว'}
              </span>
            </div>
            <WeeklyHours rows={hoursRows} fallbackText={shop.openingHours} />
            <ShopContactCard shopId={shop.id} />
            <div className="hidden space-y-3 lg:block">
              <a
                href={telHref(shop.phone)}
                className="flex items-center justify-center gap-2 rounded-lg bg-brand-accent py-3 text-sm font-semibold text-white shadow-card hover:bg-brand-accent/90"
              >
                <Phone className="size-4" /> โทรสอบถามร้าน ({formatPhone(shop.phone)})
              </a>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={share} className="flex items-center justify-center gap-1.5 rounded-lg bg-surface-low py-2 text-xs font-semibold text-ink hover:bg-surface-mid">
                  <Share2 className="size-3.5" /> แชร์สถานะร้าน
                </button>
                <button type="button" onClick={onToggleBookmark} className="flex items-center justify-center gap-1.5 rounded-lg bg-surface-low py-2 text-xs font-semibold text-ink hover:bg-surface-mid">
                  <Heart className={`size-3.5 ${isBookmarked ? 'fill-danger text-danger' : ''}`} />
                  {isBookmarked ? 'บันทึกแล้ว' : 'บันทึกร้านโปรด'}
                </button>
              </div>
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand hover:underline">
                <Navigation className="size-3.5" /> เปิดใน Google Maps
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-16 z-30 flex gap-2 bg-white/95 p-3 shadow-nav backdrop-blur lg:hidden">
        <a href={telHref(shop.phone)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white">
          <Phone className="size-4" /> โทรติดต่อร้าน
        </a>
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-high py-3 text-sm font-semibold text-ink">
          <Navigation className="size-4" /> นำทางไปร้าน
        </a>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, tone }) {
  const color = tone === 'ok' ? 'text-ok' : tone === 'danger' ? 'text-danger' : 'text-ink';
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-low p-3 sm:bg-transparent sm:p-0">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-mid ${tone ? color : 'text-brand'}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-ink-muted">{label}</p>
        <p className={`truncate text-sm font-semibold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function MenuCard({ shop, menu, index, shopClosed }) {
  const soldOut = isSoldOut(menu); // U6: ป้าย "หมด" ตาม is_sold_out / isAvailable
  return (
    <article className={`flex gap-3 rounded-xl bg-white p-3 shadow-card sm:flex-col ${soldOut ? 'bg-surface-low' : ''}`}>
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg sm:h-36 sm:w-full">
        <img
          src={getMenuImage(shop, index)}
          alt={menu.name}
          loading="lazy"
          className={`size-full object-cover ${soldOut ? 'grayscale' : ''}`}
        />
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">หมด</span>
          </div>
        )}
        <span
          className={`absolute right-0 top-0 hidden items-center gap-1 rounded-bl-lg px-2 py-0.5 text-[10px] font-semibold text-white sm:flex ${
            soldOut ? 'bg-danger' : 'bg-ok'
          }`}
        >
          {soldOut ? <Ban className="size-3" /> : <BadgeCheck className="size-3" />}
          {soldOut ? 'เมนูหมดแล้ววันนี้' : 'พร้อมเสิร์ฟ'}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <h3 className={`font-display text-base font-semibold ${soldOut ? 'text-ink-muted line-through' : 'text-ink'}`}>{menu.name}</h3>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="hidden text-[10px] text-ink-muted sm:block">ราคาหน้าร้าน</p>
            <p className={`font-display text-lg font-bold ${soldOut ? 'text-ink-muted line-through' : 'text-brand'}`}>{formatBaht(menu.price)}</p>
          </div>
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              soldOut ? 'bg-danger-soft text-danger' : shopClosed ? 'bg-surface-mid text-ink-muted' : 'bg-ok/10 text-ok'
            }`}
          >
            {soldOut ? <XCircle className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
            {soldOut ? 'ของหมดวันนี้' : shopClosed ? 'ร้านปิดอยู่' : 'พร้อมเสิร์ฟ'}
          </span>
        </div>
      </div>
    </article>
  );
}

// client/src/pages/HomePage.jsx
// หน้าแรก & ค้นหาร้านอาหาร (Customer Home) + สถานะผลการค้นหาไม่พบ (Search Not Found)
// U1 สถานะ real-time, U2 ค้นหา/ตัวกรอง, U3 ที่ตั้งร้าน

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, SlidersHorizontal, Star, Megaphone, Compass, Store, ArrowRight, X, ChevronRight,
  Soup, Flame, CookingPot, Drumstick, Salad, CupSoda, Utensils, FilterX, SearchX, MapPin, Clock,
} from 'lucide-react';
import RestaurantCard from '../components/RestaurantCard';
import { LiveDot, RatingBadge, Spinner } from '../components/ui/Primitives';
import { getShops } from '../services/api';
import { navigate, routes } from '../router';
import { getShopImage, hoursText, locationText, menuSummary } from '../utils/shopDisplay';

// lgBg = สีวงกลมไอคอนบนเดสก์ท็อป (เขียนเต็มคลาสเพื่อให้ Tailwind JIT มองเห็น)
const CATEGORY_ICONS = {
  rice_curry: { Icon: Soup, lgBg: 'lg:bg-brand-accent/10' },
  made_to_order: { Icon: Flame, lgBg: 'lg:bg-brand-peach' },
  noodles: { Icon: CookingPot, lgBg: 'lg:bg-ok-soft/50' },
  chicken_rice: { Icon: Drumstick, lgBg: 'lg:bg-brand-accent/10' },
  papaya_salad: { Icon: Salad, lgBg: 'lg:bg-ok-soft/50' },
  drinks_dessert: { Icon: CupSoda, lgBg: 'lg:bg-surface-mid' },
};

export default function HomePage({
  allShops,
  canteens,
  categories,
  searchQuery,
  onSearchChange,
  isBookmarked,
  onToggleBookmark,
}) {
  const [draft, setDraft] = useState(searchQuery);
  const [canteen, setCanteen] = useState('all');
  const [category, setCategory] = useState('all');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [topRated, setTopRated] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [shops, setShops] = useState(null);

  useEffect(() => setDraft(searchQuery), [searchQuery]);

  // U2: ใช้ API ค้นหาของ server (ค้นทั้งชื่อร้านและชื่อเมนู) — โหลดใหม่ทุกครั้งที่ allShops อัปเดต (polling)
  useEffect(() => {
    let cancelled = false;
    getShops({ q: searchQuery, canteen, category, status: onlyOpen ? 'open' : 'all' })
      .then((res) => !cancelled && res.success && setShops(res.data))
      .catch(() => !cancelled && setShops((prev) => prev || []));
    return () => {
      cancelled = true;
    };
  }, [searchQuery, canteen, category, onlyOpen, allShops]);

  const visible = useMemo(
    () => (shops || []).filter((s) => !topRated || Number(s.rating) >= 4.5),
    [shops, topRated]
  );

  const activeFilterCount = [canteen !== 'all', category !== 'all', onlyOpen, topRated].filter(Boolean).length;
  const hasQueryOrFilter = !!searchQuery || activeFilterCount > 0;
  const openCount = allShops.filter((s) => s.isOpen).length;

  const clearAll = () => {
    onSearchChange('');
    setDraft('');
    setCanteen('all');
    setCategory('all');
    setOnlyOpen(false);
    setTopRated(false);
  };

  const submit = (e) => {
    e.preventDefault();
    onSearchChange(draft.trim());
  };

  const pill = (active, onClick, children, key) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium shadow-card transition ${
        active ? 'bg-brand text-white lg:bg-ok/10 lg:text-ok' : 'bg-surface-mid text-ink-muted lg:bg-white lg:text-ink'
      }`}
    >
      {children}
    </button>
  );

  const realCategories = categories.filter((c) => c.id !== 'all');
  const isNotFound = shops !== null && visible.length === 0 && hasQueryOrFilter;
  const recommended = allShops.filter((s) => s.isOpen).sort((a, b) => b.rating - a.rating).slice(0, 3);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 pb-28 pt-3 lg:gap-8 lg:px-8 lg:pb-12 lg:pt-6">
      {/* ===== Search Engine Box ===== */}
      <section className="sticky top-16 z-30 -mx-4 flex flex-col gap-2 bg-surface/95 px-4 py-2 backdrop-blur-md lg:static lg:mx-0 lg:gap-4 lg:bg-transparent lg:p-0">
        <form onSubmit={submit} className="flex items-center gap-2 lg:rounded-xl lg:bg-white lg:p-4 lg:shadow-lift">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted lg:text-brand" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="ค้นหาร้านใน มธ. รังสิต, โรงอาหาร SC, กรีนแคนทีน, ข้าวมันไก่, ส้มตำ..."
              aria-label="ค้นหาร้านอาหารหรือเมนู"
              className="h-11 w-full rounded-xl bg-white pl-11 pr-10 text-sm text-ink shadow-card outline-none placeholder:text-ink-muted/70 focus:ring-2 focus:ring-brand-accent/40 lg:h-12 lg:rounded-lg lg:bg-surface lg:shadow-none"
            />
            {draft && (
              <button
                type="button"
                onClick={() => {
                  setDraft('');
                  onSearchChange('');
                }}
                aria-label="ล้างคำค้นหา"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted hover:bg-surface-mid"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className="relative flex size-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-surface-mid text-ink shadow-card lg:h-12 lg:w-auto lg:rounded-lg lg:bg-surface lg:px-4 lg:shadow-none"
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden text-xs font-semibold lg:inline">ตัวกรองละเอียด</span>
            {activeFilterCount > 0 && (
              <span className="absolute right-2 top-2 size-2 rounded-full bg-brand-accent lg:static lg:flex lg:size-5 lg:items-center lg:justify-center lg:text-[10px] lg:font-bold lg:text-white">
                <span className="hidden lg:inline">{activeFilterCount}</span>
              </span>
            )}
          </button>
          <button
            type="submit"
            className="hidden h-12 shrink-0 rounded-lg bg-brand-accent px-6 text-sm font-semibold text-white shadow-card transition hover:bg-brand-accent/90 lg:block"
          >
            ค้นหาร้านอาหาร
          </button>
        </form>

        {/* Quick Filter Pills */}
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          {pill(onlyOpen, () => setOnlyOpen((v) => !v), (
            <>
              <span className={`size-2 rounded-full ${onlyOpen ? 'bg-white lg:bg-ok' : 'bg-ok'}`} />
              เปิดอยู่ตอนนี้ (Real-time)
            </>
          ), 'open')}
          {pill(topRated, () => setTopRated((v) => !v), (
            <>
              <Star className={`size-3.5 ${topRated ? 'fill-current' : 'fill-brand text-brand'}`} />
              เรตติ้ง 4.5+
            </>
          ), 'rate')}
          {canteens.map((c) =>
            pill(canteen === c.id, () => setCanteen(canteen === c.id ? 'all' : c.id), (
              <>
                <MapPin className="size-3.5" />
                {c.shortName}
              </>
            ), c.id)
          )}
        </div>

        {showFilters && (
          <div className="rounded-xl bg-white p-4 shadow-lift">
            <p className="mb-2 text-xs font-semibold text-ink">หมวดหมู่อาหาร</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    category === c.id ? 'bg-brand text-white' : 'bg-surface-mid text-ink-muted hover:bg-surface-high'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearAll} className="mt-3 text-xs font-semibold text-brand hover:underline">
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        )}
      </section>

      {isNotFound ? (
        <NotFoundSection
          query={searchQuery}
          onClear={clearAll}
          onPickCanteen={(id) => {
            clearAll();
            setCanteen(id);
          }}
          canteens={canteens}
          recommended={recommended}
        />
      ) : (
        <>
          {/* ===== Promotional Hero Card ===== */}
          {!hasQueryOrFilter && (
            <section className="hidden items-center justify-between gap-4 overflow-hidden rounded-xl bg-brand-accent p-6 shadow-hero lg:flex">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-white backdrop-blur">
                    <Megaphone className="size-3" /> LIVE STATUS
                  </span>
                  <span className="text-[11px] font-medium text-white/90">
                    {canteens.map((c) => c.shortName).join(' • ') || 'SC • Green Canteen'} • เปิดอยู่ {openCount}/{allShops.length} ร้าน
                  </span>
                </div>
                <h1 className="font-display text-2xl font-bold text-white">สถานะร้านอาหาร มธ. รังสิต แบบเรียลไทม์</h1>
              </div>
              <button
                type="button"
                onClick={() => document.getElementById('restaurants')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-white px-4 text-xs font-semibold text-ink shadow-card"
              >
                <Compass className="size-4" /> ดูโรงอาหารทั้งหมด
              </button>
            </section>
          )}

          {/* ===== Category Nav ===== */}
          {!searchQuery && realCategories.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">
                  <span className="lg:hidden">สำรวจตามประเภท</span>
                  <span className="hidden lg:inline">หมวดหมู่อาหารยอดฮิต</span>
                </h2>
                {category !== 'all' ? (
                  <button type="button" onClick={() => setCategory('all')} className="text-[11px] font-semibold text-brand">
                    ดูทั้งหมด
                  </button>
                ) : (
                  <span className="hidden text-[11px] text-ink-muted lg:inline">เลือกลิ้มรสตามสไตล์คุณ</span>
                )}
              </div>
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-6 lg:px-0">
                {realCategories.map((c) => {
                  const { Icon, lgBg } = CATEGORY_ICONS[c.id] || { Icon: Utensils, lgBg: 'lg:bg-surface-mid' };
                  const active = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(active ? 'all' : c.id)}
                      aria-pressed={active}
                      className={`flex w-[72px] shrink-0 flex-col items-center gap-1.5 transition lg:w-auto lg:rounded-lg lg:bg-white lg:p-3 lg:shadow-card ${
                        active ? 'lg:ring-2 lg:ring-brand-accent' : 'lg:hover:shadow-lift'
                      }`}
                    >
                      <span
                        className={`flex h-[59px] w-full items-center justify-center rounded-2xl shadow-card lg:size-12 lg:rounded-full lg:shadow-none ${
                          active ? 'bg-brand text-white' : `bg-surface-low text-brand ${lgBg}`
                        }`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="line-clamp-1 text-center text-[11px] font-semibold text-ink lg:text-xs">
                        {c.name.split('/')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ===== Restaurants ===== */}
          <section id="restaurants" className="scroll-mt-24 space-y-3 lg:space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <LiveDot className="lg:hidden" />
                  <h2 className="font-display text-lg font-bold text-ink lg:text-xl lg:font-semibold">
                    {searchQuery ? `ผลการค้นหา "${searchQuery}"` : (
                      <>
                        <span className="lg:hidden">ร้านอาหาร</span>
                        <span className="hidden lg:inline">ร้านอาหารยอดนิยม มธ. ศูนย์รังสิต</span>
                      </>
                    )}
                  </h2>
                  <span className="hidden rounded bg-brand-peach px-2 py-0.5 text-[11px] font-medium text-brand-deep lg:inline">
                    มธ. ศูนย์รังสิต
                  </span>
                </div>
                <p className="hidden text-xs text-ink-muted lg:block">
                  {canteens.map((c) => c.name).join(', ') || 'โรงอาหาร SC, Green Canteen'}
                </p>
              </div>
              <span className="flex items-center text-[11px] font-semibold text-brand lg:text-xs">
                {shops === null ? '...' : `${visible.length} ร้าน`}
                <ChevronRight className="hidden size-4 lg:inline" />
              </span>
            </div>

            {shops === null ? (
              <div className="flex flex-col items-center gap-3 py-16 text-ink-muted">
                <Spinner />
                <p className="text-xs">กำลังโหลดสถานะร้านอาหาร...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {visible.map((shop) => (
                  <RestaurantCard
                    key={shop.id}
                    shop={shop}
                    isBookmarked={isBookmarked(shop.id)}
                    onToggleBookmark={() => onToggleBookmark(shop)}
                  />
                ))}
              </div>
            )}
          </section>

          <MerchantBanner />
        </>
      )}
    </div>
  );
}

function MerchantBanner() {
  return (
    <section className="flex items-center justify-between gap-3 rounded-2xl bg-surface-high p-4 shadow-card lg:rounded-xl lg:bg-white lg:p-6">
      <div className="flex min-w-0 items-center gap-3 lg:gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-card lg:size-14 lg:bg-brand-accent/10 lg:text-brand">
          <Store className="size-5 lg:size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand lg:hidden">สำหรับพาร์ทเนอร์ร้านค้า HIWKAW</p>
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-lg font-semibold text-ink">
              <span className="lg:hidden">แดชบอร์ดร้านอาหาร</span>
              <span className="hidden lg:inline">สำหรับพาร์ทเนอร์ร้านค้า มธ. รังสิต Hiwkaw หิวข้าว</span>
            </h3>
            <span className="hidden rounded bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok-text lg:inline">Merchant Portal</span>
          </div>
          <p className="truncate text-xs text-ink-muted">จัดการเมนู เช็กสต็อกวัตถุดิบ และอัปเดตสถานะร้านค้าแบบเรียลไทม์</p>
        </div>
      </div>
      <a
        href={`#${routes.merchant}`}
        className="flex shrink-0 items-center gap-1 rounded-xl bg-brand px-3.5 py-2.5 text-xs font-semibold text-white shadow-card lg:h-11 lg:rounded-lg lg:bg-ink-navy lg:px-6"
      >
        <span className="lg:hidden">เข้าสู่ระบบ</span>
        <span className="hidden lg:inline">เข้าสู่ระบบร้านค้า</span>
        <ArrowRight className="size-3" />
      </a>
    </section>
  );
}

function NotFoundSection({ query, onClear, onPickCanteen, canteens, recommended }) {
  return (
    <>
      <section className="relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl bg-white p-6 text-center shadow-card lg:flex-row lg:items-start lg:gap-14 lg:p-16 lg:text-left">
        <div className="pointer-events-none absolute -right-24 top-0 hidden size-96 rounded-full bg-brand-peach/30 blur-3xl lg:block" />
        <div className="relative flex size-40 shrink-0 items-center justify-center rounded-full bg-[#f3eef2]">
          <CookingPot className="size-14 text-brand-accent" />
          <span className="absolute -bottom-1 -right-1 flex size-16 items-center justify-center rounded-full bg-brand-accent text-white shadow-hero">
            <SearchX className="size-7" />
          </span>
        </div>
        <div className="relative space-y-3">
          <p className="text-xs font-semibold text-brand">ไม่พบผลลัพธ์</p>
          <h2 className="font-display text-2xl font-bold text-ink">ไม่พบร้านหรือเมนูนี้</h2>
          <p className="text-sm text-ink-muted">
            {query ? <>ไม่มีร้านที่ตรงกับ “{query}” </> : null}
            ลองค้นหาด้วยคำอื่น หรือเลือกดูร้านตามโซนยอดนิยมใน มธ. รังสิต ด้านล่าง
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1 lg:justify-start">
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-2 rounded-lg bg-brand-accent px-5 py-3 text-sm font-semibold text-white shadow-card"
            >
              <FilterX className="size-4" /> ล้างตัวกรอง
            </button>
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-2 rounded-lg bg-surface-mid px-5 py-3 text-sm font-semibold text-ink"
            >
              <Compass className="size-4" /> ดูร้านทั้งหมด
            </button>
          </div>
          {canteens.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-ink-muted">โซนยอดนิยมแนะนำ:</p>
              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                {canteens.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onPickCanteen(c.id)}
                    className="flex items-center gap-1.5 rounded-md border border-surface-high bg-surface-low px-3 py-1.5 text-xs text-ink-muted hover:border-brand-accent"
                  >
                    <Store className="size-3.5 text-brand" /> {c.shortName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {recommended.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ok">
                <LiveDot /> เปิดอยู่จริงใน มธ. รังสิต
              </p>
              <h2 className="font-display text-2xl font-bold text-ink">ร้านเปิดอยู่ยอดนิยมแนะนำ</h2>
              <p className="text-sm text-ink-muted">ร้านยอดนิยมที่พร้อมรับออเดอร์ทันทีรอบ มธ. รังสิต</p>
            </div>
            <button type="button" onClick={onClear} className="flex items-center gap-1 text-sm font-semibold text-brand">
              ดูร้านทั้งหมด <ArrowRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((shop) => (
              <article key={shop.id} className="flex flex-col overflow-hidden rounded-xl bg-white shadow-card">
                <div className="relative h-48">
                  <img src={getShopImage(shop)} alt={shop.name} className="size-full object-cover" />
                  <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-ok px-2.5 py-1 text-xs font-semibold text-white">
                    <LiveDot className="bg-white" /> เปิดอยู่
                  </span>
                  <RatingBadge rating={shop.rating} count={`${shop.reviewCount}`} className="absolute right-3 top-3" />
                  <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs text-ink">
                    <Clock className="size-3.5 text-brand" /> {hoursText(shop)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <h3 className="font-display text-lg font-semibold text-ink">{shop.name}</h3>
                  <p className="flex items-center gap-1 text-xs text-ink">
                    <MapPin className="size-3.5 text-brand" /> {locationText(shop)}
                  </p>
                  <p className="line-clamp-2 text-xs text-ink-muted">{menuSummary(shop, 4)}</p>
                  <button
                    type="button"
                    onClick={() => navigate(routes.shop(shop.id))}
                    className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-surface-low py-2 text-xs font-medium text-ink hover:bg-surface-mid"
                  >
                    <Store className="size-4" /> ดูสถานะร้าน & พิกัด
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

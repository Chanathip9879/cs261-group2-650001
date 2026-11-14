// client/src/components/layout/SiteHeader.jsx
// Header ฝั่งลูกค้า: เดสก์ท็อปมีช่องค้นหา + เมนู, มือถือแสดงโลโก้ + ปุ่มลัด (ตาม Figma)

import React, { useEffect, useState } from 'react';
import { Search, Heart, Store, User, UtensilsCrossed, ArrowLeft, LogOut } from 'lucide-react';
import { navigate, routes, goBack } from '../../router';

export default function SiteHeader({
  path,
  searchQuery,
  onSearch,
  customer,
  onCustomerLogout,
  bookmarkCount = 0,
  mobileTitle,
  mobileSubtitle = 'Explore',
  showBack = false,
}) {
  const [draft, setDraft] = useState(searchQuery || '');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setDraft(searchQuery || ''), [searchQuery]);

  const submit = (e) => {
    e.preventDefault();
    onSearch?.(draft);
    navigate(routes.home);
  };

  const navLink = (to, label, active) => (
    <a
      href={`#${to}`}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? 'bg-brand-accent text-white shadow-card' : 'text-ink-muted hover:bg-surface-low'
      }`}
    >
      {label}
    </a>
  );

  const avatar = (
    <div className="relative">
      <button
        type="button"
        onClick={() => (customer ? setMenuOpen((v) => !v) : navigate(routes.login))}
        aria-label={customer ? 'บัญชีของฉัน' : 'เข้าสู่ระบบลูกค้า'}
        className="flex size-8 items-center justify-center rounded-full bg-brand text-white shadow-card"
      >
        {customer ? <span className="text-xs font-bold">{(customer.name || 'U').slice(0, 1)}</span> : <User className="size-3.5" />}
      </button>
      {menuOpen && customer && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-xl bg-white p-2 shadow-hero">
          <p className="px-3 pt-1 text-xs text-ink-muted">เข้าสู่ระบบในชื่อ</p>
          <p className="truncate px-3 pb-2 text-sm font-semibold text-ink">{customer.name}</p>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onCustomerLogout?.();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft/50"
          >
            <LogOut className="size-4" /> ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/90 shadow-soft backdrop-blur-xl">
      {/* Desktop */}
      <div className="mx-auto hidden h-20 max-w-[1200px] items-center gap-8 px-8 lg:flex">
        <a href="#/" className="font-display text-xl font-semibold tracking-tight text-brand">
          Hiwkaw
        </a>
        <form onSubmit={submit} className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="ค้นหาร้านอาหาร หรือเมนูจานโปรด..."
            className="h-11 w-full rounded-lg bg-white pl-10 pr-4 text-sm text-ink shadow-soft outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-brand-accent/40"
          />
        </form>
        <nav className="ml-auto flex items-center gap-1">
          {navLink(routes.home, 'หน้าแรก ค้นหาร้าน', path === '/' )}
          <a
            href={`#${routes.bookmarks}`}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              path === routes.bookmarks ? 'bg-brand-accent text-white shadow-card' : 'text-ink-muted hover:bg-surface-low'
            }`}
          >
            <Heart className="size-4" />
            ร้านอาหารโปรด
            {bookmarkCount > 0 && (
              <span className="rounded-full bg-brand-peach px-1.5 text-[10px] font-bold text-brand-deep">{bookmarkCount}</span>
            )}
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={`#${routes.merchant}`}
            className="flex items-center gap-1.5 rounded-lg bg-surface-low px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-mid"
          >
            <Store className="size-4 text-brand" />
            ร้านค้าพาร์ทเนอร์
          </a>
          {avatar}
        </div>
      </div>

      {/* Mobile */}
      <div className="flex h-16 items-center justify-between px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          {showBack && (
            <button type="button" onClick={() => goBack()} aria-label="ย้อนกลับ" className="-ml-1 p-1 text-ink">
              <ArrowLeft className="size-6" />
            </button>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold leading-tight text-brand">{mobileTitle || 'Hiwkaw'}</p>
            <p className="truncate text-[11px] font-medium text-ink-muted">{mobileSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full bg-surface-mid p-0.5">
            <a href="#/" aria-label="โหมดลูกค้า" className="flex min-h-9 items-center rounded-full p-2.5 text-ink">
              <UtensilsCrossed className="size-3.5" />
            </a>
            <a href={`#${routes.merchant}`} aria-label="โหมดร้านค้า" className="flex min-h-9 items-center rounded-full p-2.5 text-ink">
              <Store className="size-3.5" />
            </a>
          </div>
          {avatar}
        </div>
      </div>
    </header>
  );
}

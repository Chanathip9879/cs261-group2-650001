// client/src/components/layout/MerchantLayout.jsx
// โครงหน้าฝั่งร้านค้า: Sidebar (เดสก์ท็อป) + Header + แถบเมนูล่าง (มือถือ) ตาม Figma Merchant Dashboard

import React from 'react';
import {
  LayoutGrid, UtensilsCrossed, Clock, MessageSquareText, Store, Bell, User, LogOut, ShieldCheck,
} from 'lucide-react';
import { Toggle } from '../ui/Primitives';
import MobileNav from './MobileNav';
import { routes } from '../../router';

export default function MerchantLayout({
  path, user, shop, shops, onSelectShop, onToggleOpen, statusBusy, onLogout, children, subtitle = 'Store Dashboard',
}) {
  const isAdmin = user?.role === 'admin';

  const nav = [
    { href: `#${routes.merchant}`, label: 'แดชบอร์ดร้าน', Icon: LayoutGrid, active: path === routes.merchant },
    { href: `#${routes.merchant}?menu`, label: 'รายการเมนู', Icon: UtensilsCrossed, active: false, scrollTo: 'menu-stock' },
    { href: `#${routes.merchantHours}`, label: 'เวลาเปิด-ปิด', Icon: Clock, active: path === routes.merchantHours },
    { href: shop ? `#${routes.shop(shop.id)}` : '#/', label: 'รีวิวร้านค้า', Icon: MessageSquareText, active: false },
  ];

  return (
    <div className="min-h-screen bg-surface lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 bg-white p-6 shadow-soft lg:flex">
        <a href="#/" className="block">
          <p className="font-display text-xl font-semibold text-brand">Hiwkaw</p>
          <p className="text-xs font-semibold text-brand/80">Merchant Partner</p>
        </a>
        {shop && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-low p-3">
            <div className="flex items-start gap-2">
              <span className={`mt-1 size-2 shrink-0 rounded-full ${shop.isOpen ? 'bg-ok' : 'bg-danger'}`} />
              <span className="text-[11px] leading-4">
                <span className="block font-semibold text-ink">สถานะร้านค้า</span>
                <span className={shop.isOpen ? 'text-ok' : 'text-danger'}>
                  {shop.isOpen ? 'เปิดรับออเดอร์ (Online)' : 'ปิดร้าน (Offline)'}
                </span>
              </span>
            </div>
            <Toggle checked={shop.isOpen} onChange={onToggleOpen} disabled={statusBusy} label="สลับสถานะเปิด/ปิดร้าน" size="sm" />
          </div>
        )}
        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label, Icon, active, scrollTo }) => (
            <a
              key={label}
              href={scrollTo ? `#${routes.merchant}` : href}
              onClick={() => {
                if (scrollTo) setTimeout(() => document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' }), 50);
              }}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                active ? 'bg-brand-accent text-white shadow-card' : 'text-ink hover:bg-surface-low'
              }`}
            >
              <Icon className="size-4" /> {label}
            </a>
          ))}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-ink hover:bg-danger-soft/50 hover:text-danger"
          >
            <LogOut className="size-4" /> ออกจากระบบ
          </button>
        </nav>
        <a
          href="#/"
          className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-surface-low py-2.5 text-xs font-semibold text-ink hover:bg-surface-mid"
        >
          <Store className="size-4" /> สลับไปหน้าลูกค้า
        </a>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-surface/90 shadow-soft backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 lg:h-[72px] lg:px-8">
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-tight text-brand lg:hidden">Hiwkaw</p>
              <p className="truncate text-xs text-ink-muted lg:hidden">{subtitle}</p>
              <div className="hidden items-center gap-2 lg:flex">
                <Store className="size-5 text-brand" />
                <div className="min-w-0">
                  {isAdmin && shops?.length ? (
                    <select
                      value={shop?.id || ''}
                      onChange={(e) => onSelectShop(e.target.value)}
                      className="max-w-md truncate rounded-md bg-transparent font-display text-lg font-semibold text-ink outline-none"
                      aria-label="เลือกร้านที่ต้องการจัดการ"
                    >
                      {shops.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="truncate font-display text-lg font-semibold text-ink">{shop?.name}</p>
                  )}
                  <p className="text-[11px] text-ink-muted">รหัสร้าน: {shop?.id?.toUpperCase()} • {shop?.boothNumber}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="relative hidden size-9 items-center justify-center rounded-lg bg-surface-low text-ink lg:flex" aria-hidden>
                <Bell className="size-4" />
                {shop?.menus?.some((m) => !m.isAvailable) && <span className="absolute right-2 top-2 size-2 rounded-full bg-brand-accent" />}
              </span>
              <div className="hidden text-right text-xs lg:block">
                <p className="font-semibold text-ink">{user?.name || user?.vendorName}</p>
                <p className="text-ok">{isAdmin ? 'ผู้ดูแลระบบ' : 'เจ้าของร้าน'}</p>
              </div>
              <a href="#/" className="flex size-9 items-center justify-center rounded-full bg-surface-mid text-ink lg:hidden" aria-label="หน้าลูกค้า">
                <UtensilsCrossed className="size-4" />
              </a>
              <button
                type="button"
                onClick={onLogout}
                aria-label="ออกจากระบบ"
                title="ออกจากระบบ"
                className="flex size-9 items-center justify-center rounded-full bg-brand text-white shadow-card"
              >
                <User className="size-4" />
              </button>
            </div>
          </div>
          {isAdmin && shops?.length > 0 && (
            <div className="border-t border-surface-mid px-4 py-2 lg:hidden">
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <ShieldCheck className="size-4 text-ok" /> จัดการร้าน:
                <select
                  value={shop?.id || ''}
                  onChange={(e) => onSelectShop(e.target.value)}
                  className="min-w-0 flex-1 rounded-md bg-white px-2 py-1 text-xs text-ink"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </header>

        <main className="flex-1 px-4 pb-28 pt-4 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>
      </div>

      <MobileNav path={path} />
    </div>
  );
}

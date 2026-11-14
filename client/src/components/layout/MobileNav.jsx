// client/src/components/layout/MobileNav.jsx
// แถบเมนูด้านล่างบนมือถือ (สำรวจ / ร้านโปรด / จัดการร้าน / ตั้งเวลา) ตาม Figma

import React from 'react';
import { Compass, Heart, Store, Clock } from 'lucide-react';
import { routes } from '../../router';

const ITEMS = [
  { to: routes.home, label: 'สำรวจ', Icon: Compass, match: (p) => p === '/' || p.startsWith('/shop') },
  { to: routes.bookmarks, label: 'ร้านโปรด', Icon: Heart, match: (p) => p === routes.bookmarks },
  { to: routes.merchant, label: 'จัดการร้าน', Icon: Store, match: (p) => p === routes.merchant || p === routes.merchantLogin },
  { to: routes.merchantHours, label: 'ตั้งเวลา', Icon: Clock, match: (p) => p === routes.merchantHours },
];

export default function MobileNav({ path }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-surface/90 shadow-nav backdrop-blur-xl lg:hidden pb-safe">
      <div className="mx-auto flex h-16 max-w-xl items-center px-1">
        {ITEMS.map(({ to, label, Icon, match }) => {
          const active = match(path);
          return (
            <a
              key={to}
              href={`#${to}`}
              aria-current={active ? 'page' : undefined}
              className={`flex h-full min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold tracking-tight ${
                active ? 'text-brand' : 'text-ink-muted'
              }`}
            >
              <Icon className={`size-5 ${active ? 'stroke-[2.5]' : ''}`} />
              {label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

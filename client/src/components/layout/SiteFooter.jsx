// client/src/components/layout/SiteFooter.jsx
import React from 'react';
import { routes } from '../../router';

export default function SiteFooter() {
  return (
    <footer className="mt-auto hidden w-full bg-surface-low lg:block">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 p-8">
        <div>
          <p className="font-display text-lg font-semibold text-brand">Hiwkaw หิวข้าว</p>
          <p className="text-[11px] text-ink-muted">โครงการวิชา CS261 มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต</p>
        </div>
        <nav className="flex items-center gap-6 text-xs font-semibold text-ink-muted">
          <a href="#/" className="hover:text-brand">ค้นหาร้าน</a>
          <a href={`#${routes.bookmarks}`} className="hover:text-brand">ร้านโปรด</a>
          <a href={`#${routes.merchantLogin}`} className="hover:text-brand">เข้าสู่ระบบร้านค้า</a>
        </nav>
        <p className="text-xs text-ink-muted">© {new Date().getFullYear()} Hiwkaw หิวข้าว Platform. สงวนลิขสิทธิ์ทุกประการ.</p>
      </div>
    </footer>
  );
}

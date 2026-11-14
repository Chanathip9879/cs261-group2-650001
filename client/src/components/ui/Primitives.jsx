// client/src/components/ui/Primitives.jsx
// ชิ้นส่วน UI เล็กๆ ที่ใช้ซ้ำทุกหน้า ตามดีไซน์ Figma

import React from 'react';
import { Star, Heart } from 'lucide-react';

export function Toggle({ checked, onChange, disabled, label, size = 'md', tone = 'ok' }) {
  const dims = size === 'lg' ? 'w-16 h-9' : size === 'sm' ? 'w-9 h-5' : 'w-11 h-6';
  const knob = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const shift = size === 'lg' ? 'translate-x-7' : size === 'sm' ? 'translate-x-4' : 'translate-x-5';
  const on = tone === 'ok' ? 'bg-ok' : 'bg-brand-accent';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex shrink-0 items-center rounded-full p-1 transition-colors disabled:opacity-50 ${dims} ${
        checked ? on : 'bg-surface-high'
      }`}
    >
      <span
        className={`block rounded-full bg-white shadow transition-transform ${knob} ${checked ? shift : 'translate-x-0'}`}
      />
    </button>
  );
}

export function LiveDot({ open = true, className = '' }) {
  return (
    <span
      className={`inline-block size-2 shrink-0 rounded-full ${open ? 'bg-ok animate-live' : 'bg-danger'} ${className}`}
    />
  );
}

export function StatusPill({ open, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-[14px] backdrop-blur ${
        open ? 'bg-ok-soft/90 text-ok-text' : 'bg-danger-soft text-danger-deep'
      } ${className}`}
    >
      <LiveDot open={open} />
      {children || (open ? 'เปิดอยู่' : 'ปิดแล้ว')}
    </span>
  );
}

export function RatingBadge({ rating, count, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-ink backdrop-blur ${className}`}
    >
      <Star className="size-3 fill-brand-accent text-brand-accent" />
      {Number(rating || 0).toFixed(1)}
      {count !== undefined && <span className="text-[10px] font-medium text-ink-muted">({count})</span>}
    </span>
  );
}

export function Stars({ value = 0, size = 'size-4', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= Math.round(value) ? 'fill-brand-accent text-brand-accent' : 'text-surface-high fill-surface-high'}`}
        />
      ))}
    </span>
  );
}

export function HeartButton({ active, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-label={active ? 'เอาออกจากร้านโปรด' : 'บันทึกร้านโปรด'}
      aria-pressed={!!active}
      className={`flex size-9 items-center justify-center rounded-full bg-white/90 shadow-card backdrop-blur transition active:scale-90 ${className}`}
    >
      <Heart className={`size-[18px] ${active ? 'fill-danger text-danger' : 'text-ink'}`} />
    </button>
  );
}

export function Card({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`rounded-xl bg-white shadow-card ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function SectionTitle({ children, right, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <h2 className="font-display text-lg font-bold text-ink">{children}</h2>
      {right}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div className={`size-8 animate-spin rounded-full border-[3px] border-brand-accent border-t-transparent ${className}`} />
  );
}

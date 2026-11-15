// client/src/components/ReviewList.jsx
// U9: รายการรีวิวในหน้าร้าน (ชื่อผู้รีวิว, ข้อความ, วันที่) โหลดจาก API รีวิว (Task37)
// - แสดงรีวิวที่เพิ่งส่งบนสุดทันที (justPosted) พร้อมไฮไลต์
// - โหลดไม่สำเร็จ: แสดงข้อความพร้อมปุ่มลองใหม่ / ไม่มีรีวิว: แสดง "ยังไม่มีรีวิว"

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Stars, Spinner } from './ui/Primitives';
import { getShopReviews } from '../services/api';
import { formatReviewDate } from '../utils/reviewValidation';

const PAGE_SIZE = 5;

export default function ReviewList({ shopId, justPosted }) {
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      setReviews(await getShopReviews(shopId));
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  // รวมรีวิวที่เพิ่งส่งไว้บนสุด (กันกรณี server ยังไม่ส่งกลับมาในรายการ)
  const list = useMemo(() => {
    if (!justPosted?.id) return reviews;
    return [justPosted, ...reviews.filter((r) => r.id !== justPosted.id)];
  }, [reviews, justPosted]);

  if (status === 'loading' && !list.length) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-white p-6 text-sm text-ink-muted">
        <Spinner className="size-5 border-2" /> กำลังโหลดรีวิว...
      </div>
    );
  }

  if (status === 'error' && !list.length) {
    return (
      <div role="alert" className="space-y-3 rounded-xl bg-white p-5 text-center">
        <p className="flex items-center justify-center gap-1.5 text-sm text-danger">
          <AlertCircle className="size-4" /> {error || 'โหลดรายการรีวิวไม่สำเร็จ'}
        </p>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-mid px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-high"
        >
          <RefreshCw className="size-3.5" /> ลองใหม่
        </button>
      </div>
    );
  }

  if (!list.length) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white p-6 text-center text-sm text-ink-muted">
        <MessageCircle className="size-6" />
        ยังไม่มีรีวิว — เป็นคนแรกที่รีวิวร้านนี้เลย!
      </div>
    );
  }

  const visible = showAll ? list : list.slice(0, PAGE_SIZE);

  return (
    <div className="space-y-3">
      {visible.map((r) => (
        <article
          key={r.id}
          className={`space-y-2 rounded-xl p-4 shadow-card transition-colors ${
            r.id === justPosted?.id ? 'bg-ok-soft/30 ring-1 ring-ok/30' : 'bg-white'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-peach text-xs font-bold text-brand">
                {(r.username || '?').trim().slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate text-sm font-semibold text-ink">{r.username}</span>
              {r.id === justPosted?.id && (
                <span className="shrink-0 rounded-full bg-ok px-2 py-0.5 text-[10px] font-semibold text-white">รีวิวของคุณ</span>
              )}
            </div>
            {r.rating ? <Stars value={r.rating} size="size-3.5" /> : null}
          </div>
          <p className="whitespace-pre-line break-words text-sm leading-6 text-ink">{r.comment}</p>
          {Array.isArray(r.tags) && r.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {r.tags.map((t) => (
                <span key={t} className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-[11px] text-brand">{t}</span>
              ))}
            </div>
          )}
          <time dateTime={r.createdAt} className="block text-[11px] text-ink-muted">{formatReviewDate(r.createdAt)}</time>
        </article>
      ))}
      {list.length > PAGE_SIZE && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="w-full rounded-lg bg-white py-2 text-xs font-semibold text-brand hover:bg-surface-mid"
        >
          {showAll ? 'แสดงน้อยลง' : `ดูรีวิวทั้งหมด (${list.length})`}
        </button>
      )}
    </div>
  );
}

// client/src/components/BookmarksPage.jsx
// US14 / Task52: หน้ารายการร้านอาหารโปรด (รหัสร้านเก็บใน localStorage ของเครื่อง)

import React, { useState, useEffect, useMemo } from 'react';
import { Bookmark, HeartOff, ArrowLeft } from 'lucide-react';
import BookmarkShopCard from './BookmarkShopCard';
import { getShops } from '../services/api';

const TABS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'open', label: 'เปิดอยู่ตอนนี้' },
  { id: 'rating', label: 'คะแนนสูงสุด' }
];

export default function BookmarksPage({ bookmarkedIds, isBookmarked, onToggleBookmark, onSelectShop, onBack }) {
  const [allShops, setAllShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('all');

  // โหลดร้านทั้งหมด แล้วกรองเฉพาะร้านที่บันทึกไว้ (สถานะเปิด/ปิดอัปเดตสดทุก 6 วินาที)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getShops();
        if (!cancelled && res.success) setAllShops(res.data);
      } catch (err) {
        console.error('Failed to load bookmarked shops:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 6000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const saved = useMemo(
    () => allShops.filter((s) => bookmarkedIds.includes(s.id)),
    [allShops, bookmarkedIds]
  );
  const openCount = saved.filter((s) => s.isOpen).length;

  const visible = useMemo(() => {
    if (tab === 'open') return saved.filter((s) => s.isOpen);
    if (tab === 'rating') return [...saved].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return saved;
  }, [saved, tab]);

  return (
    <div className="space-y-4 pt-2">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าแรก
      </button>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          ร้านอาหารโปรด
          <Bookmark className="w-5 h-5 text-orange-800" fill="currentColor" />
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          Saved Bookmarks • <strong className="text-orange-800">{saved.length} ร้านที่บันทึกไว้</strong>
          {' '}• เก็บไว้ในเครื่องนี้เท่านั้น
        </p>
      </div>

      {saved.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist">
          {TABS.map((t) => {
            const count = t.id === 'all' ? saved.length : t.id === 'open' ? openCount : null;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
                  tab === t.id
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                }`}
              >
                {t.label}{count !== null ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">กำลังโหลดร้านโปรด...</p>
        </div>
      ) : saved.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-orange-200 space-y-3">
          <div className="w-12 h-12 bg-orange-50 text-orange-400 rounded-2xl flex items-center justify-center mx-auto">
            <HeartOff className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">ยังไม่มีร้านโปรด</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            กดรูปหัวใจที่การ์ดร้านอาหารเพื่อบันทึกร้านที่ชอบ แล้วจะมาแสดงที่หน้านี้
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-semibold hover:bg-orange-600 transition"
          >
            ค้นหาร้านอาหาร
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="p-6 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
          ตอนนี้ร้านโปรดของคุณยังไม่มีร้านที่เปิดอยู่
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((shop) => (
            <BookmarkShopCard
              key={shop.id}
              shop={shop}
              onSelect={onSelectShop}
              onToggleBookmark={() => onToggleBookmark(shop)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

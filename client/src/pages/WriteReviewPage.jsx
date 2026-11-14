// client/src/pages/WriteReviewPage.jsx
// เขียนรีวิวและให้คะแนนร้านอาหาร (Write Review)
// ยังไม่มี API รีวิวฝั่ง server จึงเก็บรีวิว/ฉบับร่างไว้ใน localStorage ของเครื่อง

import React, { useEffect, useState } from 'react';
import {
  Star, Check, Utensils, Zap, BellRing, PiggyBank, Soup, GraduationCap, BadgeCheck, Info, ArrowRight, Store, Home, ChevronRight,
} from 'lucide-react';
import { Spinner } from '../components/ui/Primitives';
import useLocalState from '../hooks/useLocalList';
import { getShopImage, canteenShort } from '../utils/shopDisplay';
import { navigate, routes } from '../router';

const TAGS = [
  { id: 'fresh', label: 'ไก่ต้มสดใหม่เนื้อฉ่ำ', Icon: Utensils },
  { id: 'fast', label: 'แถวเดินไว รับคิวเร็ว', Icon: Zap },
  { id: 'alert', label: 'แจ้งเตือนเมนูหมดตรงเป๊ะ', Icon: BellRing },
  { id: 'value', label: 'คุ้มค่า ให้เยอะ อิ่มท้อง', Icon: PiggyBank },
  { id: 'soup', label: 'น้ำซุปร้อนสดชื่น เติมได้', Icon: Soup },
  { id: 'student', label: 'ขวัญใจเด็ก มธ. รังสิต', Icon: GraduationCap },
];

const RATING_TEXT = {
  1: { emoji: '😞', label: 'ต้องปรับปรุง', sub: 'ควรปรับปรุง' },
  2: { emoji: '😕', label: 'พอใช้ได้', sub: 'พอใช้' },
  3: { emoji: '🙂', label: 'อร่อยดี กินได้เรื่อยๆ', sub: 'ดี' },
  4: { emoji: '😋', label: 'อร่อยมาก ต้องกลับมาอีก', sub: 'ดีมาก' },
  5: { emoji: '😍', label: 'อร่อยประทับใจสุดๆ • ร้านในดวงใจ!', sub: 'ยอดเยี่ยม' },
};

const MIN_LEN = 10;
const MAX_LEN = 500;

export default function WriteReviewPage({ shop, loading, customer, onSubmit, showToast }) {
  const [drafts, setDrafts] = useLocalState('hiwkhaw_review_drafts', {});
  const draft = (shop && drafts[shop.id]) || {};
  const [rating, setRating] = useState(draft.rating || 0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState(draft.tags || []);
  const [text, setText] = useState(draft.text || '');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!shop) return;
    const d = drafts[shop.id] || {};
    setRating(d.rating || 0);
    setTags(d.tags || []);
    setText(d.text || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  if (!shop) {
    return <div className="flex justify-center py-24">{loading ? <Spinner /> : <p className="text-sm text-ink-muted">ไม่พบร้านอาหารนี้</p>}</div>;
  }

  const shown = hover || rating;
  const textTooShort = text.trim().length < MIN_LEN;
  const canSubmit = rating > 0 && !textTooShort;

  const toggleTag = (label) => setTags((prev) => (prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]));

  const saveDraft = () => {
    setDrafts((prev) => ({ ...prev, [shop.id]: { rating, tags, text } }));
    showToast('บันทึกฉบับร่างไว้ในเครื่องแล้ว', 'success');
  };

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) {
      showToast(rating === 0 ? 'กรุณาให้คะแนนดาวก่อนส่งรีวิว' : `กรุณาเขียนรีวิวอย่างน้อย ${MIN_LEN} ตัวอักษร`, 'error');
      return;
    }
    onSubmit(shop.id, {
      id: `r-${Date.now()}`,
      rating,
      tags,
      text: text.trim(),
      author: customer?.name || 'นักศึกษา มธ.',
      createdAt: new Date().toISOString(),
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[shop.id];
      return next;
    });
    showToast('ส่งรีวิวเรียบร้อย ขอบคุณที่ช่วยแบ่งปัน!', 'success');
    navigate(routes.shop(shop.id));
  };

  const step = (n, title) => <p className="text-[11px] font-semibold text-brand">ขั้นตอนที่ {n} • {title}</p>;

  return (
    <div className="pb-28 lg:pb-12">
      <nav className="hidden bg-surface-low lg:block">
        <div className="mx-auto flex max-w-[1200px] items-center gap-1 px-8 py-2 text-xs text-ink-muted">
          <Home className="size-3.5" />
          <a href="#/" className="font-semibold text-ink hover:text-brand">หน้าแรก</a>
          <ChevronRight className="size-3" /> มธ. ศูนย์รังสิต <ChevronRight className="size-3" />
          <a href={`#${routes.shop(shop.id)}`} className="hover:text-brand">{shop.name}</a>
          <ChevronRight className="size-3" /> <span className="font-semibold text-brand">เขียนรีวิว</span>
        </div>
      </nav>

      <form onSubmit={submit} className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-4 pt-4 lg:grid-cols-[1fr_364px] lg:px-8 lg:pt-8">
        {/* Shop summary (แสดงก่อนบนมือถือ) */}
        <aside className="h-fit overflow-hidden rounded-xl bg-white shadow-card lg:sticky lg:top-24 lg:order-2">
          <div className="relative h-44">
            <img src={getShopImage(shop)} alt={shop.name} className="size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-ok-soft">ร้านแนะนำประจำย่าน</p>
                <h1 className="font-display text-lg font-bold leading-6 text-white">{shop.name}</h1>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-ink">
                <Star className="size-3.5 fill-brand-accent text-brand-accent" /> {Number(shop.rating).toFixed(1)}
              </span>
            </div>
          </div>
          <p className="flex items-start gap-2 p-4 text-xs text-ink-muted">
            <Store className="size-4 shrink-0 text-brand" /> {canteenShort(shop)} {shop.boothNumber} มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต
          </p>
        </aside>

        <div className="space-y-6 lg:order-1">
          {/* Step 1: rating */}
          <section className="space-y-4 rounded-xl bg-white p-5 shadow-card lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                {step(1, 'ความพึงพอใจ')}
                <h2 className="font-display text-lg font-bold text-ink">ให้คะแนนประสบการณ์ของคุณ "ความประทับใจโดยรวม"</h2>
              </div>
              <span className="shrink-0 rounded-full bg-brand-peach px-2 py-0.5 text-[11px] font-semibold text-brand-deep">จำเป็น</span>
            </div>
            <div className="flex flex-col items-center gap-4 rounded-xl bg-surface-low p-5 sm:flex-row sm:justify-between">
              <div className="flex gap-2" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="คะแนนดาว">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={rating === i}
                    aria-label={`${i} ดาว`}
                    onMouseEnter={() => setHover(i)}
                    onClick={() => setRating(i)}
                    className="transition active:scale-90"
                  >
                    <Star className={`size-9 lg:size-10 ${i <= shown ? 'fill-brand-accent text-brand-accent' : 'fill-surface-high text-surface-high'}`} />
                  </button>
                ))}
              </div>
              <div className="min-h-14 rounded-lg bg-white px-4 py-2 shadow-card">
                {shown ? (
                  <>
                    <p className="text-sm font-semibold text-ink">{RATING_TEXT[shown].emoji} {RATING_TEXT[shown].label}</p>
                    <p className="text-[11px] text-brand">{shown} จาก 5 คะแนน ({RATING_TEXT[shown].sub})</p>
                  </>
                ) : (
                  <p className={`py-2 text-sm ${touched ? 'text-danger' : 'text-ink-muted'}`}>แตะดาวเพื่อให้คะแนน</p>
                )}
              </div>
            </div>
          </section>

          {/* Step 2: tags */}
          <section className="space-y-3 rounded-xl bg-white p-5 shadow-card lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                {step(2, 'แท็กความประทับใจ')}
                <h2 className="font-display text-lg font-bold text-ink">จุดเด่นที่โดนใจคุณ</h2>
              </div>
              <span className="text-xs font-semibold text-ink-muted">เลือกได้หลายข้อ</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(({ id, label, Icon }) => {
                const on = tags.includes(label);
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleTag(label)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition ${
                      on ? 'bg-brand-accent text-white shadow-card' : 'bg-surface-low text-ink hover:bg-surface-mid'
                    }`}
                  >
                    <Icon className="size-3.5" /> {label} {on && <Check className="size-3.5" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 3: text */}
          <section className="space-y-3 rounded-xl bg-white p-5 shadow-card lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                {step(3, 'คำบรรยายความอร่อย')}
                <h2 className="font-display text-lg font-bold text-ink">เขียนรีวิวฉบับคุณ</h2>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-ok">
                <BadgeCheck className="size-4" /> ช่วยนักกินท่านอื่นตัดสินใจ
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
              onBlur={() => setTouched(true)}
              rows={5}
              maxLength={MAX_LEN}
              placeholder="เช่น ไก่เนื้อนุ่มต้มสดใหม่ฉ่ำมาก ให้ปริมาณข้าวและเนื้อเยอะคุ้มค่าราคานักศึกษา ช่วงเที่ยงคนเยอะแต่ตักรวดเร็วรอคิวไม่เกิน 5 นาที..."
              className="w-full resize-y rounded-lg bg-surface-low p-4 text-sm leading-6 text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-brand-accent/40"
            />
            <div className="flex items-center justify-between text-xs">
              <span className={`flex items-center gap-1 ${textTooShort && touched ? 'text-danger' : 'text-ink-muted'}`}>
                <Info className="size-3.5" /> ต้องมีอย่างน้อย {MIN_LEN} ตัวอักษร
              </span>
              <span className="text-ink-muted">{text.length} / {MAX_LEN}</span>
            </div>
          </section>

          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button type="button" onClick={saveDraft} className="rounded-lg px-4 py-3 text-sm font-semibold text-ink-muted hover:bg-surface-low">
              บันทึกเป็นแบบร่าง
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-accent px-6 py-3 text-sm font-semibold text-white shadow-hero transition hover:bg-brand-accent/90 disabled:opacity-60"
            >
              ส่งรีวิวเพื่อเป็นข้อมูลให้เพื่อนๆ นักศึกษา มธ. <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

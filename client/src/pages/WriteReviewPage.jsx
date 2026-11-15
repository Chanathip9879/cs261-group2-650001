// client/src/pages/WriteReviewPage.jsx
// เขียนรีวิวและให้คะแนนร้านอาหาร (Write Review)
// U9: ส่งรีวิวผ่าน API (Task37) — บังคับ username + ข้อความ, ดาวและแท็กไม่บังคับ
// ฉบับร่างยังเก็บใน localStorage ของเครื่อง

import React, { useEffect, useState } from 'react';
import {
  Star, Check, Utensils, Zap, BellRing, PiggyBank, Soup, GraduationCap, BadgeCheck, Info, ArrowRight, Store, Home, ChevronRight,
  User, AlertCircle, Loader2,
} from 'lucide-react';
import { Spinner } from '../components/ui/Primitives';
import useLocalState from '../hooks/useLocalList';
import { createShopReview } from '../services/api';
import { validateReview, USERNAME_MAX, COMMENT_MIN, COMMENT_MAX } from '../utils/reviewValidation';
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

export default function WriteReviewPage({ shop, loading, customer, onSubmitted, showToast }) {
  const [drafts, setDrafts] = useLocalState('hiwkhaw_review_drafts', {});
  const draft = (shop && drafts[shop.id]) || {};
  const [username, setUsername] = useState(draft.username || customer?.name || '');
  const [rating, setRating] = useState(draft.rating || 0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState(draft.tags || []);
  const [text, setText] = useState(draft.text || '');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!shop) return;
    const d = drafts[shop.id] || {};
    setUsername(d.username || customer?.name || '');
    setRating(d.rating || 0);
    setTags(d.tags || []);
    setText(d.text || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  if (!shop) {
    return <div className="flex justify-center py-24">{loading ? <Spinner /> : <p className="text-sm text-ink-muted">ไม่พบร้านอาหารนี้</p>}</div>;
  }

  const shown = hover || rating;

  const toggleTag = (label) => setTags((prev) => (prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]));
  const clearError = (field) => errors[field] && setErrors((prev) => ({ ...prev, [field]: undefined }));

  const saveDraft = () => {
    setDrafts((prev) => ({ ...prev, [shop.id]: { username, rating, tags, text } }));
    showToast('บันทึกฉบับร่างไว้ในเครื่องแล้ว', 'success');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setFormError('');

    // ตรวจข้อมูลก่อนส่ง (ห้ามว่าง / จำกัดความยาว)
    const found = validateReview({ username, comment: text });
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(found.username ? 'review-username' : 'review-comment')?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const review = await createShopReview(shop.id, {
        username: username.trim(),
        comment: text.trim(),
        rating: rating || undefined,
        tags,
      });
      // สำเร็จ -> ล้างฟอร์ม/ฉบับร่าง แล้วกลับไปหน้าร้านที่จะแสดงรีวิวใหม่บนสุด
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[shop.id];
        return next;
      });
      setText('');
      setRating(0);
      setTags([]);
      onSubmitted(shop.id, review);
      showToast('ส่งรีวิวเรียบร้อย ขอบคุณที่ช่วยแบ่งปัน!', 'success');
      navigate(routes.shop(shop.id));
    } catch (err) {
      // ไม่สำเร็จ -> แจ้งใต้ช่องที่ผิด หรือแจ้งรวม โดยไม่ลบข้อความที่ผู้ใช้พิมพ์ไว้
      const fe = err.fieldErrors || {};
      setErrors({ username: fe.username, comment: fe.comment });
      if (!fe.username && !fe.comment) setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
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
          {formError && (
            <p role="alert" className="flex items-center gap-2 rounded-xl bg-danger-soft/60 px-4 py-3 text-sm text-danger">
              <AlertCircle className="size-4 shrink-0" /> {formError}
            </p>
          )}

          {/* ชื่อผู้รีวิว (username) */}
          <section className="space-y-2 rounded-xl bg-white p-5 shadow-card lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <label htmlFor="review-username" className="font-display text-lg font-bold text-ink">ชื่อผู้รีวิว (username)</label>
              <span className="shrink-0 rounded-full bg-brand-peach px-2 py-0.5 text-[11px] font-semibold text-brand-deep">จำเป็น</span>
            </div>
            <div
              className={`flex items-center gap-3 rounded-lg bg-surface-low px-4 focus-within:ring-2 ${
                errors.username ? 'ring-2 ring-danger/40 focus-within:ring-danger/40' : 'focus-within:ring-brand-accent/40'
              }`}
            >
              <User className="size-4 text-ink-muted" />
              <input
                id="review-username"
                value={username}
                maxLength={USERNAME_MAX}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearError('username');
                }}
                placeholder="เช่น นักศึกษาวิศวะ ปี 2"
                aria-invalid={!!errors.username}
                aria-describedby="review-username-error"
                className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
              />
              <span className="text-[11px] text-ink-muted">{username.length}/{USERNAME_MAX}</span>
            </div>
            <p id="review-username-error" className="min-h-4 text-xs text-danger">{errors.username || ''}</p>
          </section>

          {/* Step 1: rating */}
          <section className="space-y-4 rounded-xl bg-white p-5 shadow-card lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                {step(1, 'ความพึงพอใจ')}
                <h2 className="font-display text-lg font-bold text-ink">ให้คะแนนประสบการณ์ของคุณ "ความประทับใจโดยรวม"</h2>
              </div>
              <span className="shrink-0 rounded-full bg-surface-mid px-2 py-0.5 text-[11px] font-semibold text-ink-muted">ไม่บังคับ</span>
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
                  <p className="py-2 text-sm text-ink-muted">แตะดาวเพื่อให้คะแนน</p>
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
                <label htmlFor="review-comment" className="font-display text-lg font-bold text-ink">เขียนรีวิวฉบับคุณ</label>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-ok">
                <BadgeCheck className="size-4" /> ช่วยนักกินท่านอื่นตัดสินใจ
              </span>
            </div>
            <textarea
              id="review-comment"
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, COMMENT_MAX));
                clearError('comment');
              }}
              rows={5}
              maxLength={COMMENT_MAX}
              aria-invalid={!!errors.comment}
              aria-describedby="review-comment-error"
              placeholder="เช่น ไก่เนื้อนุ่มต้มสดใหม่ฉ่ำมาก ให้ปริมาณข้าวและเนื้อเยอะคุ้มค่าราคานักศึกษา ช่วงเที่ยงคนเยอะแต่ตักรวดเร็วรอคิวไม่เกิน 5 นาที..."
              className={`w-full resize-y rounded-lg bg-surface-low p-4 text-sm leading-6 text-ink outline-none placeholder:text-ink-muted focus:ring-2 ${
                errors.comment ? 'ring-2 ring-danger/40 focus:ring-danger/40' : 'focus:ring-brand-accent/40'
              }`}
            />
            <div className="flex items-start justify-between gap-3 text-xs">
              {errors.comment ? (
                <p id="review-comment-error" className="flex items-center gap-1 text-danger">
                  <AlertCircle className="size-3.5" /> {errors.comment}
                </p>
              ) : (
                <p id="review-comment-error" className="flex items-center gap-1 text-ink-muted">
                  <Info className="size-3.5" /> ต้องมีอย่างน้อย {COMMENT_MIN} ตัวอักษร
                </p>
              )}
              <span className="shrink-0 text-ink-muted">{text.length} / {COMMENT_MAX}</span>
            </div>
          </section>

          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button type="button" onClick={saveDraft} className="rounded-lg px-4 py-3 text-sm font-semibold text-ink-muted hover:bg-surface-low">
              บันทึกเป็นแบบร่าง
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-accent px-6 py-3 text-sm font-semibold text-white shadow-hero transition hover:bg-brand-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? 'กำลังส่งรีวิว...' : 'ส่งรีวิวเพื่อเป็นข้อมูลให้เพื่อนๆ นักศึกษา มธ.'} {!submitting && <ArrowRight className="size-4" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

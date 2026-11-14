// client/src/pages/CustomerLoginPage.jsx
// เข้าสู่ระบบลูกค้า (Customer Login)
// หมายเหตุ: server ยังไม่มีระบบบัญชีลูกค้า/ส่ง SMS — หน้านี้จึงทำงานแบบโหมดทดลอง (เก็บโปรไฟล์ไว้ในเครื่อง)

import React, { useState } from 'react';
import { UtensilsCrossed, ArrowRight, ShieldCheck, Store, Archive, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import { navigate, routes } from '../router';
import loginHero from '../assets/images/login-hero.jpg';

export default function CustomerLoginPage({ onLogin, showToast }) {
  const [mode, setMode] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const digits = phone.replace(/\D/g, '');

  const finish = (name, contact) => {
    setBusy(true);
    setTimeout(() => {
      onLogin({ name, contact });
      showToast(`ยินดีต้อนรับ ${name}`, 'success');
      navigate(routes.home);
    }, 400);
  };

  const submitPhone = (e) => {
    e.preventDefault();
    setError('');
    if (!otpSent) {
      if (!/^0?\d{9}$/.test(digits)) return setError('กรุณากรอกเบอร์มือถือ 9-10 หลักให้ถูกต้อง');
      setOtpSent(true);
      return;
    }
    if (!/^\d{6}$/.test(otp)) return setError('กรุณากรอกรหัส OTP 6 หลัก');
    finish(`ผู้ใช้ ${digits.slice(-4)}`, digits);
  };

  const submitEmail = (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('รูปแบบอีเมลไม่ถูกต้อง');
    if (password.length < 6) return setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    finish(email.split('@')[0], email);
  };

  const social = (name) => showToast(`การเข้าสู่ระบบด้วย ${name} ยังไม่เปิดให้บริการ`, 'info');

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-0 py-0 sm:px-4 sm:py-10">
      <div className="grid w-full max-w-[1250px] overflow-hidden bg-white shadow-hero sm:rounded-2xl lg:grid-cols-[1.15fr_1fr]">
        {/* Brand / hero panel */}
        <div className="relative flex flex-col gap-6 bg-gradient-to-br from-surface-mid via-surface-low to-[#fbeef0] p-5 sm:p-8">
          <div className="pointer-events-none absolute right-10 top-10 size-40 rounded-full bg-ok-soft/40 blur-3xl" />
          <div className="relative flex items-start justify-between gap-3">
            <a href="#/" className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand-accent text-white">
                <UtensilsCrossed className="size-5" />
              </span>
              <span>
                <span className="block font-display text-xl font-semibold text-ink">
                  Hiwkaw <span className="text-brand-accent">(หิวข้าว)</span> มธ. รังสิต
                </span>
                <span className="block text-[11px] tracking-wide text-ink-muted">CAMPUS FOOD & STORE TRACKER</span>
              </span>
            </a>
            <span className="hidden items-center gap-1.5 rounded-full bg-ok-soft/70 px-3 py-1 text-xs font-medium text-ink sm:flex">
              <span className="size-2 rounded-full bg-ok" /> อัปเดตสถานะร้านค้าสด (Live)
            </span>
          </div>

          <div className="relative hidden overflow-hidden rounded-xl sm:block">
            <img src={loginHero} alt="อาหารในโรงอาหาร มธ. รังสิต" className="h-72 w-full object-cover lg:h-96" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-6 bottom-6 space-y-1">
              <span className="inline-block rounded-full bg-brand-accent px-2 py-0.5 text-[11px] text-white">🍲 Hiwkaw (หิวข้าว) มธ. รังสิต</span>
              <p className="font-display text-xl font-bold leading-snug text-white lg:text-2xl">
                แอปเช็กสถานะเปิด-ปิดร้าน เช็กเมนูหมด และพิกัดร้านค้าในมหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต
              </p>
              <p className="text-sm text-white/80">ค้นหาร้านเด็ดและเช็กความพร้อมก่อนเดิน ทั้งโรงอาหาร SC, กรีนแคนทีน ได้แบบเรียลไทม์</p>
            </div>
          </div>

          <div className="relative hidden grid-cols-3 gap-2 sm:grid">
            {[
              { Icon: Store, bg: 'bg-ok-soft/60 text-ok', t: 'รู้ทันทีร้านเปิด-ปิด', d: 'เช็กสถานะร้านใน มธ. สดๆ' },
              { Icon: Archive, bg: 'bg-brand-peach text-brand-accent', t: 'เช็กเมนูก่อนเดิน', d: 'ไม่เดินเก้อเมื่อของหมด' },
              { Icon: MapPin, bg: 'bg-surface-high text-ink', t: 'พิกัดล็อกชัดเจน', d: 'SC, กรีนแคนทีน' },
            ].map(({ Icon, bg, t, d }) => (
              <div key={t} className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-card">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${bg}`}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 text-xs">
                  <span className="block font-semibold text-ink">{t}</span>
                  <span className="block truncate text-ink-muted">{d}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center gap-5 p-5 sm:p-8">
          <div>
            <p className="text-xs font-semibold tracking-wide text-brand">ยินดีต้อนรับสู่ HIWKAW</p>
            <h1 className="font-display text-2xl font-bold text-ink">เข้าสู่ระบบลูกค้า</h1>
            <p className="text-sm text-ink-muted">เข้าถึงร้านโปรด เช็กเมนูสด และดูพิกัดร้านค้าใน มธ. รังสิต แบบเรียลไทม์</p>
          </div>

          <div className="grid grid-cols-2 rounded-lg bg-surface-mid p-1">
            {[
              ['phone', 'เบอร์โทรศัพท์ (OTP)'],
              ['email', 'อีเมล / รหัสผ่าน'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
                  setError('');
                }}
                className={`rounded-md py-2 text-xs font-semibold transition ${mode === id ? 'bg-white text-ink shadow-card' : 'text-ink-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'phone' ? (
            <form onSubmit={submitPhone} className="space-y-3">
              {!otpSent ? (
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-ink">หมายเลขโทรศัพท์มือถือ</span>
                  <div className="flex items-center gap-3 rounded-lg bg-surface-low px-3 focus-within:ring-2 focus-within:ring-brand-accent/40">
                    <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-ink">🇹🇭 +66</span>
                    <input
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="089 423 8890"
                      className="h-12 flex-1 bg-transparent text-base text-ink outline-none"
                    />
                  </div>
                  <span className="block text-xs text-ink-muted">รหัส OTP 6 หลักจะถูกส่งไปยัง SMS ของหมายเลขนี้</span>
                </label>
              ) : (
                <label className="block space-y-1.5">
                  <span className="flex items-center justify-between text-xs font-semibold text-ink">
                    รหัส OTP ที่ส่งไปยัง {digits}
                    <button type="button" onClick={() => setOtpSent(false)} className="flex items-center gap-1 text-brand">
                      <ArrowLeft className="size-3" /> แก้เบอร์
                    </button>
                  </span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="h-12 w-full rounded-lg bg-surface-low px-4 text-center text-xl tracking-[0.5em] text-ink outline-none focus:ring-2 focus:ring-brand-accent/40"
                  />
                  <span className="block rounded-md bg-brand-peach/50 px-2 py-1 text-[11px] text-brand-deep">
                    โหมดทดลอง: ระบบยังไม่ส่ง SMS จริง กรอกตัวเลข 6 หลักใดก็ได้
                  </span>
                </label>
              )}
              {error && <p className="text-xs text-danger">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent py-3 text-sm font-semibold text-white shadow-lift disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {otpSent ? 'ยืนยันรหัสและเข้าสู่ระบบ' : 'รับรหัสยืนยัน OTP'} <ArrowRight className="size-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={submitEmail} className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-ink">อีเมล</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@dome.tu.ac.th"
                  className="h-12 w-full rounded-lg bg-surface-low px-4 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-accent/40"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-ink">รหัสผ่าน</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="h-12 w-full rounded-lg bg-surface-low px-4 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-accent/40"
                />
              </label>
              {error && <p className="text-xs text-danger">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent py-3 text-sm font-semibold text-white shadow-lift disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                เข้าสู่ระบบ <ArrowRight className="size-4" />
              </button>
            </form>
          )}

          <p className="flex items-center justify-center gap-2 text-xs text-ink-muted">
            <ShieldCheck className="size-4 text-ok" /> เข้าสู่ระบบปลอดภัย ไม่ต้องจำรหัสผ่าน พร้อมการเข้ารหัสขั้นสูง
          </p>

          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span className="h-px flex-1 bg-surface-high" /> หรือเข้าสู่ระบบด่วน <span className="h-px flex-1 bg-surface-high" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => social('LINE')} className="rounded-lg bg-[#06c755] py-3 text-sm font-semibold text-white">LINE</button>
            <button type="button" onClick={() => social('Google')} className="rounded-lg bg-surface-mid py-3 text-sm font-semibold text-ink">Google</button>
            <button type="button" onClick={() => social('Apple')} className="rounded-lg bg-ink-navy py-3 text-sm font-semibold text-white">Apple</button>
          </div>

          <div className="space-y-1 text-center text-xs text-ink-muted">
            <a href="#/" className="font-semibold text-brand hover:underline">ใช้งานต่อโดยไม่เข้าสู่ระบบ</a>
            <p>เสิร์ฟความอร่อยด้วยใจ สไตล์ Hiwkaw • โครงการ CS261 มธ.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

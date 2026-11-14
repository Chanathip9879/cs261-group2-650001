// client/src/pages/MerchantLoginPage.jsx
// เข้าสู่ระบบร้านค้า (Merchant Secure Login) — U4
// Step 1 = เบอร์โทรศัพท์ร้าน (Merchant ID), Step 2 = รหัส PIN 4-6 หลัก แล้วเรียก /api/auth/login

import React, { useState } from 'react';
import {
  Store, Lock, ShieldCheck, ShieldPlus, Contact, KeyRound, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Zap,
} from 'lucide-react';
import { loginVendor, authStorage } from '../services/api';
import { navigate, routes } from '../router';
import merchantHero from '../assets/images/merchant-hero.jpg';

const DEMO = { phone: '0811111111', pin: '1111' };

export default function MerchantLoginPage({ onLoginSuccess }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const digits = phone.replace(/\D/g, '');
  const phoneValid = /^0\d{9}$/.test(digits);

  const doLogin = async (p, code) => {
    setBusy(true);
    setError('');
    try {
      const res = await loginVendor(p, code);
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      onLoginSuccess(res.user, res.message);
      navigate(routes.merchant);
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (step === 1) {
      if (!phoneValid) return setError('กรุณากรอกเบอร์โทรศัพท์ร้าน 10 หลัก (เช่น 0811111111)');
      setStep(2);
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) return setError('รหัส PIN ต้องเป็นตัวเลข 4-6 หลัก');
    doLogin(digits, pin);
  };

  const stepBox = (n, label, sub) => {
    const active = step === n;
    const done = step > n;
    return (
      <div className={`flex flex-1 items-center gap-3 rounded-lg p-3 ${active ? 'bg-surface-mid' : ''}`}>
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            active ? 'bg-brand-accent text-white' : done ? 'bg-ok text-white' : 'bg-surface-mid text-ink-muted'
          }`}
        >
          {done ? <CheckCircle2 className="size-4" /> : n}
        </span>
        <span className="text-xs">
          <span className={`block font-semibold ${active ? 'text-brand-accent' : 'text-ink-muted'}`}>{label}</span>
          <span className={`block ${active ? 'text-ink' : 'text-ink-muted'}`}>{sub}</span>
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface px-4 py-6 lg:py-14">
      <div className="mx-auto max-w-[1250px] space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-card">
          <a href="#/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-brand-accent text-white">
              <Store className="size-5" />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold text-ink">Hiwkaw Merchant Portal</span>
              <span className="block text-[11px] text-ink-muted">พอร์ทัลศูนย์บริหารร้านค้าพันธมิตร Hiwkaw Partner Hub</span>
            </span>
          </a>
          <div className="hidden flex-wrap gap-2 md:flex">
            <span className="flex items-center gap-1.5 rounded-full bg-surface-mid px-3 py-1 text-xs text-ink"><Lock className="size-3.5" /> 256-Bit SSL Encrypted</span>
            <span className="flex items-center gap-1.5 rounded-full bg-surface-mid px-3 py-1 text-xs text-ink"><ShieldCheck className="size-3.5 text-ok" /> Session Verified</span>
            <span className="flex items-center gap-1.5 rounded-full bg-ok-soft/40 px-3 py-1 text-xs text-ok"><ShieldPlus className="size-3.5" /> PDPA Compliance</span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[500px_1fr]">
          {/* Left: brand panel */}
          <aside className="overflow-hidden rounded-xl bg-white shadow-card">
            <div className="relative h-48 lg:h-64">
              <img src={merchantHero} alt="ครัวร้านค้าพาร์ทเนอร์" className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
              <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand">
                <span className="size-2 rounded-full bg-brand-accent" /> Merchant High-Security Portal (TU Rangsit Partner)
              </span>
            </div>
            <div className="space-y-4 p-6">
              <h1 className="font-display text-2xl font-bold text-ink">พอร์ทัลร้านค้าปลอดภัยสูง มธ. รังสิต</h1>
              <p className="text-sm leading-6 text-ink-muted">
                แพลตฟอร์มบริหารสถานะร้าน รายการอาหาร และเวลาเปิด-ปิด สำหรับร้านค้าในโรงอาหาร มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต
              </p>
              <div className="flex items-center gap-3 rounded-lg bg-surface-mid p-4">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-peach text-brand"><ShieldCheck className="size-4" /></span>
                <span className="text-xs">
                  <span className="block font-semibold text-ink-muted">การคุ้มครองข้อมูล</span>
                  <span className="block font-semibold text-ink">PDPA Compliance</span>
                </span>
              </div>
            </div>
          </aside>

          {/* Right: form */}
          <form onSubmit={submit} className="h-fit space-y-5 rounded-xl bg-white p-5 shadow-card sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row">
              {stepBox(1, 'Step 1', 'เบอร์โทรศัพท์ร้าน (Merchant ID)')}
              {stepBox(2, 'Step 2', 'ยืนยันรหัส PIN (2-Step Passcode)')}
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">ข้อมูลการเข้าถึงระบบร้านอาหาร</h2>
                <p className="text-xs text-ink-muted">
                  {step === 1 ? 'กรุณาระบุเบอร์โทรศัพท์ที่ลงทะเบียนกับร้าน เพื่อยืนยันตัวตน' : 'กรอกรหัส PIN 4-6 หลักของร้าน เพื่อเข้าสู่แดชบอร์ด'}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-peach px-2 py-0.5 text-[11px] font-semibold text-brand-deep">ขั้นตอนที่ {step}/2</span>
            </div>

            {step === 1 ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-ink">
                  เบอร์โทรศัพท์ร้าน (Merchant ID) <span className="text-danger">*จำเป็น</span>
                </span>
                <div className="flex items-center gap-3 rounded-lg border border-surface-high bg-surface px-4 focus-within:ring-2 focus-within:ring-brand-accent/40">
                  <Contact className="size-4 text-ink" />
                  <input
                    inputMode="tel"
                    autoComplete="username"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="h-12 flex-1 bg-transparent text-sm text-ink outline-none"
                    autoFocus
                  />
                  {phoneValid && <CheckCircle2 className="size-5 text-ok" />}
                </div>
                <span className="block text-[11px] text-ink-muted">ตัวอย่าง: 0811111111 (เบอร์ที่ลงทะเบียนกับร้าน)</span>
              </label>
            ) : (
              <label className="block space-y-1.5">
                <span className="flex items-center justify-between text-sm font-semibold text-ink">
                  <span>รหัส PIN ร้านค้า (Store PIN) <span className="text-danger">*จำเป็น</span></span>
                  <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-[11px] text-brand">
                    <ArrowLeft className="size-3" /> {digits}
                  </button>
                </span>
                <div className="flex items-center gap-3 rounded-lg border border-surface-high bg-surface px-4 focus-within:ring-2 focus-within:ring-brand-accent/40">
                  <KeyRound className="size-4 text-ink" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="current-password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="h-12 flex-1 bg-transparent text-sm tracking-widest text-ink outline-none"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPin((v) => !v)} aria-label={showPin ? 'ซ่อน PIN' : 'แสดง PIN'} className="text-ink-muted">
                    {showPin ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </label>
            )}

            <div className="flex items-start gap-3 rounded-lg bg-surface-low p-4">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-ok" />
              <span className="text-xs">
                <span className="block text-sm font-semibold text-ink">อุปกรณ์นี้จะจดจำการเข้าสู่ระบบ</span>
                <span className="block text-ink-muted">ไม่ต้องเข้าสู่ระบบใหม่บนแท็บเล็ตเครื่องเดิม กด “ออกจากระบบ” ในแดชบอร์ดเมื่อใช้เครื่องสาธารณะ</span>
              </span>
            </div>

            {error && <p className="rounded-lg bg-danger-soft/60 px-3 py-2 text-xs text-danger">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent py-3.5 text-sm font-semibold text-white shadow-lift transition hover:bg-brand-accent/90 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {step === 1 ? 'ตรวจสอบความปลอดภัย & ขั้นตอน 2FA' : 'เข้าสู่แดชบอร์ดร้านค้า'} <ArrowRight className="size-4" />
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => doLogin(DEMO.phone, DEMO.pin)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-surface-high py-2.5 text-xs font-semibold text-ink-muted hover:bg-surface-low"
            >
              <Zap className="size-3.5 text-brand-accent" /> ทดลองใช้ด้วยบัญชีตัวอย่าง (One-Click Demo)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

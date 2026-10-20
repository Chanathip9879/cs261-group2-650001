// client/src/components/VendorLoginModal.jsx
// U4: Log in จัดการร้านอาหาร (เข้าสู่ระบบด้วยเบอร์โทรศัพท์ + รหัส PIN 4-6 หลัก)

import React, { useState } from 'react';
import { X, Lock, Phone, Eye, EyeOff, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { loginVendor, authStorage } from '../services/api';

export default function VendorLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!phone || !pin) {
      setErrorMessage('กรุณากรอกทั้งเบอร์โทรศัพท์และรหัส PIN');
      return;
    }

    try {
      setIsLoading(true);
      const res = await loginVendor(phone, pin);
      if (res.success) {
        authStorage.setToken(res.token);
        authStorage.setUser(res.user);
        onLoginSuccess(res.user, res.message);
        onClose();
      }
    } catch (err) {
      setErrorMessage(err.message || 'เข้าสู่ระบบไม่สำเร็จ ตรวจสอบเบอร์และ PIN');
    } finally {
      setIsLoading(false);
    }
  };

  // ปุ่มกดเพื่อทดสอบในห้อง Lab หรือตอนนำเสนอ (Demo Accounts)
  const setDemoAccount = (demoPhone, demoPin) => {
    setPhone(demoPhone);
    setPin(demoPin);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">เข้าสู่ระบบจัดการร้าน</h3>
              <p className="text-xs text-slate-500">สำหรับแม่ค้า & ผู้ดูแลระบบ มธ.รังสิต</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="ปิด"
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              เบอร์โทรศัพท์มือถือที่ลงทะเบียน
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812345678"
                maxLength={12}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รหัส PIN (4 - 6 หลัก)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                maxLength={6}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl text-sm transition shadow-md shadow-emerald-600/20 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>เข้าสู่ระบบ</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo One-Click Fill (สำหรับนำเสนอ Sprint Demo) */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            บัญชีทดสอบสำหรับ Demo (คลิกเพื่อกรอกอัตโนมัติ)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoAccount('0811111111', '1111')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-left transition"
            >
              <div className="font-bold truncate">ร้านป้าณี (กรีน)</div>
              <div className="text-[10px] text-emerald-700">081-111-1111 | 1111</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('0866666666', '6666')}
              className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-sky-900 text-left transition"
            >
              <div className="font-bold truncate">ลุงหนุ่มไก่ตอน (วิทย์)</div>
              <div className="text-[10px] text-sky-700">086-666-6666 | 6666</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

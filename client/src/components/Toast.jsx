// client/src/components/Toast.jsx
import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const bgStyles = {
    success: 'bg-emerald-600 text-white shadow-emerald-500/20',
    error: 'bg-rose-600 text-white shadow-rose-500/20',
    info: 'bg-slate-800 text-white shadow-slate-900/20'
  }[type] || 'bg-slate-800 text-white';

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />,
    error: <AlertCircle className="w-5 h-5 flex-shrink-0 text-white" />,
    info: <Info className="w-5 h-5 flex-shrink-0 text-white" />
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md ${bgStyles}`}>
        <div className="flex items-center gap-3 min-w-0">
          {icons[type]}
          <p className="text-sm font-medium leading-snug truncate">{message}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="ปิดการแจ้งเตือน"
          className="p-1 rounded-full hover:bg-white/20 transition active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

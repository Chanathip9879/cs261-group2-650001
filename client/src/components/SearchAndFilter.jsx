// client/src/components/SearchAndFilter.jsx
// U2: ระบบค้นหาร้านอาหาร (ค้นหาชื่อร้าน ชื่อเมนู ฟิลเตอร์โรงอาหาร และหมวดหมู่)

import React from 'react';
import { Search, X, Check, Utensils, Sparkles, Filter } from 'lucide-react';

export default function SearchAndFilter({
  searchQuery,
  onSearchChange,
  selectedCanteen,
  onCanteenChange,
  selectedCategory,
  onCategoryChange,
  onlyOpen,
  onToggleOnlyOpen,
  categories = [],
  canteens = [],
  totalFound = 0
}) {
  return (
    <div className="space-y-3 pt-3">
      {/* 1. ช่องค้นหาหลัก (ชื่อร้าน / ชื่อเมนูอาหาร) */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหาชื่อร้าน หรือชื่อเมนู (เช่น กะเพรา, ข้าวมันไก่, ชาไทย)..."
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            aria-label="ล้างคำค้นหา"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4 p-0.5 rounded-full bg-slate-100" />
          </button>
        )}
      </div>

      {/* 2. แท็บเลือกโรงอาหาร (กรีนแคนทีน vs คณะวิทยาศาสตร์) */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 text-xs font-semibold">
        <button
          onClick={() => onCanteenChange('all')}
          className={`flex-1 py-2 rounded-xl transition text-center ${
            selectedCanteen === 'all'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => onCanteenChange('green')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            selectedCanteen === 'green'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-emerald-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
          กรีนแคนทีน
        </button>
        <button
          onClick={() => onCanteenChange('sci')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            selectedCanteen === 'sci'
              ? 'bg-sky-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-sky-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-300"></span>
          คณะวิทยาศาสตร์
        </button>
      </div>

      {/* 3. แถวควบคุมย่อย: ตัวกรองเฉพาะร้านที่เปิดอยู่ + ผลลัพธ์ที่พบ */}
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          onClick={onToggleOnlyOpen}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
            onlyOpen
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs font-semibold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${onlyOpen ? 'bg-emerald-500 animate-live' : 'bg-slate-300'}`}></span>
          <span>เฉพาะร้านที่เปิดอยู่</span>
          {onlyOpen && <Check className="w-3.5 h-3.5 ml-0.5 text-emerald-600" />}
        </button>

        <span className="text-xs text-slate-500">
          พบ <strong className="text-slate-800 font-semibold">{totalFound}</strong> ร้าน
        </span>
      </div>

      {/* 4. รายการหมวดหมู่อาหาร (Horizontal Swipeable Chips) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

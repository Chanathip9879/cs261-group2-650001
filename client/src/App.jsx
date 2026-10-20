// client/src/App.jsx
// Main Application Component - HiwKhaw TU Rangsit (หิวข้าว มธ. รังสิต)
// Covers Sprint 1: U1, U2, U3, U4, U5

import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SearchAndFilter from './components/SearchAndFilter';
import ShopCard from './components/ShopCard';
import ShopDetailModal from './components/ShopDetailModal';
import VendorLoginModal from './components/VendorLoginModal';
import VendorDashboard from './components/VendorDashboard';
import Toast from './components/Toast';
import {
  getShops,
  getCanteens,
  getCategories,
  getMe,
  authStorage
} from './services/api';
import { Store, Utensils, RefreshCw, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function App() {
  // State ข้อมูลหลัก
  const [shops, setShops] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ total: 0, openCount: 0, closedCount: 0, filteredCount: 0 });

  // State ฟิลเตอร์และการค้นหา (U2)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCanteen, setSelectedCanteen] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [onlyOpen, setOnlyOpen] = useState(false);

  // State การทำงานและ Modals
  const [selectedShop, setSelectedShop] = useState(null);
  const [currentUser, setCurrentUser] = useState(authStorage.getUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  // State UI
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // ดึงข้อมูลร้านอาหารตามเงื่อนไขฟิลเตอร์ (U1, U2, U3)
  const loadShops = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsRefreshing(true);
      const res = await getShops({
        q: searchQuery,
        canteen: selectedCanteen,
        category: selectedCategory,
        status: onlyOpen ? 'open' : 'all'
      });
      if (res.success) {
        setShops(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      console.error('Failed to load shops:', err);
      if (!isSilent) showToast('ไม่สามารถดึงข้อมูลร้านได้ กรุณาลองใหม่', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedCanteen, selectedCategory, onlyOpen]);

  // ดึงข้อมูลภาพรวมโรงอาหารและหมวดหมู่
  const loadMeta = async () => {
    try {
      const [canteensRes, categoriesRes] = await Promise.all([
        getCanteens(),
        getCategories()
      ]);
      if (canteensRes.success) setCanteens(canteensRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  // ตรวจสอบเซสชันผู้ใช้ (U4)
  useEffect(() => {
    const verifyUser = async () => {
      const token = authStorage.getToken();
      if (token) {
        try {
          const res = await getMe();
          if (res && res.user) {
            setCurrentUser(res.user);
            authStorage.setUser(res.user);
          }
        } catch {
          authStorage.clear();
          setCurrentUser(null);
        }
      }
    };
    verifyUser();
    loadMeta();
  }, []);

  // โหลดข้อมูลร้านเมื่อฟิลเตอร์เปลี่ยน
  useEffect(() => {
    loadShops();
  }, [loadShops]);

  // U1: Polling สถานะแบบ Real-time ทุก 6 วินาที (ให้เหมือน Grab)
  useEffect(() => {
    const interval = setInterval(() => {
      loadShops(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [loadShops]);

  // ผู้ใช้กด Refresh เอง
  const handleManualRefresh = () => {
    loadShops();
    loadMeta();
    showToast('อัปเดตสถานะร้านเรียบร้อยแล้ว', 'success');
  };

  // แม่ค้าล็อกอินสำเร็จ (U4)
  const handleLoginSuccess = (user, message) => {
    setCurrentUser(user);
    showToast(message || 'เข้าสู่ระบบสำเร็จ', 'success');
    setIsDashboardOpen(true);
    loadShops();
  };

  // ออกจากระบบ
  const handleLogout = () => {
    authStorage.clear();
    setCurrentUser(null);
    setIsDashboardOpen(false);
    showToast('ออกจากระบบเรียบร้อย', 'info');
  };

  // เมื่อแม่ค้าเปลี่ยนสถานะร้าน (U5)
  const handleStatusUpdated = (updatedShop, message) => {
    // อัปเดตใน state ทันที
    setShops(prev => prev.map(s => (s.id === updatedShop.id ? updatedShop : s)));
    if (selectedShop && selectedShop.id === updatedShop.id) {
      setSelectedShop(updatedShop);
    }
    showToast(message || 'อัปเดตสถานะร้านเรียบร้อย', 'success');
    loadMeta();
  };

  // ค้นหาร้านของแม่ค้าที่กำลังล็อกอินอยู่
  const currentLoggedInShop = currentUser && currentUser.shopId
    ? shops.find(s => s.id === currentUser.shopId)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans pb-safe">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 1. Header บาร์ด้านบน */}
      <Header
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        activeShopStatus={currentLoggedInShop ? currentLoggedInShop.isOpen : false}
      />

      {/* Container หลัก (Mobile First Container) */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pb-12 space-y-4">
        {/* Banner สรุปสถานะ 2 โรงอาหารหลัก (กรีนแคนทีน & คณะวิทย์) */}
        <section className="pt-2">
          <div className="grid grid-cols-2 gap-2.5">
            {/* กรีนแคนทีน Card */}
            <div
              onClick={() => setSelectedCanteen(selectedCanteen === 'green' ? 'all' : 'green')}
              role="button"
              tabIndex={0}
              className={`p-3.5 rounded-2xl border transition cursor-pointer active:scale-98 ${
                selectedCanteen === 'green'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200/90 hover:border-emerald-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  กรีนแคนทีน
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live"></span>
              </div>
              <h4 className="text-xs font-semibold text-slate-800 mt-2 truncate">Green Canteen</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                เปิด{' '}
                <strong className="text-emerald-700 font-bold">
                  {canteens.find(c => c.id === 'green')?.openShops ?? 4}
                </strong>
                /{canteens.find(c => c.id === 'green')?.totalShops ?? 5} ร้าน
              </p>
            </div>

            {/* คณะวิทยาศาสตร์ Card */}
            <div
              onClick={() => setSelectedCanteen(selectedCanteen === 'sci' ? 'all' : 'sci')}
              role="button"
              tabIndex={0}
              className={`p-3.5 rounded-2xl border transition cursor-pointer active:scale-98 ${
                selectedCanteen === 'sci'
                  ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-500/20'
                  : 'bg-white border-slate-200/90 hover:border-sky-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                  คณะวิทยาศาสตร์
                </span>
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-live"></span>
              </div>
              <h4 className="text-xs font-semibold text-slate-800 mt-2 truncate">Science Canteen</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                เปิด{' '}
                <strong className="text-sky-700 font-bold">
                  {canteens.find(c => c.id === 'sci')?.openShops ?? 4}
                </strong>
                /{canteens.find(c => c.id === 'sci')?.totalShops ?? 5} ร้าน
              </p>
            </div>
          </div>
        </section>

        {/* 2. U2: ระบบค้นหาและตัวกรอง */}
        <section>
          <SearchAndFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCanteen={selectedCanteen}
            onCanteenChange={setSelectedCanteen}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onlyOpen={onlyOpen}
            onToggleOnlyOpen={() => setOnlyOpen(!onlyOpen)}
            categories={categories}
            canteens={canteens}
            totalFound={meta.filteredCount}
          />
        </section>

        {/* 3. U1 & U3: รายการร้านอาหาร */}
        <section className="space-y-3 pt-1">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs">กำลังโหลดสถานะร้านอาหาร...</p>
            </div>
          ) : shops.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Utensils className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">ไม่พบร้านอาหารที่ตรงกับเงื่อนไข</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                ลองเปลี่ยนคำค้นหา หรือกดเคลียร์ตัวกรองเพื่อดูร้านอาหารทั้งหมดใน มธ. รังสิต
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCanteen('all');
                  setSelectedCategory('all');
                  setOnlyOpen(false);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shops.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  onSelect={(s) => setSelectedShop(s)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer ประจำเว็บ */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-2xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-slate-600">
            HiwKhaw (หิวข้าว) • โครงการวิชา CS261 มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต
          </p>
          <p className="text-[11px]">
            โรงอาหารกรีนแคนทีน & โรงอาหารคณะวิทยาศาสตร์ • Sprint 1 Release
          </p>
        </div>
      </footer>

      {/* U3: Modal แสดงรายละเอียดร้าน */}
      {selectedShop && (
        <ShopDetailModal
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
        />
      )}

      {/* U4: Modal เข้าสู่ระบบแม่ค้า */}
      <VendorLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* U5: Dashboard จัดการเปิด/ปิดร้านของแม่ค้า */}
      {isDashboardOpen && currentLoggedInShop && (
        <VendorDashboard
          currentUser={currentUser}
          currentShop={currentLoggedInShop}
          onStatusUpdated={handleStatusUpdated}
          onLogout={handleLogout}
          onClose={() => setIsDashboardOpen(false)}
        />
      )}
    </div>
  );
}

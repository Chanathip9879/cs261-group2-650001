// client/src/App.jsx
// Main Application Component - HiwKhaw TU Rangsit (หิวข้าว มธ. รังสิต)
// UI ตามดีไซน์ Figma "Group2-CS261" — ใช้ hash router (ดู router.js)
//   #/                 หน้าแรก & ค้นหา (+ สถานะค้นหาไม่พบ)
//   #/shop/:id         รายละเอียดร้าน & เมนู
//   #/shop/:id/review  เขียนรีวิว
//   #/bookmarks        ร้านอาหารโปรด
//   #/login            เข้าสู่ระบบลูกค้า
//   #/merchant/login   เข้าสู่ระบบร้านค้า
//   #/merchant         แดชบอร์ดจัดการร้าน
//   #/merchant/hours   ตั้งเวลาเปิด-ปิด

import React, { useCallback, useEffect, useRef, useState } from 'react';
import SiteHeader from './components/layout/SiteHeader';
import SiteFooter from './components/layout/SiteFooter';
import MobileNav from './components/layout/MobileNav';
import MerchantLayout from './components/layout/MerchantLayout';
import Toast from './components/Toast';
import HomePage from './pages/HomePage';
import ShopDetailPage from './pages/ShopDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import WriteReviewPage from './pages/WriteReviewPage';
import CustomerLoginPage from './pages/CustomerLoginPage';
import MerchantLoginPage from './pages/MerchantLoginPage';
import MerchantDashboardPage from './pages/MerchantDashboardPage';
import StoreHoursPage from './pages/StoreHoursPage';
import useBookmarks from './hooks/useBookmarks';
import useLocalState from './hooks/useLocalList';
import { getShops, getCanteens, getCategories, getMe, authStorage, updateShopStatus } from './services/api';
import { useHashPath, matchRoute, navigate, routes } from './router';

const POLL_MS = 6000; // U1: อัปเดตสถานะร้านแบบ real-time ทุก 6 วินาที

export default function App() {
  const path = useHashPath();

  // ข้อมูลหลัก
  const [allShops, setAllShops] = useState([]);
  const [shopsLoaded, setShopsLoaded] = useState(false);
  const [canteens, setCanteens] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ผู้ใช้
  const [vendor, setVendor] = useState(authStorage.getUser());
  const [adminShopId, setAdminShopId] = useState(null);
  const [customer, setCustomer] = useLocalState('hiwkhaw_customer', null);
  const [reviews, setReviews] = useLocalState('hiwkhaw_reviews', {});
  const { bookmarkedIds, isBookmarked, toggleBookmark } = useBookmarks();

  // UI
  const [toast, setToast] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const loadShops = useCallback(async () => {
    try {
      const res = await getShops();
      if (res.success) setAllShops(res.data);
    } catch (err) {
      console.error('Failed to load shops:', err);
    } finally {
      setShopsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadShops();
    Promise.all([getCanteens(), getCategories()])
      .then(([c, k]) => {
        if (c.success) setCanteens(c.data);
        if (k.success) setCategories(k.data);
      })
      .catch((err) => console.error('Failed to load metadata:', err));

    // U4: ตรวจสอบเซสชันร้านค้าที่ค้างไว้
    if (authStorage.getToken()) {
      getMe()
        .then((res) => {
          if (res?.user) {
            setVendor(res.user);
            authStorage.setUser(res.user);
          } else {
            setVendor(null);
          }
        })
        .catch(() => {
          authStorage.clear();
          setVendor(null);
        });
    }
  }, [loadShops]);

  useEffect(() => {
    const t = setInterval(loadShops, POLL_MS);
    return () => clearInterval(t);
  }, [loadShops]);

  const replaceShop = useCallback((updated) => {
    setAllShops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const handleToggleBookmark = (shop) => {
    const saved = toggleBookmark(shop.id);
    showToast(saved ? `บันทึก "${shop.name}" เป็นร้านโปรดแล้ว` : `เอา "${shop.name}" ออกจากร้านโปรดแล้ว`, saved ? 'success' : 'info');
  };

  const handleVendorLogin = (user, message) => {
    setVendor(user);
    showToast(message || 'เข้าสู่ระบบสำเร็จ', 'success');
    loadShops();
  };

  const handleVendorLogout = () => {
    authStorage.clear();
    setVendor(null);
    showToast('ออกจากระบบร้านค้าเรียบร้อย', 'info');
    navigate(routes.home);
  };

  const handleReviewSubmit = (shopId, review) => {
    setReviews((prev) => ({ ...prev, [shopId]: [review, ...(prev[shopId] || [])] }));
  };

  // ===== Merchant routes =====
  const isMerchantRoute = path === routes.merchant || path === routes.merchantHours || path.startsWith(`${routes.merchant}?`);
  const merchantShop = vendor
    ? allShops.find((s) => s.id === (vendor.shopId || adminShopId)) || (vendor.role === 'admin' ? allShops[0] : null)
    : null;

  // U5: เปลี่ยนสถานะร้าน (ใช้ทั้ง sidebar และการ์ดสถานะ)
  const setShopStatus = async (isOpen, note) => {
    if (!merchantShop) return;
    setStatusBusy(true);
    try {
      const statusNote = typeof note === 'string' && note.trim()
        ? note.trim()
        : isOpen === merchantShop.isOpen ? merchantShop.statusNote : isOpen ? 'เปิดให้บริการตามปกติ' : 'ปิดให้บริการชั่วคราว';
      const res = await updateShopStatus(merchantShop.id, isOpen, statusNote);
      replaceShop(res.data);
      showToast(res.message || 'อัปเดตสถานะร้านเรียบร้อย', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setStatusBusy(false);
    }
  };

  const toastEl = toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />;

  if (path === routes.login) {
    return (
      <>
        {toastEl}
        <CustomerLoginPage onLogin={setCustomer} showToast={showToast} />
      </>
    );
  }

  if (path === routes.merchantLogin || (isMerchantRoute && !vendor)) {
    return (
      <>
        {toastEl}
        <MerchantLoginPage onLoginSuccess={handleVendorLogin} />
      </>
    );
  }

  if (isMerchantRoute) {
    const page = path === routes.merchantHours ? (
      <StoreHoursPage key={merchantShop?.id} shop={merchantShop} showToast={showToast} />
    ) : (
      <MerchantDashboardPage
        shop={merchantShop}
        onSetStatus={setShopStatus}
        statusBusy={statusBusy}
        onShopUpdated={replaceShop}
        showToast={showToast}
      />
    );
    return (
      <>
        {toastEl}
        <MerchantLayout
          path={path.split('?')[0]}
          user={vendor}
          shop={merchantShop}
          shops={allShops}
          onSelectShop={setAdminShopId}
          onToggleOpen={(next) => setShopStatus(next)}
          statusBusy={statusBusy}
          onLogout={handleVendorLogout}
          subtitle={path === routes.merchantHours ? 'ตั้งเวลาเปิด-ปิดร้าน (Store Hours)' : 'Store Dashboard'}
        >
          {!shopsLoaded ? <p className="py-24 text-center text-sm text-ink-muted">กำลังโหลดข้อมูลร้าน...</p> : page}
        </MerchantLayout>
      </>
    );
  }

  // ===== Customer routes =====
  const reviewMatch = matchRoute(path, '/shop/:id/review');
  const shopMatch = matchRoute(path, '/shop/:id');
  const findShop = (id) => allShops.find((s) => s.id === id) || null;

  let page;
  let headerProps = {};
  if (reviewMatch) {
    page = (
      <WriteReviewPage
        key={reviewMatch.id}
        shop={findShop(reviewMatch.id)}
        loading={!shopsLoaded}
        customer={customer}
        onSubmit={handleReviewSubmit}
        showToast={showToast}
      />
    );
    headerProps = { mobileTitle: 'เขียนรีวิว', mobileSubtitle: 'Hiwkaw • หิวข้าว', showBack: true };
  } else if (shopMatch) {
    const shop = findShop(shopMatch.id);
    page = (
      <ShopDetailPage
        shop={shop}
        loading={!shopsLoaded}
        canteens={canteens}
        isBookmarked={shop ? isBookmarked(shop.id) : false}
        onToggleBookmark={() => shop && handleToggleBookmark(shop)}
        reviews={reviews[shopMatch.id]}
        showToast={showToast}
      />
    );
    headerProps = { mobileTitle: 'Restaurant Detail', mobileSubtitle: 'Hiwkaw • หิวข้าว', showBack: true };
  } else if (path === routes.bookmarks) {
    page = (
      <FavoritesPage
        allShops={allShops}
        loading={!shopsLoaded}
        bookmarkedIds={bookmarkedIds}
        onToggleBookmark={handleToggleBookmark}
      />
    );
    headerProps = { mobileSubtitle: 'ร้านอาหารโปรด' };
  } else {
    page = (
      <HomePage
        allShops={allShops}
        canteens={canteens}
        categories={categories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isBookmarked={isBookmarked}
        onToggleBookmark={handleToggleBookmark}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {toastEl}
      <SiteHeader
        path={path}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        customer={customer}
        onCustomerLogout={() => {
          setCustomer(null);
          showToast('ออกจากระบบแล้ว', 'info');
        }}
        bookmarkCount={bookmarkedIds.length}
        {...headerProps}
      />
      <main className="flex-1">{page}</main>
      <SiteFooter />
      <MobileNav path={path} />
    </div>
  );
}

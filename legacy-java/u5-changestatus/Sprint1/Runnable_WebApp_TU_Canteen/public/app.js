/**
 * TU Canteen Mobile Web Application
 * Client-Side Application Logic (CS261 Sprint 1)
 */

// Application State
const state = {
  restaurants: [],
  canteenFilter: 'ALL',
  categoryFilter: 'ทั้งหมด',
  onlyOpen: false,
  searchQuery: '',
  activeRestaurant: null,
  merchant: null // { ownerId, restaurantId, restaurantName, phone, token }
};

// DOM Elements
const el = {
  restaurantList: document.getElementById('restaurantList'),
  resultsSummaryText: document.getElementById('resultsSummaryText'),
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  refreshDataBtn: document.getElementById('refreshDataBtn'),
  onlyOpenFilter: document.getElementById('onlyOpenFilter'),
  canteenTabs: document.querySelectorAll('.canteen-tab'),
  categoryChips: document.querySelectorAll('.category-chip'),
  navItems: document.querySelectorAll('.nav-item'),
  views: document.querySelectorAll('.view-panel'),
  // Modal
  restaurantModal: document.getElementById('restaurantModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  modalShopImg: document.getElementById('modalShopImg'),
  modalShopName: document.getElementById('modalShopName'),
  modalShopCanteen: document.getElementById('modalShopCanteen'),
  modalShopHours: document.getElementById('modalShopHours'),
  modalShopStatusBadge: document.getElementById('modalShopStatusBadge'),
  modalProductList: document.getElementById('modalProductList'),
  modalReviewList: document.getElementById('modalReviewList'),
  modalReviewAvg: document.getElementById('modalReviewAvg'),
  addReviewForm: document.getElementById('addReviewForm'),
  // Merchant
  merchantLoginBox: document.getElementById('merchantLoginBox'),
  merchantDashboardBox: document.getElementById('merchantDashboardBox'),
  merchantLoginForm: document.getElementById('merchantLoginForm'),
  mPhone: document.getElementById('mPhone'),
  mPin: document.getElementById('mPin'),
  loginMsgAlert: document.getElementById('loginMsgAlert'),
  dashShopName: document.getElementById('dashShopName'),
  dashCanteenInfo: document.getElementById('dashCanteenInfo'),
  dashStatusDot: document.getElementById('dashStatusDot'),
  dashStatusText: document.getElementById('dashStatusText'),
  dashToggleSwitch: document.getElementById('dashToggleSwitch'),
  dashOpenTime: document.getElementById('dashOpenTime'),
  dashCloseTime: document.getElementById('dashCloseTime'),
  saveHoursBtn: document.getElementById('saveHoursBtn'),
  dashMenuList: document.getElementById('dashMenuList'),
  dashAddMenuBtn: document.getElementById('dashAddMenuBtn'),
  mLogoutBtn: document.getElementById('mLogoutBtn'),
  // Add product modal
  addProductModal: document.getElementById('addProductModal'),
  closeAddProductBtn: document.getElementById('closeAddProductBtn'),
  newProductForm: document.getElementById('newProductForm'),
  newProdName: document.getElementById('newProdName'),
  newProdPrice: document.getElementById('newProdPrice'),
  // Admin form
  adminAddShopForm: document.getElementById('adminAddShopForm'),
  // Toast
  globalToast: document.getElementById('globalToast'),
  toastIcon: document.getElementById('toastIcon'),
  toastText: document.getElementById('toastText')
};

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  checkCachedMerchantSession();
  fetchRestaurants();
});

function initEventListeners() {
  // Navigation Tabs
  el.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.getAttribute('data-view');
      switchView(targetView, item);
    });
  });

  // Direct Canteen Buttons in Canteen View
  document.querySelectorAll('.filter-canteen-direct-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const canteen = btn.getAttribute('data-canteen');
      state.canteenFilter = canteen;
      updateCanteenTabsUI(canteen);
      // Switch back to explore
      const exploreTab = document.querySelector('.nav-item[data-view="viewExplore"]');
      switchView('viewExplore', exploreTab);
      fetchRestaurants();
    });
  });

  // Search Input
  el.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    el.clearSearchBtn.classList.toggle('hidden', !state.searchQuery);
    fetchRestaurants();
  });

  el.clearSearchBtn.addEventListener('click', () => {
    el.searchInput.value = '';
    state.searchQuery = '';
    el.clearSearchBtn.classList.add('hidden');
    fetchRestaurants();
  });

  el.refreshDataBtn.addEventListener('click', () => {
    showToast('กำลังอัปเดตข้อมูลล่าสุด...', '🔄');
    fetchRestaurants();
  });

  // Canteen Tabs (Green Canteen vs Science Faculty)
  el.canteenTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const canteen = tab.getAttribute('data-canteen');
      state.canteenFilter = canteen;
      updateCanteenTabsUI(canteen);
      fetchRestaurants();
    });
  });

  // Category Filter Chips
  el.categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      el.categoryChips.forEach(c => {
        c.className = 'category-chip flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200';
      });
      chip.className = 'category-chip active flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-600 text-white shadow-xs';
      state.categoryFilter = chip.getAttribute('data-cat');
      fetchRestaurants();
    });
  });

  // Only Open Filter
  el.onlyOpenFilter.addEventListener('change', (e) => {
    state.onlyOpen = e.target.checked;
    fetchRestaurants();
  });

  // Modal Close
  el.closeModalBtn.addEventListener('click', closeModal);
  el.restaurantModal.addEventListener('click', (e) => {
    if (e.target === el.restaurantModal) closeModal();
  });

  // Add Review Form (No Login)
  el.addReviewForm.addEventListener('submit', handleAddReview);

  // Merchant Login Form
  el.merchantLoginForm.addEventListener('submit', handleMerchantLogin);
  el.mLogoutBtn.addEventListener('click', handleMerchantLogout);

  // Merchant Toggle Open/Close Status (Task 22)
  el.dashToggleSwitch.addEventListener('change', handleMerchantStatusToggle);

  // Merchant Save Operating Hours
  el.saveHoursBtn.addEventListener('click', handleSaveOperatingHours);

  // Merchant Add Product Modal
  el.dashAddMenuBtn.addEventListener('click', () => el.addProductModal.classList.remove('hidden'));
  el.closeAddProductBtn.addEventListener('click', () => el.addProductModal.classList.add('hidden'));
  el.addProductModal.addEventListener('click', (e) => {
    if (e.target === el.addProductModal) el.addProductModal.classList.add('hidden');
  });
  el.newProductForm.addEventListener('submit', handleAddNewProduct);

  // Admin Add Shop Form
  el.adminAddShopForm.addEventListener('submit', handleAdminAddShop);
}

function updateCanteenTabsUI(canteen) {
  el.canteenTabs.forEach(t => {
    if (t.getAttribute('data-canteen') === canteen) {
      t.className = 'canteen-tab active py-2 rounded-xl text-center transition-all bg-white text-emerald-800 shadow-xs font-bold';
    } else {
      t.className = 'canteen-tab py-2 rounded-xl text-center transition-all hover:text-emerald-700 text-slate-600';
    }
  });
}

function switchView(viewId, activeNavItem) {
  el.views.forEach(v => v.classList.add('hidden'));
  const target = document.getElementById(viewId);
  if (target) target.classList.remove('hidden');

  el.navItems.forEach(n => {
    n.className = 'nav-item flex flex-col items-center justify-center text-slate-400 hover:text-emerald-700 gap-1 touch-press cursor-pointer';
  });
  if (activeNavItem) {
    activeNavItem.className = 'nav-item active flex flex-col items-center justify-center text-emerald-700 gap-1 touch-press cursor-pointer';
  }

  // If entering merchant view, check login state
  if (viewId === 'viewMerchant') {
    renderMerchantView();
  }
}

// ----------------- API Calls & Rendering -----------------

async function fetchRestaurants() {
  try {
    const params = new URLSearchParams();
    if (state.searchQuery) params.append('q', state.searchQuery);
    if (state.canteenFilter && state.canteenFilter !== 'ALL') params.append('canteen', state.canteenFilter);
    if (state.categoryFilter && state.categoryFilter !== 'ทั้งหมด') params.append('category', state.categoryFilter);
    if (state.onlyOpen) params.append('status', 'OPEN');

    const res = await fetch(`/api/restaurants/search?${params.toString()}`);
    const data = await res.json();
    state.restaurants = data.data || [];
    renderRestaurantList();
  } catch (err) {
    console.error('Failed to fetch restaurants:', err);
    el.resultsSummaryText.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
  }
}

function renderRestaurantList() {
  el.restaurantList.innerHTML = '';
  const total = state.restaurants.length;
  el.resultsSummaryText.textContent = `พบ ${total} ร้านอาหาร`;

  if (total === 0) {
    el.restaurantList.innerHTML = `
      <div class="py-12 text-center text-slate-400 space-y-2">
        <div class="text-4xl">🔍</div>
        <p class="text-sm font-semibold">ไม่พบร้านอาหารที่ตรงกับเงื่อนไข</p>
        <p class="text-xs">ลองค้นหาด้วยคำอื่น หรือเลือกโรงอาหารทั้งหมด</p>
      </div>
    `;
    return;
  }

  state.restaurants.forEach(shop => {
    const card = document.createElement('div');
    const isClosedClass = !shop.isOpen ? 'is-closed' : '';

    // Count sold out items
    const soldOutCount = (shop.products || []).filter(p => p.isSoldOut).length;

    card.className = `restaurant-card ${isClosedClass} bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all touch-press cursor-pointer relative`;
    card.innerHTML = `
      <div class="relative h-36 bg-slate-100 overflow-hidden">
        <img src="${shop.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}" alt="${shop.name}" class="w-full h-full object-cover">

        <!-- Open/Closed Status Badge (Grab Style) -->
        <div class="absolute top-3 left-3">
          ${shop.isOpen
            ? `<span class="bg-emerald-600/95 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span class="w-2 h-2 rounded-full bg-emerald-200 animate-pulse"></span>
                เปิดอยู่
               </span>`
            : `<span class="bg-slate-900/90 backdrop-blur-xs text-rose-300 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <span>⛔</span> ปิดแล้ว
               </span>`
          }
        </div>

        <!-- Canteen Location Tag -->
        <div class="absolute top-3 right-3">
          <span class="bg-white/95 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
            ${shop.canteenCode === 'GREEN_CANTEEN' ? '🌿 กรีนแคนทีน' : '🔬 คณะวิทย์'}
          </span>
        </div>

        <!-- Grab-like Closed Overlay -->
        ${!shop.isOpen ? `
          <div class="closed-overlay absolute inset-0 bg-slate-900/50 flex items-center justify-center">
            <span class="bg-black/70 text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-white/20">
              ร้านปิดให้บริการชั่วคราว
            </span>
          </div>
        ` : ''}
      </div>

      <div class="p-3.5 space-y-2">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="font-bold text-sm text-slate-900 leading-tight">${shop.name}</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">${shop.stallNumber || 'ล็อคในโรงอาหาร'}</p>
          </div>
          <div class="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60 flex-shrink-0">
            <span class="text-amber-500 text-xs">★</span>
            <span class="text-xs font-bold text-amber-900">${shop.rating || 4.5}</span>
          </div>
        </div>

        <!-- Category & Hours -->
        <div class="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
          <span>⏰ ${shop.openTime} - ${shop.closeTime} น.</span>
          <span class="text-emerald-700 font-medium">${(shop.categories || []).join(', ')}</span>
        </div>

        <!-- Sold Out Highlight Notice if any -->
        ${soldOutCount > 0 ? `
          <div class="bg-amber-50 border border-amber-200/80 rounded-xl p-2 text-[11px] text-amber-900 flex items-center justify-between">
            <span class="flex items-center gap-1 font-semibold">
              <span>⚠️</span> มีเมนูหมด ${soldOutCount} รายการ
            </span>
            <span class="text-[10px] text-amber-700 underline">ดูเมนู</span>
          </div>
        ` : ''}
      </div>
    `;

    card.addEventListener('click', () => openRestaurantModal(shop.id));
    el.restaurantList.appendChild(card);
  });
}

// ----------------- Restaurant Modal -----------------

async function openRestaurantModal(restaurantId) {
  try {
    const res = await fetch(`/api/restaurants/${restaurantId}`);
    const shop = await res.json();
    state.activeRestaurant = shop;

    el.modalShopImg.src = shop.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
    el.modalShopName.textContent = shop.name;
    el.modalShopCanteen.textContent = `${shop.canteenName} • ${shop.stallNumber}`;
    el.modalShopHours.textContent = `⏰ เวลาเปิด-ปิด: ${shop.openTime} - ${shop.closeTime} น.`;

    if (shop.isOpen) {
      el.modalShopStatusBadge.textContent = 'เปิดอยู่';
      el.modalShopStatusBadge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white';
    } else {
      el.modalShopStatusBadge.textContent = 'ปิดให้บริการ';
      el.modalShopStatusBadge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white';
    }

    // Render Menu Items with Sold Out Indicators
    el.modalProductList.innerHTML = '';
    const products = shop.products || [];
    if (products.length === 0) {
      el.modalProductList.innerHTML = '<p class="text-xs text-slate-400">ยังไม่มีรายการเมนู</p>';
    } else {
      products.forEach(p => {
        const item = document.createElement('div');
        item.className = `p-3 rounded-2xl border flex items-center justify-between ${
          p.isSoldOut
            ? 'bg-amber-50/60 border-amber-200'
            : 'bg-white border-slate-200'
        }`;

        item.innerHTML = `
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-xs ${p.isSoldOut ? 'line-through text-slate-400' : 'text-slate-800'}">
                ${p.name}
              </span>
              ${p.isSoldOut ? `
                <span class="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  หมดแล้ววันนี้
                </span>
              ` : ''}
            </div>
            <span class="text-xs font-semibold ${p.isSoldOut ? 'text-slate-400' : 'text-emerald-700'}">
              ฿${p.price.toFixed(2)}
            </span>
          </div>
          ${p.isSoldOut
            ? `<span class="text-xs text-amber-700 font-bold">หมด</span>`
            : `<span class="text-xs text-emerald-600 font-medium">พร้อมขาย</span>`
          }
        `;
        el.modalProductList.appendChild(item);
      });
    }

    // Render Reviews
    renderReviews(shop.reviews || []);

    el.restaurantModal.classList.remove('hidden');
  } catch (err) {
    console.error('Error opening shop modal:', err);
  }
}

function renderReviews(reviews) {
  el.modalReviewList.innerHTML = '';
  if (reviews.length === 0) {
    el.modalReviewList.innerHTML = '<p class="text-xs text-slate-400">ยังไม่มีรีวิวสำหรับร้านนี้ เป็นคนแรกที่รีวิว!</p>';
    el.modalReviewAvg.textContent = 'ใหม่';
    return;
  }

  const avg = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  el.modalReviewAvg.textContent = `${avg} ★ (${reviews.length})`;

  reviews.forEach(r => {
    const revEl = document.createElement('div');
    revEl.className = 'bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1';
    revEl.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-bold text-slate-700">${escapeHtml(r.userName)}</span>
        <span class="text-amber-500 text-[11px] font-bold">${'★'.repeat(r.rating)}</span>
      </div>
      <p class="text-slate-600">${escapeHtml(r.comment)}</p>
      <span class="text-[10px] text-slate-400">${r.date || ''}</span>
    `;
    el.modalReviewList.appendChild(revEl);
  });
}

function closeModal() {
  el.restaurantModal.classList.add('hidden');
  state.activeRestaurant = null;
}

// Non-login review submit
async function handleAddReview(e) {
  e.preventDefault();
  if (!state.activeRestaurant) return;

  const authorInput = document.getElementById('reviewAuthor');
  const ratingInput = document.getElementById('reviewRating');
  const commentInput = document.getElementById('reviewComment');

  const payload = {
    userName: authorInput.value.trim(),
    rating: parseInt(ratingInput.value, 10),
    comment: commentInput.value.trim()
  };

  try {
    const res = await fetch(`/api/restaurants/${state.activeRestaurant.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('บันทึกรีวิวไม่สำเร็จ');

    const newRev = await res.json();
    if (!state.activeRestaurant.reviews) state.activeRestaurant.reviews = [];
    state.activeRestaurant.reviews.unshift(newRev);

    renderReviews(state.activeRestaurant.reviews);
    commentInput.value = '';
    showToast('ส่งรีวิวสำเร็จ ขอบคุณสำหรับข้อเสนอแนะ!', '⭐');
  } catch (err) {
    showToast(err.message || 'ส่งรีวิวไม่สำเร็จ', '⚠️');
  }
}

// ----------------- Merchant Login & Dashboard -----------------

function checkCachedMerchantSession() {
  const cached = localStorage.getItem('tu_canteen_owner_session');
  if (cached) {
    try {
      state.merchant = JSON.parse(cached);
    } catch (e) {
      localStorage.removeItem('tu_canteen_owner_session');
    }
  }
}

function renderMerchantView() {
  if (!state.merchant || !state.merchant.token) {
    el.merchantLoginBox.classList.remove('hidden');
    el.merchantDashboardBox.classList.add('hidden');
  } else {
    el.merchantLoginBox.classList.add('hidden');
    el.merchantDashboardBox.classList.remove('hidden');
    loadMerchantDashboardData();
  }
}

async function handleMerchantLogin(e) {
  e.preventDefault();
  const phone = el.mPhone.value.trim();
  const pin = el.mPin.value.trim();

  try {
    const res = await fetch('/api/auth/owner/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin })
    });

    const data = await res.json();

    if (!res.ok) {
      el.loginMsgAlert.textContent = data.message || 'เข้าสู่ระบบไม่สำเร็จ';
      el.loginMsgAlert.classList.remove('hidden');
      return;
    }

    state.merchant = {
      token: data.token,
      ownerId: data.ownerId,
      restaurantId: data.restaurantId,
      phone
    };

    localStorage.setItem('tu_canteen_owner_session', JSON.stringify(state.merchant));
    el.loginMsgAlert.classList.add('hidden');
    showToast('ยินดีต้อนรับสู่ระบบจัดการร้าน', '🏪');
    renderMerchantView();
  } catch (err) {
    el.loginMsgAlert.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
    el.loginMsgAlert.classList.remove('hidden');
  }
}

function handleMerchantLogout() {
  if (state.merchant && state.merchant.token) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${state.merchant.token}` }
    }).catch(() => {});
  }
  state.merchant = null;
  localStorage.removeItem('tu_canteen_owner_session');
  showToast('ออกจากระบบเรียบร้อย', '👋');
  renderMerchantView();
}

async function loadMerchantDashboardData() {
  if (!state.merchant) return;
  try {
    const res = await fetch(`/api/restaurants/${state.merchant.restaurantId}`);
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลร้านได้');
    const shop = await res.json();

    el.dashShopName.textContent = shop.name;
    el.dashCanteenInfo.textContent = `${shop.canteenName} • ${shop.stallNumber}`;
    el.dashToggleSwitch.checked = shop.isOpen;
    updateDashStatusUI(shop.isOpen);

    el.dashOpenTime.value = shop.openTime || '07:30';
    el.dashCloseTime.value = shop.closeTime || '16:00';

    // Render Menu with Sold Out Toggle Buttons
    el.dashMenuList.innerHTML = '';
    const products = shop.products || [];
    products.forEach(p => {
      const item = document.createElement('div');
      item.className = 'bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between';
      item.innerHTML = `
        <div>
          <span class="font-bold text-xs ${p.isSoldOut ? 'line-through text-slate-400' : 'text-slate-800'} block">
            ${p.name}
          </span>
          <span class="text-xs font-semibold text-emerald-700">฿${p.price.toFixed(2)}</span>
        </div>
        <button class="dash-toggle-sold-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
          p.isSoldOut
            ? 'bg-amber-500 hover:bg-emerald-600 text-white shadow-xs'
            : 'bg-white hover:bg-amber-100 text-slate-700 border border-slate-200'
        }" data-prod-id="${p.id}" data-sold-out="${p.isSoldOut}">
          ${p.isSoldOut ? 'แจ้งมีของแล้ว' : 'แจ้งของหมด'}
        </button>
      `;

      item.querySelector('.dash-toggle-sold-btn').addEventListener('click', (e) => {
        handleToggleProductSoldOut(p.id, p.isSoldOut);
      });

      el.dashMenuList.appendChild(item);
    });
  } catch (err) {
    console.error('Error loading merchant dash:', err);
  }
}

function updateDashStatusUI(isOpen) {
  if (isOpen) {
    el.dashStatusDot.className = 'w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse';
    el.dashStatusText.textContent = 'เปิดให้บริการ';
    el.dashStatusText.className = 'text-lg font-bold text-emerald-700';
  } else {
    el.dashStatusDot.className = 'w-3.5 h-3.5 rounded-full bg-rose-500';
    el.dashStatusText.textContent = 'ปิดให้บริการ';
    el.dashStatusText.className = 'text-lg font-bold text-rose-600';
  }
}

// Toggle Open/Close Status (Task 22)
async function handleMerchantStatusToggle(e) {
  const newIsOpen = e.target.checked;
  const statusStr = newIsOpen ? 'OPEN' : 'CLOSED';
  updateDashStatusUI(newIsOpen);

  try {
    const res = await fetch(`/api/restaurants/${state.merchant.restaurantId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.merchant.token}`
      },
      body: JSON.stringify({ status: statusStr })
    });

    if (!res.ok) throw new Error('ไม่สามารถบันทึกสถานะได้');
    showToast(newIsOpen ? 'เปิดร้านเรียบร้อย' : 'ปิดร้านเรียบร้อย', newIsOpen ? '🟢' : '🔴');
    fetchRestaurants();
  } catch (err) {
    e.target.checked = !newIsOpen;
    updateDashStatusUI(!newIsOpen);
    showToast('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ', '⚠️');
  }
}

// Save Operating Hours
async function handleSaveOperatingHours() {
  const openTime = el.dashOpenTime.value;
  const closeTime = el.dashCloseTime.value;

  try {
    const res = await fetch(`/api/restaurants/${state.merchant.restaurantId}/hours`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.merchant.token}`
      },
      body: JSON.stringify({ openTime, closeTime })
    });

    if (!res.ok) throw new Error('บันทึกเวลาไม่สำเร็จ');
    showToast(`บันทึกเวลาเปิด-ปิด (${openTime} - ${closeTime}) สำเร็จ`, '⏰');
    fetchRestaurants();
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการบันทึกเวลา', '⚠️');
  }
}

// Toggle Sold Out
async function handleToggleProductSoldOut(productId, currentSoldOut) {
  try {
    const res = await fetch(`/api/products/${productId}/soldout`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.merchant.token}`
      },
      body: JSON.stringify({ isSoldOut: !currentSoldOut })
    });

    if (!res.ok) throw new Error('อัปเดตสถานะเมนูไม่สำเร็จ');
    const result = await res.json();
    showToast(result.message, result.isSoldOut ? '⚠️' : '✅');
    loadMerchantDashboardData();
    fetchRestaurants();
  } catch (err) {
    showToast('เกิดข้อผิดพลาด', '⚠️');
  }
}

// Add New Product
async function handleAddNewProduct(e) {
  e.preventDefault();
  const name = el.newProdName.value.trim();
  const price = parseFloat(el.newProdPrice.value);

  try {
    const res = await fetch(`/api/restaurants/${state.merchant.restaurantId}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.merchant.token}`
      },
      body: JSON.stringify({ name, price })
    });

    if (!res.ok) throw new Error('เพิ่มเมนูไม่สำเร็จ');

    el.newProdName.value = '';
    el.newProdPrice.value = '';
    el.addProductModal.classList.add('hidden');
    showToast(`เพิ่มเมนู "${name}" สำเร็จ`, '🎉');
    loadMerchantDashboardData();
    fetchRestaurants();
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการเพิ่มเมนู', '⚠️');
  }
}

// ----------------- Admin Add Restaurant -----------------

async function handleAdminAddShop(e) {
  e.preventDefault();
  const name = document.getElementById('adminShopName').value.trim();
  const canteenCode = document.getElementById('adminCanteenCode').value;
  const stallNumber = document.getElementById('adminStallNumber').value.trim();
  const category = document.getElementById('adminCategory').value;
  const openTime = document.getElementById('adminOpenTime').value;
  const closeTime = document.getElementById('adminCloseTime').value;
  const initialOwnerPhone = document.getElementById('adminOwnerPhone').value.trim();
  const initialOwnerPin = document.getElementById('adminOwnerPin').value.trim();

  try {
    const res = await fetch('/api/admin/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        canteenCode,
        stallNumber,
        category,
        openTime,
        closeTime,
        initialOwnerPhone,
        initialOwnerPin
      })
    });

    if (!res.ok) throw new Error('เพิ่มร้านไม่สำเร็จ');

    el.adminAddShopForm.reset();
    showToast(`เพิ่มร้าน "${name}" เรียบร้อย!`, '🏪');
    fetchRestaurants();

    // Switch back to explore
    const exploreTab = document.querySelector('.nav-item[data-view="viewExplore"]');
    switchView('viewExplore', exploreTab);
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการเพิ่มร้าน', '⚠️');
  }
}

// ----------------- Helpers -----------------

function showToast(message, icon = '✨') {
  el.toastIcon.textContent = icon;
  el.toastText.textContent = message;
  el.globalToast.classList.remove('opacity-0', 'pointer-events-none');

  setTimeout(() => {
    el.globalToast.classList.add('opacity-0', 'pointer-events-none');
  }, 2800);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function (m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

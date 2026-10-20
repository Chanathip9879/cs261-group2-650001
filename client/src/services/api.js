// client/src/services/api.js
// Client API Service for HiwKhaw TU Rangsit (U1, U2, U3, U4, U5)

const BASE_URL = '/api';

export const authStorage = {
  getToken: () => localStorage.getItem('hiwkhaw_auth_token'),
  setToken: (token) => localStorage.setItem('hiwkhaw_auth_token', token),
  removeToken: () => localStorage.removeItem('hiwkhaw_auth_token'),
  getUser: () => {
    try {
      const data = localStorage.getItem('hiwkhaw_user_data');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('hiwkhaw_user_data', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('hiwkhaw_user_data'),
  clear: () => {
    localStorage.removeItem('hiwkhaw_auth_token');
    localStorage.removeItem('hiwkhaw_user_data');
  }
};

// ดึงรายการร้านค้า (U1, U2, U3)
export async function getShops({ q = '', canteen = 'all', category = 'all', status = 'all' } = {}) {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (canteen && canteen !== 'all') params.append('canteen', canteen);
  if (category && category !== 'all') params.append('category', category);
  if (status === 'open') params.append('status', 'open');

  const res = await fetch(`${BASE_URL}/shops?${params.toString()}`);
  if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลร้านอาหารได้');
  return res.json();
}

// ดึงรายละเอียดร้านเดี่ยว (U3)
export async function getShopById(id) {
  const res = await fetch(`${BASE_URL}/shops/${id}`);
  if (!res.ok) throw new Error('ไม่สามารถโหลดรายละเอียดร้านได้');
  return res.json();
}

// ดึงข้อมูลโรงอาหารพร้อมสถิติ (U3)
export async function getCanteens() {
  const res = await fetch(`${BASE_URL}/canteens`);
  if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลโรงอาหารได้');
  return res.json();
}

// ดึงหมวดหมู่อาหาร (U2)
export async function getCategories() {
  const res = await fetch(`${BASE_URL}/categories`);
  if (!res.ok) throw new Error('ไม่สามารถโหลดหมวดหมู่อาหารได้');
  return res.json();
}

// ล็อกอินแม่ค้า/แอดมินด้วยเบอร์โทร + PIN (U4)
export async function loginVendor(phone, pin) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, pin })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
  }
  return data;
}

// ตรวจสอบข้อมูลผู้ใช้ปัจจุบัน (U4)
export async function getMe() {
  const token = authStorage.getToken();
  if (!token) return null;

  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    authStorage.clear();
    return null;
  }
  return res.json();
}

// เปลี่ยนสถานะร้านอาหาร เปิด/ปิด (U5)
export async function updateShopStatus(shopId, isOpen, statusNote) {
  const token = authStorage.getToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบก่อนเปลี่ยนสถานะร้าน');

  const res = await fetch(`${BASE_URL}/shops/${shopId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ isOpen, statusNote })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'ไม่สามารถเปลี่ยนสถานะร้านได้');
  }
  return data;
}

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

// Error ของการล็อกอิน แยกกรณีบัญชีถูกล็อก (U7) และเชื่อมต่อเซิร์ฟเวอร์ไม่ได้
export class LoginError extends Error {
  constructor(message, { status = 0, locked = false, unlockAt = null, network = false } = {}) {
    super(message);
    this.name = 'LoginError';
    this.status = status;     // HTTP status (0 = ไม่ได้รับ response)
    this.locked = locked;     // true = บัญชีถูกล็อกชั่วคราว
    this.unlockAt = unlockAt; // เวลาปลดล็อก (ms since epoch) หรือ null ถ้าไม่ได้รับเวลา
    this.network = network;   // true = เชื่อมต่อเซิร์ฟเวอร์ไม่ได้
  }
}

// U7: อ่านเวลาปลดล็อกจาก response
// รูปแบบที่ตกลงกับ backend: HTTP 423 + { locked: true, lockedUntil: ISO string, retryAfterSeconds: number }
// ใช้ retryAfterSeconds ก่อน (ไม่ขึ้นกับนาฬิกาเครื่องผู้ใช้) แล้วค่อย lockedUntil และ header Retry-After
function parseUnlockAt(res, data) {
  const now = Date.now();
  const seconds = Number(data.retryAfterSeconds ?? res.headers.get('Retry-After'));
  if (Number.isFinite(seconds) && seconds > 0) return now + seconds * 1000;
  const until = Date.parse(data.lockedUntil);
  if (Number.isFinite(until) && until > now) return until;
  return null;
}

// ล็อกอินแม่ค้า/แอดมินด้วยเบอร์โทร + PIN (U4) และรองรับสถานะบัญชีถูกล็อก (U7)
export async function loginVendor(phone, pin) {
  let res;
  try {
    res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin })
    });
  } catch {
    throw new LoginError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่ภายหลัง', { network: true });
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    // response ไม่ใช่ JSON (เช่น proxy error) ใช้ข้อความกลางแทน
  }

  if (res.status === 423 || data.locked === true) {
    throw new LoginError(data.message || 'บัญชีถูกล็อกชั่วคราว', {
      status: res.status,
      locked: true,
      unlockAt: parseUnlockAt(res, data)
    });
  }

  if (!res.ok || !data.success) {
    if (res.status >= 500 || !data.message) {
      throw new LoginError('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่ภายหลัง', { status: res.status, network: res.status >= 500 });
    }
    throw new LoginError(data.message, { status: res.status });
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

/**
 * Auth Route Guard - ป้องกันการเข้าถึงหน้า Dashboard โดยไม่ผ่านการล็อกอิน
 * สำหรับ Task 18: U4 Frontend Route Guard
 */
class AuthGuard {
  constructor(apiBaseUrl = '') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * ตรวจสอบว่าผู้ใช้ปัจจุบันมีสิทธิ์เข้าถึงหน้า Dashboard หรือไม่
   * @param {Function} onAuthorized Callback เมื่อผ่านการตรวจสอบ
   * @param {Function} onUnauthorized Callback เมื่อยังไม่ได้ล็อกอินหรือ Token หมดอายุ
   */
  async checkAccess(onAuthorized, onUnauthorized) {
    const token = TokenManager.getToken();
    if (!token) {
      if (onUnauthorized) onUnauthorized('NO_TOKEN');
      return false;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (onAuthorized) onAuthorized(data);
        return true;
      } else {
        // Token หมดอายุ หรือไม่ถูกต้อง
        TokenManager.clearSession();
        if (onUnauthorized) onUnauthorized('INVALID_TOKEN');
        return false;
      }
    } catch (error) {
      console.warn('Network error during auth verification, using cached session if valid:', error);
      const cachedOwner = TokenManager.getOwner();
      if (cachedOwner) {
        if (onAuthorized) onAuthorized(cachedOwner);
        return true;
      }
      if (onUnauthorized) onUnauthorized('NETWORK_ERROR');
      return false;
    }
  }

  /**
   * เรียก API เพื่อ Login ด้วยเบอร์โทรศัพท์และ PIN
   */
  async login(phone, pin) {
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanPin = pin.trim();

    if (cleanPhone.length !== 10) {
      throw new Error('เบอร์โทรศัพท์ต้องมี 10 หลัก');
    }
    if (cleanPin.length < 4 || cleanPin.length > 6) {
      throw new Error('รหัส PIN ต้องมีความยาว 4-6 หลัก');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/auth/owner/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ phone: cleanPhone, pin: cleanPin })
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(`กรอก PIN ผิดเกินกำหนด กรุณารอ ${data.retryAfterSeconds || 300} วินาที`);
      }
      throw new Error(data.message || 'เบอร์โทรหรือ PIN ไม่ถูกต้อง');
    }

    // บันทึก Session Token
    TokenManager.setSession(data.token, {
      ownerId: data.ownerId,
      restaurantId: data.restaurantId,
      phone: cleanPhone,
      role: data.role
    });

    return data;
  }

  logout() {
    const token = TokenManager.getToken();
    if (token) {
      fetch(`${this.apiBaseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {});
    }
    TokenManager.clearSession();
  }
}

if (typeof module !== 'undefined') {
  module.exports = AuthGuard;
}

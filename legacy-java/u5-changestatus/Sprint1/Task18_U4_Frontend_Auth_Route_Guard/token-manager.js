/**
 * Token Manager - จัดการการจัดเก็บ Token ในฝั่ง Frontend
 * สำหรับ Task 18: U4 Frontend Auth
 */
const TokenManager = (() => {
  const TOKEN_KEY = 'tu_canteen_owner_token';
  const OWNER_DATA_KEY = 'tu_canteen_owner_data';

  return {
    setSession(token, ownerData) {
      if (!token) return;
      localStorage.setItem(TOKEN_KEY, token);
      if (ownerData) {
        localStorage.setItem(OWNER_DATA_KEY, JSON.stringify(ownerData));
      }
    },

    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },

    getOwner() {
      try {
        const raw = localStorage.getItem(OWNER_DATA_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    hasToken() {
      return !!this.getToken();
    },

    clearSession() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(OWNER_DATA_KEY);
    },

    getAuthHeader() {
      const token = this.getToken();
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
  };
})();

if (typeof module !== 'undefined') {
  module.exports = TokenManager;
}

/**
 * Restaurant Status Toggle Controller
 * สำหรับ Task 22: U5 Frontend Toggle Status Switch
 */
class RestaurantStatusToggle {
  constructor(options = {}) {
    this.restaurantId = options.restaurantId;
    this.apiBaseUrl = options.apiBaseUrl || '';
    this.toggleElement = options.toggleElement;
    this.onStatusChange = options.onStatusChange;
    this.isUpdating = false;

    if (this.toggleElement) {
      this.init();
    }
  }

  init() {
    this.toggleElement.addEventListener('change', (e) => this.handleToggle(e));
  }

  async handleToggle(e) {
    if (this.isUpdating) return;
    this.isUpdating = true;

    const newIsOpen = e.target.checked;
    const targetStatus = newIsOpen ? 'OPEN' : 'CLOSED';
    const previousState = !newIsOpen;

    try {
      // เรียก API ด้วย Token เจ้าของร้าน
      const token = localStorage.getItem('tu_canteen_owner_token');
      const response = await fetch(`${this.apiBaseUrl}/api/restaurants/${this.restaurantId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: targetStatus })
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const result = await response.json();
      if (this.onStatusChange) {
        this.onStatusChange(true, targetStatus, result);
      }
    } catch (error) {
      console.error('Failed to update restaurant status, rolling back:', error);
      // Rollback สวิตช์กลับเป็นค่าเดิม
      this.toggleElement.checked = previousState;
      if (this.onStatusChange) {
        this.onStatusChange(false, previousState ? 'OPEN' : 'CLOSED', error);
      }
    } finally {
      this.isUpdating = false;
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = RestaurantStatusToggle;
}

// Dashboard Controller for Merchant (U5)
document.addEventListener('DOMContentLoaded', () => {
  const shopStatusToggle = document.getElementById('shopStatusToggle');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const saveTimeBtn = document.getElementById('saveTimeBtn');
  const openTimeInput = document.getElementById('openTimeInput');
  const closeTimeInput = document.getElementById('closeTimeInput');

  // Load initial status
  function updateStatusUI(isOpen) {
    if (isOpen) {
      statusDot.className = 'w-3 h-3 rounded-full bg-emerald-500 animate-pulse';
      statusText.textContent = 'เปิดให้บริการ';
      statusText.className = 'text-lg font-bold text-emerald-700';
    } else {
      statusDot.className = 'w-3 h-3 rounded-full bg-rose-500';
      statusText.textContent = 'ปิดให้บริการ';
      statusText.className = 'text-lg font-bold text-rose-600';
    }
  }

  // Toggle store status
  if (shopStatusToggle) {
    shopStatusToggle.addEventListener('change', async (e) => {
      const isOpen = e.target.checked;
      updateStatusUI(isOpen);
      showToast(isOpen ? 'เปิดร้านเรียบร้อย' : 'ปิดร้านเรียบร้อย');
    });
  }

  // Save operating hours
  if (saveTimeBtn) {
    saveTimeBtn.addEventListener('click', () => {
      const open = openTimeInput.value;
      const close = closeTimeInput.value;
      showToast(`บันทึกเวลาเปิด-ปิด (${open} - ${close}) สำเร็จ`);
    });
  }

  // Toggle sold out items
  document.querySelectorAll('.toggle-sold-out-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const isSoldOut = e.target.getAttribute('data-sold-out') === 'true';
      const newStatus = !isSoldOut;
      e.target.setAttribute('data-sold-out', String(newStatus));

      if (newStatus) {
        e.target.className = 'toggle-sold-out-btn px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-emerald-600 text-white active:scale-95 transition-all shadow-sm';
        e.target.textContent = 'แจ้งมีของแล้ว';
        showToast('ตั้งค่าเป็น: ของหมด');
      } else {
        e.target.className = 'toggle-sold-out-btn px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 active:scale-95 transition-all border border-slate-200';
        e.target.textContent = 'พร้อมขาย';
        showToast('ตั้งค่าเป็น: พร้อมขาย');
      }
    });
  });

  function showToast(msg) {
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
      toastMessage.textContent = msg;
      toast.style.opacity = '1';
      setTimeout(() => {
        toast.style.opacity = '0';
      }, 2500);
    }
  }
});

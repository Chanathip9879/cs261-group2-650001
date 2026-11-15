// client/src/utils/reviewValidation.js
// U9: กฎตรวจข้อมูลฟอร์มรีวิวฝั่ง Frontend
// ต้องตรงกับฝั่ง Backend (server/routes/reviews.js และ docs/API_SHOP_REVIEWS.md)

export const USERNAME_MIN = 2;
export const USERNAME_MAX = 50;
export const COMMENT_MIN = 10;
export const COMMENT_MAX = 500;

// คืน { username?: string, comment?: string } — ว่าง = ผ่าน
export function validateReview({ username, comment }) {
  const errors = {};
  const name = (username || '').trim();
  const text = (comment || '').trim();

  if (!name) errors.username = 'กรุณากรอกชื่อผู้รีวิว';
  else if (name.length < USERNAME_MIN || name.length > USERNAME_MAX) {
    errors.username = `ชื่อผู้รีวิวต้องมีความยาว ${USERNAME_MIN} ถึง ${USERNAME_MAX} ตัวอักษร`;
  }

  if (!text) errors.comment = 'กรุณากรอกข้อความรีวิว';
  else if (text.length < COMMENT_MIN) errors.comment = `ข้อความรีวิวต้องมีอย่างน้อย ${COMMENT_MIN} ตัวอักษร`;
  else if (text.length > COMMENT_MAX) errors.comment = `ข้อความรีวิวต้องไม่เกิน ${COMMENT_MAX} ตัวอักษร`;

  return errors;
}

// แสดงวันที่เขียนรีวิวแบบไทย เช่น "15 พ.ย. 2569 14:30 น."
export function formatReviewDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time} น.`;
}

// client/src/utils/shopDisplay.js
// ตัวช่วยแปลงข้อมูลร้านเป็นข้อความ/รูปสำหรับแสดงผลตามดีไซน์ Figma

import chickenRice from '../assets/images/food-chicken-rice.jpg';
import chickenRice2 from '../assets/images/food-chicken-rice-2.jpg';
import papayaSalad from '../assets/images/food-papaya-salad.jpg';
import papayaSalad2 from '../assets/images/food-papaya-salad-2.jpg';
import noodles from '../assets/images/food-noodles.jpg';
import noodles2 from '../assets/images/food-noodles-2.jpg';
import detail1 from '../assets/images/detail-1.jpg';
import detail2 from '../assets/images/detail-2.jpg';
import detail3 from '../assets/images/detail-3.jpg';
import detail4 from '../assets/images/detail-4.jpg';
import detail5 from '../assets/images/detail-5.jpg';
import fav1 from '../assets/images/fav-1.jpg';
import fav2 from '../assets/images/fav-2.jpg';
import fav3 from '../assets/images/fav-3.jpg';
import fav4 from '../assets/images/fav-4.jpg';
import fav5 from '../assets/images/fav-5.jpg';

// ข้อมูลร้านยังไม่มีรูป จึงใช้ภาพอาหารจาก Figma ตามหมวดหมู่ร้าน
const CATEGORY_IMAGES = {
  chicken_rice: [chickenRice, detail1, chickenRice2],
  papaya_salad: [papayaSalad, papayaSalad2, fav5],
  noodles: [noodles, noodles2, fav3],
  rice_curry: [fav4, fav1],
  made_to_order: [fav1, fav4],
  drinks_dessert: [fav2],
};
const MENU_IMAGES = [detail2, detail3, detail4, detail5, chickenRice2, fav1, fav3, fav5];

function hashOf(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function getShopImage(shop) {
  const list = CATEGORY_IMAGES[shop?.category] || [chickenRice, papayaSalad, noodles];
  return list[hashOf(shop?.id) % list.length];
}

export function getMenuImage(shop, index) {
  return MENU_IMAGES[(hashOf(shop?.id) + index) % MENU_IMAGES.length];
}

export function parseHours(text) {
  const m = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/.exec(text || '');
  return m ? { open: m[1].padStart(5, '0'), close: m[2].padStart(5, '0') } : null;
}

export function closingText(shop) {
  const h = parseHours(shop?.openingHours);
  if (!h) return shop?.openingHours || '';
  return shop.isOpen ? `เปิดถึง ${h.close} น.` : `เปิด ${h.open} น.`;
}

export function hoursText(shop) {
  const h = parseHours(shop?.openingHours);
  return h ? `${h.open} - ${h.close} น.` : shop?.openingHours || '-';
}

export function soldOutMenus(shop) {
  return (shop?.menus || []).filter((m) => !m.isAvailable);
}

export function priceLevel(shop) {
  const prices = (shop?.menus || []).map((m) => Number(m.price) || 0).filter(Boolean);
  if (!prices.length) return { symbol: '฿', label: 'ย่อมเยา' };
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  if (avg < 45) return { symbol: '฿', label: 'ย่อมเยา' };
  if (avg < 80) return { symbol: '฿฿', label: 'ปานกลาง' };
  return { symbol: '฿฿฿', label: 'พรีเมียม' };
}

export function priceRange(shop) {
  const prices = (shop?.menus || []).map((m) => Number(m.price) || 0).filter(Boolean);
  if (!prices.length) return '';
  return `${Math.min(...prices)}-${Math.max(...prices)}฿`;
}

export function menuSummary(shop, n = 3) {
  return (shop?.menus || []).slice(0, n).map((m) => m.name).join(' • ');
}

export function canteenShort(shop) {
  if (!shop) return '';
  return shop.canteen === 'sci' ? 'โรงอาหาร SC' : 'กรีนแคนทีน';
}

export function locationText(shop) {
  if (!shop) return '';
  return `${canteenShort(shop)} ${shop.boothNumber || ''}`.trim();
}

export function formatBaht(n) {
  return `฿${Number(n || 0).toLocaleString('th-TH')}`;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'เมื่อสักครู่';
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hr / 24)} วันที่แล้ว`;
}

export function telHref(phone) {
  return `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;
}

export function formatPhone(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return phone || '-';
}

// client/src/utils/shopDisplay.js
// ตัวช่วยแปลงข้อมูลร้านเป็นข้อความ/รูปสำหรับแสดงผลตามดีไซน์ Figma

import chickenRice from '../assets/images/food-chicken-rice.jpg';
import chickenRice2 from '../assets/images/food-chicken-rice-2.jpg';
import papayaSalad from '../assets/images/food-papaya-salad.jpg';
import papayaSalad2 from '../assets/images/food-papaya-salad-2.jpg';
import noodles from '../assets/images/food-noodles.jpg';
import noodles2 from '../assets/images/food-noodles-2.jpg';
import detail1 from '../assets/images/detail-1.jpg';
import detail3 from '../assets/images/detail-3.jpg';
import detail4 from '../assets/images/detail-4.jpg';
import detail5 from '../assets/images/detail-5.jpg';
import fav1 from '../assets/images/fav-1.jpg';
import fav2 from '../assets/images/fav-2.jpg';
import fav3 from '../assets/images/fav-3.jpg';
import fav4 from '../assets/images/fav-4.jpg';
import fav5 from '../assets/images/fav-5.jpg';

import { getEffectiveStatus } from './openingHours';

// ข้อมูลร้านยังไม่มีรูป จึงใช้ภาพอาหารจาก Figma ตามหมวดหมู่ร้าน
// หมายเหตุ: หมวดที่เพิ่มใหม่ (snacks/fruit_salad/dessert) ใช้ภาพถ่ายอาหารที่มีอยู่แล้วเท่านั้น
const CATEGORY_IMAGES = {
  chicken_rice: [chickenRice, detail1, chickenRice2],
  papaya_salad: [papayaSalad, papayaSalad2, fav5],
  noodles: [noodles, noodles2, fav3],
  rice_curry: [fav4, fav1],
  made_to_order: [fav1, fav4],
  drinks_dessert: [fav2],
  snacks: [detail3, detail1],
  fruit_salad: [papayaSalad2, papayaSalad],
  dessert: [detail4, detail5],
};

// รูปหน้าปกจริงของแต่ละร้าน: วางไฟล์ใน client/src/assets/shops/ ตั้งชื่อตามรหัสร้าน
// เช่น shop-test-01.jpg — Vite อ่านรายชื่อไฟล์ให้อัตโนมัติตอน build ไม่ต้องแก้โค้ดเมื่อเพิ่มรูป
const SHOP_PHOTO_FILES = import.meta.glob('../assets/shops/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});
const SHOP_PHOTOS = Object.fromEntries(
  Object.entries(SHOP_PHOTO_FILES).map(([path, url]) => [
    path.split('/').pop().replace(/\.[^.]+$/, ''),
    url,
  ])
);

function hashOf(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// รูปหน้าปกร้าน: ใช้รูปของร้านก่อน ถ้าไม่มีใช้รูปตัวอย่างตามหมวดอาหาร
export function getShopImage(shop) {
  const photo = shop?.id ? SHOP_PHOTOS[shop.id] : null;
  if (photo) return photo;
  const list = CATEGORY_IMAGES[shop?.category] || [chickenRice, papayaSalad, noodles];
  return list[hashOf(shop?.id) % list.length];
}

export function parseHours(text) {
  const m = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/.exec(text || '');
  return m ? { open: m[1].padStart(5, '0'), close: m[2].padStart(5, '0') } : null;
}

export function effectiveOf(shop) {
  if (shop?.effectiveStatus && typeof shop.effectiveStatus === 'object') return shop.effectiveStatus;
  return getEffectiveStatus(shop, Array.isArray(shop?.todayHours) ? shop.todayHours : []);
}

export function closingText(shop) {
  const status = effectiveOf(shop);
  const h = parseHours(status.todayText);
  if (!h) return status.todayText || shop?.openingHours || '';
  return status.open ? `เปิดถึง ${h.close} น.` : `เปิด ${h.open} น.`;
}

export function hoursText(shop) {
  return effectiveOf(shop).todayText || shop?.openingHours || '-';
}

// U6: เมนูหมดหรือไม่ — รองรับทั้ง is_sold_out (ตามสเปก Task27/28) และ isAvailable (ข้อมูลปัจจุบัน)
export function isSoldOut(menu) {
  if (!menu) return false;
  if (typeof menu.is_sold_out === 'boolean') return menu.is_sold_out;
  return menu.isAvailable === false;
}

export function soldOutMenus(shop) {
  return (shop?.menus || []).filter(isSoldOut);
}

// เมนูที่ราคา 0/ว่าง แสดงเป็น "ราคาตามป้าย" และไม่ถูกนำมาคิดช่วงราคา/ระดับราคา
export const PRICE_ON_LABEL = 'ราคาตามป้าย';

export function isPriceOnLabel(price) {
  const n = Number(price);
  return !Number.isFinite(n) || n <= 0;
}

// ใช้แสดงราคาเมนูทุกจุด: ราคาจริงขึ้นต้นด้วย ฿ ส่วนราคา 0/ว่างแสดงข้อความ
export function formatMenuPrice(price, suffix = '') {
  if (isPriceOnLabel(price)) return PRICE_ON_LABEL;
  return `฿${Number(price).toLocaleString('th-TH')}${suffix}`;
}

function positivePrices(shop) {
  return (shop?.menus || [])
    .map((m) => Number(m.price))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function priceLevel(shop) {
  const prices = positivePrices(shop);
  if (!prices.length) return { symbol: '฿', label: 'ย่อมเยา' };
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  if (avg < 45) return { symbol: '฿', label: 'ย่อมเยา' };
  if (avg < 80) return { symbol: '฿฿', label: 'ปานกลาง' };
  return { symbol: '฿฿฿', label: 'พรีเมียม' };
}

export function priceRange(shop) {
  const prices = positivePrices(shop);
  if (!prices.length) return '';
  return `${Math.min(...prices)}-${Math.max(...prices)}฿`;
}

export function menuSummary(shop, n = 3) {
  return (shop?.menus || []).slice(0, n).map((m) => m.name).join(' • ');
}

export function canteenShort(shop) {
  if (!shop) return '';
  if (shop.canteen === 'sci') return 'โรงอาหาร SCI';
  if (shop.canteen === 'sc') return 'โรงอาหาร SC';
  return 'กรีนแคนทีน';
}

export function locationText(shop) {
  if (!shop) return '';
  return `${canteenShort(shop)} ${shop.boothNumber || ''}`.trim();
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

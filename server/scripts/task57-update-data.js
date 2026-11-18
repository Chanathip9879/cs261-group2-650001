// Task57: จัดหมวดหมู่ใหม่, ตั้งเวลาเปิด-ปิดตามโรงอาหาร, เพิ่มเมนูที่ถูกข้าม (ราคาตามป้าย = price 0)
// ใช้: node server/scripts/task57-update-data.js   (รันซ้ำได้ ผลเหมือนเดิม)
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'data', 'database.json');
const db = JSON.parse(fs.readFileSync(file, 'utf8'));

const CATEGORIES = [
  { id: 'all', name: 'ทั้งหมด', icon: 'Utensils' },
  { id: 'rice_curry', name: 'ข้าวราดแกง', icon: 'Soup' },
  { id: 'made_to_order', name: 'อาหารตามสั่ง/ผัด', icon: 'Flame' },
  { id: 'chicken_rice', name: 'ข้าวจานเดียว', icon: 'Drumstick' },
  { id: 'noodles', name: 'ก๋วยเตี๋ยว/เส้น', icon: 'Bowl' },
  { id: 'papaya_salad', name: 'ส้มตำ/ยำ', icon: 'Sparkles' },
  { id: 'snacks', name: 'ของทานเล่น/ปิ้งทอด', icon: 'Cookie' },
  { id: 'fruit_salad', name: 'สลัด/ผลไม้', icon: 'Salad' },
  { id: 'drinks_dessert', name: 'เครื่องดื่ม', icon: 'CupSoda' },
  { id: 'dessert', name: 'ของหวาน/เบเกอรี่', icon: 'IceCream' },
  { id: 'other', name: 'อื่น ๆ', icon: 'Utensils' },
];
// หมายเหตุ: id chicken_rice และ drinks_dessert ถูกใช้ซ้ำ (เปลี่ยนแค่ชื่อ) เพื่อไม่ให้ไอคอน/รูปฝั่ง client พัง

const CAT = {
  rice_curry: ['shop-green-01', 'shop-green-04', 'shop-sc-05', 'shop-sc-09', 'shop-green-23'],
  made_to_order: ['shop-sc-02', 'shop-green-05', 'shop-green-11', 'shop-green-24', 'shop-green-25'],
  chicken_rice: ['shop-green-08', 'shop-green-03', 'shop-green-06', 'shop-green-07', 'shop-sc-07', 'shop-green-09', 'shop-green-12'],
  noodles: ['shop-sc-06', 'shop-sc-08', 'shop-green-02', 'shop-green-20', 'shop-green-22', 'shop-green-26'],
  papaya_salad: ['shop-sc-01', 'shop-green-10'],
  snacks: ['shop-green-14', 'shop-green-15', 'shop-green-16', 'shop-green-19', 'shop-green-33', 'shop-green-32'],
  fruit_salad: ['shop-green-18', 'shop-green-27'],
  drinks_dessert: ['shop-sc-03', 'shop-sc-04', 'shop-green-17', 'shop-green-21', 'shop-green-30', 'shop-green-31'],
  dessert: ['shop-green-13', 'shop-green-28', 'shop-green-34'],
};
const catName = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));
const catOf = {};
for (const [cat, ids] of Object.entries(CAT)) for (const id of ids) catOf[id] = cat;

const HOURS = { green: '07:00 - 17:00', sc: '07:30 - 17:00' };
const DEMO_HOURS = '08:00 - 21:00';
const SKIPPED = {"shop-sc-05": ["ของทอดตามราคาป้าย"], "shop-green-03": ["ยกทั้งขา"], "shop-green-13": ["เครปกรอบหน้าสั่น (ไข่-น้ำพริกเผา-ปูอัด)", "เครปกรอบหน้าสั่น (นมข้น-กล้วย)", "เครปกรอบหน้าสั่น (บราวนี่-เยลลี่-เรนโบว์)"], "shop-green-17": ["เครื่องดื่มเพื่อสุขภาพ (แก้วเล็ก/แก้วใหญ่)"], "shop-green-18": ["ผลไม้ตามฤดูกาล"], "shop-green-23": ["ข้าวหมกไก่ทอด"], "shop-green-24": ["กะเพราไก่", "กะเพราหมู"], "shop-green-25": ["ราดหน้า"], "shop-green-28": ["Waffle PB (Original)", "Waffle PB (Almond)", "Waffle PB (Chocolate)", "Waffle PB (Pineapple)", "Waffle PB (Milk)", "Waffle PB (White Chocolate)", "Waffle PB (Strawberry)", "Waffle PB (Blueberry)", "Waffle PB (Banana)", "Waffle PB (Ham)", "Waffle PB (Cheese)", "Waffle PB (Sausage)", "Waffle PB (Nutella)"], "shop-green-32": ["ยำเสียบไม้รวมมิตร", "ยำหมูยอ", "ยำมาม่าซิกเนเจอร์", "ยำลูกชิ้นรวม", "ยำปูอัด"], "shop-green-33": ["หมูปิ้งนมสด", "ข้าวเหนียวหมูทอดเชียงราย", "ข้าวเหนียวหมูทอด"]};

db.categories = CATEGORIES;
for (const c of db.canteens) {
  if (c.id === 'green') c.operatingHours = '07:00 - 17:00 น.';
  if (c.id === 'sc') c.operatingHours = '07:30 - 17:00 น.';
}

let changedCat = 0, addedMenus = 0;
for (const s of db.shops) {
  if (s.id.startsWith('shop-test-')) {
    s.openingHours = s.id === 'shop-test-04' ? s.openingHours : DEMO_HOURS;
    continue;
  }
  const cat = catOf[s.id];
  if (!cat) throw new Error('ไม่มีหมวดสำหรับ ' + s.id);
  if (s.category !== cat) changedCat++;
  s.category = cat;
  s.categoryName = catName[cat];
  s.boothNumber = null;
  s.openingHours = HOURS[s.canteen];
  const names = new Set(s.menus.map((m) => m.name));
  for (const name of SKIPPED[s.id] || []) {
    if (names.has(name)) continue;
    s.menus.push({ id: `${s.id}-m${s.menus.length + 1}`, name, price: 0, isAvailable: true });
    addedMenus++;
  }
}
fs.writeFileSync(file, JSON.stringify(db, null, 2) + '\n', 'utf8');
console.log(`เปลี่ยนหมวด ${changedCat} ร้าน, เพิ่มเมนู ${addedMenus} รายการ`);

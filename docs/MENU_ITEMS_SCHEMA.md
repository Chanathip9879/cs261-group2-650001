# Task26 (U6): โครงสร้างข้อมูล `menu_items`

## เหตุผล
เดิมเมนูถูกเก็บซ้อนอยู่ในแต่ละร้าน (`shops[].menus`) การแยกเมนูออกมาเป็นรายการของตัวเอง
ทำให้ Sprint 2 ทำฟีเจอร์ U6 "แจ้งเมนูหมด" ได้ง่าย เพราะแก้สถานะรายเมนูได้โดยไม่ต้องแก้ข้อมูลทั้งร้าน

## โครงสร้าง (`db.menu_items` ใน `server/data/database.json`)

| Field | ชนิด | ความหมาย |
|---|---|---|
| `id` | string | รหัสเมนู (เช่น `m1`) ไม่ซ้ำกันทั้งระบบ |
| `restaurant_id` | string | รหัสร้านเจ้าของเมนู ตรงกับ `shops[].id` (เช่น `shop-green-01`) |
| `name` | string | ชื่อเมนู |
| `price` | number | ราคา (บาท) |
| `is_sold_out` | boolean | `true` = เมนูหมด, `false` = ยังมีขาย (ค่าเริ่มต้น `false`) |

ตัวอย่าง
```json
{ "id": "m1", "restaurant_id": "shop-green-01", "name": "ข้าวราดแกง 1 อย่าง", "price": 35, "is_sold_out": false }
```

## การเปลี่ยน `isAvailable` เป็น `is_sold_out` (ความหมายกลับกัน)

| ค่าเดิม | ค่าใหม่ | ความหมาย |
|---|---|---|
| `isAvailable: true` | `is_sold_out: false` | มีของ ขายได้ |
| `isAvailable: false` | `is_sold_out: true` | เมนูหมด |

ระวัง: ถ้าเขียนโค้ดใหม่ ให้ใช้ `is_sold_out` ใน database และอย่าสลับตรรกะ
ส่วนใน API response ยังส่ง `isAvailable` (= `!is_sold_out`) ให้ด้วย เพื่อให้ฝั่ง client เดิมใช้งานได้

## การเปลี่ยนแปลงในโค้ด

| ไฟล์ | สิ่งที่เปลี่ยน |
|---|---|
| `server/data/database.json` | เพิ่ม `menu_items` และลบ `menus` ออกจากแต่ละร้าน |
| `server/scripts/migrate-menu-items.js` | สคริปต์ย้ายข้อมูล (มีนับก่อน/หลัง และสำรองไฟล์เดิม) |
| `server/utils/menuHelper.js` | ประกอบ `menus` ของแต่ละร้านจาก `menu_items` |
| `server/controllers/shopController.js` | `getShops`, `getShopById`, `toggleShopStatus`, `updateShopDetails` ใช้ `withMenus` |
| `server/controllers/authController.js` | `getMe` อ่านเมนูจาก `menu_items` |

รูปแบบ response ของ `/api/shops` ยังเหมือนเดิม (`shop.menus[]`) ฝั่ง client จึงไม่ต้องแก้

## ผลตรวจจำนวนเมนู
- ก่อนย้าย (`shops[].menus`): **34** รายการ
- หลังย้าย (`menu_items`): **34** รายการ (ตรงกัน)
- เมนูหมดก่อนย้าย (`isAvailable=false`): 4 รายการ / หลังย้าย (`is_sold_out=true`): 4 รายการ (ตรงกัน)
- `id` ไม่ซ้ำกัน

## วิธีรันซ้ำ / ย้อนกลับ
- รันย้ายข้อมูล: `node server/scripts/migrate-menu-items.js` (รันซ้ำได้ ถ้าย้ายแล้วจะไม่ทำอะไร)
- ย้อนกลับ: คัดลอก `server/data/database.backup-before-menu-items.json` ทับ `database.json`

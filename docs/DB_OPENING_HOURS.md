# ตาราง `opening_hours` (Task47 / U13)

เก็บเวลาเปิด-ปิดรายวันของแต่ละร้าน โปรเจกต์นี้ใช้ไฟล์ `server/data/database.json` เป็นฐานข้อมูล
จึงเก็บตารางเป็น key ระดับบนชื่อ `opening_hours` (array ของแถว) คู่กับ `shops`, `canteens`, `categories`

## โครงสร้างตาราง

| คอลัมน์ | ชนิดข้อมูล | Null | คำอธิบาย |
|---|---|---|---|
| `id` | string | ไม่ได้ | รหัสแถว รูปแบบ `oh-001`, `oh-002`, ... (ไม่ซ้ำ) |
| `shop_id` | string | ไม่ได้ | FK ไปที่ `shops[].id` (เช่น `shop-green-01`) |
| `day_of_week` | integer | ไม่ได้ | วันในสัปดาห์ 0-6 โดย 0 = อาทิตย์, 1 = จันทร์, ... , 6 = เสาร์ (ตรงกับ `Date.getDay()`) |
| `open_time` | string `"HH:MM"` | ได้ | เวลาเปิด 24 ชม. เช่น `"07:00"` เป็น `null` เมื่อ `is_closed = true` |
| `close_time` | string `"HH:MM"` | ได้ | เวลาปิด 24 ชม. เช่น `"15:30"` เป็น `null` เมื่อ `is_closed = true` |
| `is_closed` | boolean | ไม่ได้ | `true` = ร้านหยุดทั้งวัน |

ตัวอย่างแถว:

```json
{ "id": "oh-002", "shop_id": "shop-green-01", "day_of_week": 1, "open_time": "07:00", "close_time": "15:30", "is_closed": false }
{ "id": "oh-001", "shop_id": "shop-green-01", "day_of_week": 0, "open_time": null, "close_time": null, "is_closed": true }
```

## ความสัมพันธ์กับตารางร้านอาหาร

- `opening_hours.shop_id` → `shops.id` แบบหนึ่งร้านมีได้หลายแถว (one-to-many) ได้สูงสุด 7 แถวต่อร้าน
- หนึ่งร้านมีได้ 1 แถวต่อ 1 `day_of_week` (คู่ `shop_id` + `day_of_week` ห้ามซ้ำ)
- ฟิลด์ `shops[].openingHours` (string เดิม เช่น `"07:00 - 15:30"`) ยังคงอยู่เหมือนเดิม เพื่อไม่ให้หน้าเว็บและ API ปัจจุบันพัง
  การเปลี่ยนไปใช้ตารางนี้ใน API เป็นงานของ Task45

## กฎตรวจเวลา (Validation)

ตรวจโดย `validateOpeningHour(row, db)` ใน `server/controllers/shopController.js`

1. `shop_id` ต้องมีอยู่ใน `shops`
2. `day_of_week` ต้องเป็นจำนวนเต็ม 0-6
3. `is_closed` ต้องเป็น boolean
4. ถ้า `is_closed = true` → `open_time` และ `close_time` ต้องเป็น `null`
5. ถ้า `is_closed = false` → ทั้งสองค่าต้องเป็นรูปแบบ `HH:MM` (00:00-23:59) และ **`open_time` ต้องน้อยกว่า `close_time`** (เท่ากันไม่ผ่าน)
6. ไม่รองรับร้านที่เปิดข้ามเที่ยงคืน (ปิดหลังเที่ยงคืน) ตามข้อกำหนดข้อ 5

## Helper ใน `shopController.js`

| ฟังก์ชัน | หน้าที่ |
|---|---|
| `validateOpeningHour(row, db)` | ตรวจ 1 แถว คืน array ข้อความ error (ว่าง = ผ่าน) |
| `getOpeningHoursByShop(db, shopId)` | อ่านเวลาของร้านเดียว เรียงตามวัน |
| `setOpeningHours(shopId, rows)` | แทนที่เวลาของร้านเดียว ตรวจทุกแถวก่อน ถ้ามี error จะไม่เขียนไฟล์ คืน `{ ok, data }` หรือ `{ ok: false, errors }` |

ทั้งสามตัวถูก export แต่ยังไม่ผูกกับ route ใด ๆ (Task45 และ Task48 จะนำไปใช้)

## ข้อมูลตัวอย่าง

ครบ 10 ร้าน x 7 วัน = 70 แถว (`oh-001` ถึง `oh-070`) สร้างจาก `openingHours` เดิมของแต่ละร้าน

- ทุกร้านหยุดวันอาทิตย์
- วันจันทร์-เสาร์ใช้เวลาเดียวกับ `openingHours` เดิมของร้านนั้น
- ร้านที่หยุดเพิ่มเป็นข้อมูลตัวอย่างสำหรับทดสอบ (ไม่ใช่ข้อมูลจริงของร้าน):
  - `shop-green-03` หยุดวันเสาร์
  - `shop-sci-03` หยุดวันพุธ
  - `shop-sci-05` หยุดวันเสาร์

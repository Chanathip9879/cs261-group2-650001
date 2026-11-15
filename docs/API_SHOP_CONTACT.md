# ข้อมูลติดต่อร้าน และ Response Format ของ API รายละเอียดร้าน (Task40 / U10)

## Field ใหม่ในตารางร้านอาหาร (`shops[]` ใน `server/data/database.json`)

| Field | ชนิดข้อมูล | Null | กฎตรวจ | คำอธิบาย |
|---|---|---|---|---|
| `phone` | string | ไม่ได้ | ตัวเลข 10 หลัก ขึ้นต้นด้วย `0` (`^0\d{9}$`) | เบอร์โทรร้าน (field เดิม คงไว้) เบอร์เดียวกันใช้ล็อกอินของแม่ค้า |
| `line_id` | string | ได้ | ไม่ว่าง ยาวไม่เกิน 50 ตัวอักษร | LINE ID เช่น `@sample-g01` |
| `facebook` | string | ได้ | ไม่ว่าง ยาวไม่เกิน 200 ตัวอักษร | ชื่อเพจหรือลิงก์ Facebook |
| `other_contact` | string | ได้ | ไม่ว่าง ยาวไม่เกิน 200 ตัวอักษร | ช่องทางอื่น เช่น Instagram หรือข้อความแจ้งวิธีสั่ง |

- `null` หมายถึงร้านไม่มีหรือยังไม่ได้ให้ข้อมูลช่องทางนั้น ฝั่งแสดงผล (Task41) ต้องซ่อนช่องที่เป็น `null`
- ตรวจโดย `validateContact(contact)` ใน `server/controllers/shopController.js` คืน array ข้อความ error (ว่าง = ผ่าน)
- ข้อมูลตัวอย่างตอนนี้ใส่ 3 ร้านเป็นค่าสมมติ (ไม่ใช่ข้อมูลจริงของร้าน) เพื่อทดสอบหน้าแสดงผล:

| ร้าน | line_id | facebook | other_contact |
|---|---|---|---|
| `shop-green-01` | `@sample-g01` | `SAMPLE Shop G01` | `IG: sample_g01` |
| `shop-green-02` | `@sample-g02` | null | null |
| `shop-sci-01` | null | `SAMPLE Shop S01` | `โทรสั่งล่วงหน้าได้ (ข้อมูลตัวอย่าง)` |

ร้านอื่นเป็น `null` ทั้งสามช่อง

## ค่า `pin` ไม่ถูกส่งออกจาก API

`pin` ใช้ล็อกอินของแม่ค้าเท่านั้น (เทียบในฝั่งเซิร์ฟเวอร์ที่ `authController` และ `authMiddleware`) ทุก response ที่ส่งข้อมูลร้านผ่านฟังก์ชัน `toPublicShop(shop)` ซึ่งตัด `pin` ออก
ใช้กับ: `GET /api/shops`, `GET /api/shops/:id`, `PUT /api/shops/:id/status`, `PUT /api/shops/:id/details`, และ endpoint อัปเดตสถานะเมนู

## Response Format: `GET /api/shops/:id`

สำเร็จ (200):

```json
{
  "success": true,
  "data": {
    "id": "shop-green-01",
    "name": "ร้านป้าณี ข้าวราดแกงรสเด็ด",
    "canteen": "green",
    "canteenName": "โรงอาหารกรีนแคนทีน (Green Canteen)",
    "boothNumber": "ล็อค G-01",
    "isOpen": true,
    "statusNote": "เปิดให้บริการตามปกติ",
    "openingHours": "07:00 - 15:30",
    "phone": "0811111111",
    "line_id": "@sample-g01",
    "facebook": "SAMPLE Shop G01",
    "other_contact": "IG: sample_g01",
    "vendorName": "ป้าณี ศรีรังสิต",
    "canteenInfo": { "id": "green", "name": "...", "landmark": "..." }
  }
}
```

(แสดงเฉพาะ field ที่เกี่ยวข้อง ตัวจริงมี field อื่นของร้านด้วย ตามที่เคยส่งอยู่แล้ว)

- ไม่มี field `pin` ใน `data`
- ร้านที่ไม่มีช่องทางใดช่องทางหนึ่ง จะส่ง `"line_id": null` (ไม่ละ key) เพื่อให้ฝั่งแสดงผลตรวจได้ง่าย
- ไม่พบร้าน (404): `{ "success": false, "message": "ไม่พบร้านอาหารที่ระบุ" }`

## ที่ยังไม่ได้ทำ (นอกขอบเขต Task40)

- ยังไม่มี endpoint ให้แม่ค้าแก้ `line_id`, `facebook`, `other_contact` เอง (`PUT /api/shops/:id/details` รับแค่ `openingHours` กับ `statusNote`)
- ข้อมูลจริงของร้านจะมาจากแบบฟอร์มเก็บข้อมูลร้าน ต้องได้รับความยินยอมจากแม่ค้าก่อนแสดงช่องทางติดต่อ

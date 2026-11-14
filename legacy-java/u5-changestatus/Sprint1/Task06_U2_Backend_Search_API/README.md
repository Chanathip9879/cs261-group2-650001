# Task 6: U2: Backend: สร้าง API ค้นหาร้านอาหารที่รองรับพารามิเตอร์ค้นหาจากชื่อร้านและหมวดหมู่อาหาร

## ข้อมูลงาน (Task Details)
- **รหัสงานบน Trello**: `Task6:U2:Backend: สร้างAPIค้นหาร้านอาหารที่รองรับพารามิเตอร์ค้นหาจากชื่อร้านและหมวดหมู่อาหาร`
- **User Story**: `U2: ระบบค้นหาร้านอาหาร`
- **ผู้รับผิดชอบ**: Backend Developer
- **เป้าหมาย**: พัฒนา REST API Endpoint ให้รองรับการค้นหาร้านอาหารและเมนูอาหารอย่างยืดหยุ่น โดยสามารถค้นหาด้วยชื่อร้าน, ชื่อเมนูอาหาร, ระบุหมวดหมู่อาหาร, กรองตามโรงอาหาร (กรีนแคนทีน หรือ คณะวิทย์) และกรองเฉพาะร้านที่เปิดอยู่ได้

---

## รายละเอียด Endpoint (API Specification)

### `GET /api/restaurants/search`

#### Query Parameters:
| พารามิเตอร์ | ชนิด | ตัวเลือก | คำอธิบาย | ตัวอย่าง |
| :--- | :--- | :--- | :--- | :--- |
| `q` หรือ `query` | String | Optional | คำค้นหา (ค้นได้ทั้งชื่อร้านและชื่ออาหาร) | `กะเพรา`, `ก๋วยเตี๋ยว`, `ป้าศรี` |
| `canteen` | String | Optional | กรองตามโรงอาหาร (`GREEN_CANTEEN` หรือ `SCIENCE_FACULTY`) | `GREEN_CANTEEN` |
| `category` | String | Optional | กรองตามหมวดหมู่อาหาร | `RICE_CURRY`, `NOODLES` |
| `status` | String | Optional | กรองสถานะร้าน (`OPEN`, `CLOSED`, `ALL`) | `OPEN` |

#### ตัวอย่าง Request:
```http
GET /api/restaurants/search?canteen=GREEN_CANTEEN&q=ก๋วยเตี๋ยว&status=OPEN
Accept: application/json
```

#### ตัวอย่าง Response (200 OK):
```json
{
  "total": 1,
  "canteenFilter": "GREEN_CANTEEN",
  "data": [
    {
      "id": 2,
      "name": "ก๋วยเตี๋ยวเรืออยุธยา ลุงหนุ่ม",
      "canteen": "GREEN_CANTEEN",
      "canteenNameTh": "โรงอาหารกรีนแคนทีน",
      "stallNumber": "ล็อค 7 กรีนแคนทีน",
      "isOpen": true,
      "openTime": "08:30",
      "closeTime": "16:00",
      "categories": ["ก๋วยเตี๋ยว / บะหมี่"],
      "matchedProducts": [
        {
          "id": 3,
          "name": "ก๋วยเตี๋ยวเรือเนื้อหมก พิเศษ",
          "price": 50.0,
          "isSoldOut": false
        }
      ]
    }
  ]
}
```

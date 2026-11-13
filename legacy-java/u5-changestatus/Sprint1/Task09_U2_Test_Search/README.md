# Task 9: U2: ทดสอบการค้นหาร้านอาหารผ่านการพิมพ์ชื่อและระบุหมวดหมู่

## ข้อมูลงาน (Task Details)
- **รหัสงานบน Trello**: `Task9:U2:ทดสอบการค้นหาร้านอาหารผ่านการพิมพ์ชื่อและระบุหมวดหมู่`
- **User Story**: `U2: ระบบค้นหาร้านอาหาร`
- **ผู้รับผิดชอบ**: QA / Test Automation Engineer
- **เป้าหมาย**: จัดทำชุดการทดสอบ (Test Suite) สำหรับฟังก์ชันการค้นหาและฟิลเตอร์ร้านอาหาร ทั้งแบบ Automated Unit/Integration Test (JUnit 5 + MockMvc) และ HTTP API Test Cases ครอบคลุมการค้นหาด้วยชื่อร้าน, ค้นหาจากชื่อเมนู, การเลือกโรงอาหาร (กรีนแคนทีน / คณะวิทย์) และ Edge Cases ต่างๆ ตามเกณฑ์ Definition of Done (DoD)

---

## สรุปกรณีทดสอบ (Test Cases Matrix)

| Test ID | เงื่อนไขการทดสอบ (Scenario) | Input | ผลลัพธ์ที่คาดหวัง (Expected Result) | สถานะ |
| :--- | :--- | :--- | :--- | :--- |
| **TC-U2-01** | ค้นหาจากชื่อร้านที่มีอยู่จริง | `q=ป้าศรี` | คืนค่าร้านป้าศรี ข้าวแกงปักษ์ใต้ (HTTP 200, count >= 1) | PASS |
| **TC-U2-02** | ค้นหาจากชื่อเมนูอาหาร | `q=กะเพรา` | คืนค่าร้านครัววิทย์ที่มีเมนูกะเพรา (HTTP 200) | PASS |
| **TC-U2-03** | กรองตามโรงอาหารกรีนแคนทีน | `canteen=GREEN_CANTEEN` | ทุกร้านในผลลัพธ์ต้องสังกัด `GREEN_CANTEEN` เท่านั้น | PASS |
| **TC-U2-04** | กรองตามโรงอาหารคณะวิทย์ | `canteen=SCIENCE_FACULTY` | ทุกร้านในผลลัพธ์ต้องสังกัด `SCIENCE_FACULTY` เท่านั้น | PASS |
| **TC-U2-05** | กรองเฉพาะร้านที่เปิดอยู่ | `status=OPEN` | คืนค่าเฉพาะร้านที่ `isOpen == true` | PASS |
| **TC-U2-06** | กรองตามหมวดหมู่อาหาร | `category=NOODLES` | คืนค่าเฉพาะร้านก๋วยเตี๋ยว | PASS |
| **TC-U2-07** | ค้นหาคำที่ไม่มีในระบบ (Edge Case) | `q=พิซซ่าอิตาเลียน12345` | คืนค่า HTTP 200 พร้อม `total: 0` และ `data: []` | PASS |

---

## ไฟล์ในโฟลเดอร์นี้
1. `RestaurantSearchTest.java`: โค้ด Automated Test สำหรับรันด้วย Maven (`mvn test`)
2. `test-search-api.http`: สคริปต์ยิง API ทดสอบผ่าน REST Client
3. `test_search_cases.md`: เอกสาร Definition of Done และผลการทดสอบ

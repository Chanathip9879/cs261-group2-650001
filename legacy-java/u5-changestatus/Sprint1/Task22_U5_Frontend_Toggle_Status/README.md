# Task 22: U5: Frontend: สร้างปุ่ม (Toggle) เพื่อกดเปลี่ยนสถานะเปิด/ปิดร้าน และเชื่อมต่อ API

## ข้อมูลงาน (Task Details)
- **รหัสงานบน Trello**: `Task22:U5:Frontend: สร้างปุ่ม (Toggle) เพื่อกดเปลี่ยนสถานะเปิด/ปิดร้าน และเชื่อมต่อ API`
- **User Story**: `U5: เปลี่ยนสถานะร้าน`
- **ผู้รับผิดชอบ**: Frontend Developer
- **เป้าหมาย**: พัฒนาปุ่ม Toggle Switch ที่ออกแบบพิเศษสำหรับหน้าจอมือถือ (Touch Target >= 48px) พร้อมการเชื่อมต่อ REST API แบบ Asynchronous ไปยัง `PATCH /api/restaurants/{id}/status` โดยใช้เทคนิค **Optimistic UI Updates** เพื่อให้ผู้ใช้รู้สึกตอบสนองทันทีไม่มีสะดุด และมีกลไก Rollback อัตโนมัติหาก API ตอบกลับด้วยความล้มเหลว

---

## ขั้นตอนการทำงาน (Sequence Diagram)

```
[แม่ค้าแตะปุ่ม Toggle]
         |
         v
  [เปลี่ยนสี Switch ทันที (Optimistic UI)]
         |
         v
  [ส่งคำขอ PATCH ไปยัง API พร้อม Bearer Token]
   Header: Authorization: Bearer <token>
   Body: { "status": "OPEN" หรือ "CLOSED" }
         |
         +----------------------------------+
         |                                  |
     (API สำเร็จ 200 OK)             (API ล้มเหลว 4xx/5xx)
         |                                  |
         v                                  v
  [บันทึกสถานะใหม่ถาวร]             [สลับ Toggle กลับสถานะเดิม (Rollback)]
  [แสดง Toast สีเขียว "สำเร็จ"]      [แสดง Toast สีแดง "เกิดข้อผิดพลาด"]
```

---

## ไฟล์ในโฟลเดอร์นี้
1. `toggle-status.js`: คลาสจัดการ Toggle Switch และการยิง API
2. `toggle-switch.css`: สไตล์ CSS แอนิเมชันของสวิตช์
3. `toggle-demo.html`: หน้าจำลองสำหรับทดสอบปุ่มเดี่ยวๆ

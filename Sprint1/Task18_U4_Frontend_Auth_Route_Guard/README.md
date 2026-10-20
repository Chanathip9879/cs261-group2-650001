# Task 18: U4: Frontend: เก็บ token และป้องกัน route

## ข้อมูลงาน (Task Details)
- **รหัสงานบน Trello**: `Task18:U4:Frontend: เก็บ token และป้องกัน route`
- **User Story**: `U4: Log in จัดการร้านอาหาร`
- **ผู้รับผิดชอบ**: Frontend Developer
- **เป้าหมาย**: พัฒนาระบบจัดการ Authentication Token ฝั่งหน้าบ้าน (Client-side Token Management) และระบบป้องกันเส้นทางเข้าถึง (Route Guard / Protected Route) เพื่อรับประกันว่าเฉพาะเจ้าของร้านที่ผ่านการตรวจสอบเบอร์โทรศัพท์และ PIN ถูกต้องเท่านั้น จึงจะสามารถเข้าถึงหน้า Dashboard จัดการร้านและแก้ไขสถานะเปิด/ปิด หรือสต็อกอาหารได้

---

## กลไกการทำงาน (Authentication Flow & Route Guard)

```
[ผู้ใช้กดแท็บ "จัดการร้าน"] 
           |
           v
  [ตรวจเช็ก Token ใน Storage]
     /                   \
   (ไม่มี Token)      (มี Token)
     /                     \
    v                       v
[แสดงหน้าต่าง Login]   [ส่ง Token ไปตรวจสอบที่ /api/auth/me]
                       /                       \
                  (Token ใช้ได้)            (Token หมดอายุ/ไม่ถูกต้อง)
                     /                           \
                    v                             v
           [อนุญาตเข้าสู่ Dashboard]      [ลบ Token + แสดงหน้าต่าง Login]
```

---

## คุณสมบัติเด่นตามแนวทาง ui-ux-pro-max
1. **ออกแบบสำหรับมือถือ (Mobile-First Touch Target)**:
   - ช่องใส่เบอร์โทรศัพท์ 10 หลัก จัดรูปแบบอัตโนมัติ `08X-XXX-XXXX`
   - ช่องใส่ PIN 4-6 หลัก พร้อมปุ่มกดตัวเลขขนาดใหญ่ (Numeric Keypad touch >= 48px)
2. **การเก็บรักษา Token ที่ปลอดภัย**:
   - บันทึกใน `sessionStorage` หรือ `localStorage` พร้อมแนบไปกับ Header `Authorization: Bearer <token>` ทุกครั้งที่เรียก API ส่วนหลังบ้าน
3. **ระบบ Auto-Logout & Token Expiry**:
   - หาก Token หมดอายุ ระบบจะแจ้งเตือนและนำกลับสู่หน้าล็อกอินอย่างนุ่มนวล ไม่เกิดหน้าขาว (No Blank Screen)

---

## ไฟล์ในโฟลเดอร์นี้
1. `auth-guard.js`: สคริปต์ตรวจเช็กสิทธิ์และป้องกันหน้าจัดการร้าน
2. `token-manager.js`: โมดูลจัดเก็บและดึง Token พร้อมระบบล้าง Session
3. `login-modal.html`: ส่วนประกอบ UI หน้าต่างล็อกอินเบอร์โทรและ PIN

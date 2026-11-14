# Task 19: U4: ทำ Unit Test ระบบยืนยันตัวตน และทดสอบความปลอดภัยเบื้องต้น

## ข้อมูลงาน (Task Details)
- **รหัสงานบน Trello**: `Task19:U4:ทำ Unit Test ระบบยืนยันตัวตน และทดสอบความปลอดภัยเบื้องต้น`
- **User Story**: `U4: Log in จัดการร้านอาหาร` (และรองรับ `U7: ความปลอดภัยตอน Log in` ใน Release Plan)
- **ผู้รับผิดชอบ**: Security & QA Engineer
- **เป้าหมาย**: ทดสอบระบบยืนยันตัวตนเจ้าของร้าน (Authentication & Security) ทั้งระดับ Unit Level และ Integration Level เพื่อป้องกันช่องโหว่ความปลอดภัย เช่น Brute Force Attack, Timing Attack, Credential Enumeration และ Session Hijacking

---

## รายการตรวจสอบความปลอดภัย (Security Check Items)

| ข้อกำหนดความปลอดภัย | วิธีการป้องกันที่นำมาใช้ | ผลการทดสอบ |
| :--- | :--- | :--- |
| **1. ป้องกัน Brute Force PIN** | นับจำนวนครั้งที่ใส่รหัสผิด หากผิดครบ 5 ครั้ง จะล็อกบัญชี 5 นาที (HTTP 429 Too Many Requests พร้อม Header `Retry-After`) | **PASS** |
| **2. ป้องกัน Password Leakage** | เข้ารหัส PIN ด้วยอัลกอริทึมมาตรฐาน PBKDF2-HMAC-SHA256 พร้อม 120,000 Iterations และ Random Salt 16 ไบต์ | **PASS** |
| **3. ป้องกัน Timing Attack** | ใช้ Constant-time comparison (`MessageDigest.isEqual`) ในการเปรียบเทียบรหัส PIN | **PASS** |
| **4. ป้องกัน Account Enumeration** | ส่งข้อความ Error กลางแบบเดียวกัน ไม่ว่าเบอร์โทรไม่มีในระบบ หรือ PIN ผิด เพื่อไม่ให้คนภายนอกสืบหาเบอร์ในระบบได้ | **PASS** |
| **5. ตรวจสอบรูปแบบข้อมูล (Input Validation)** | บังคับเบอร์โทรต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0 และ PIN ต้องเป็นตัวเลข 4-6 หลักเท่านั้น (HTTP 400 Bad Request) | **PASS** |
| **6. อายุการใช้งานของ Token (Token Expiry)** | กำหนด Token Lifetime 8 ชั่วโมง และลบทันทีเมื่อ Logout (HTTP 204 No Content) | **PASS** |

---

## ไฟล์ในโฟลเดอร์นี้
1. `OwnerAuthSecurityTest.java`: ชุดการทดสอบความปลอดภัยด้วย JUnit 5 + MockMvc
2. `auth_security_report.md`: รายงานผลการประเมินความปลอดภัยตามมาตรฐาน OWASP

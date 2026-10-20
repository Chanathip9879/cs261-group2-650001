# Cs261_section650001_group2
## โครงการเว็บแอปพลิเคชันตรวจสอบสถานะร้านอาหาร โรงอาหาร มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต (TU Canteen)

ระบบเว็บแอปพลิเคชันตรวจสอบสถานะเปิด/ปิดร้านอาหาร และแจ้งเมนูหมด แบบ Mobile-First สำหรับนักศึกษาและบุคลากร มธ.รังสิต

---

### สรุปภาพรวมของโครงการ (Project Overview)
- **วัตถุประสงค์**: เพื่อให้นักศึกษาและบุคลากร มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต สามารถตรวจสอบสถานะร้านอาหารในโรงอาหารแบบ Mobile-First ว่าร้านไหนเปิด/ปิด และเมนูใดหมดแล้วบ้าง
- **ขอบเขตพื้นที่ในระยะเริ่มต้น (Sprint 1)**:
  1. **โรงอาหารกรีนแคนทีน (Green Canteen)**
  2. **โรงอาหารคณะวิทยาศาสตร์และเทคโนโลยี (Science Faculty Canteen)**
- **ฟังก์ชันฝั่งผู้ใช้งานทั่วไป (Students / Users)**:
  - ใช้งานได้ทันที **ไม่ต้องล็อกอิน** (No login required)
  - ค้นหาร้านอาหารตามชื่อร้าน หรือชื่อเมนูอาหาร
  - กรอง (Filter) ตามโรงอาหาร (กรีนแคนทีน / คณะวิทย์) และตามประเภทอาหาร (เช่น ข้าวแกง, อาหารตามสั่ง, ก๋วยเตี๋ยว, เครื่องดื่ม)
  - แสดงสถานะ เปิด/ปิดร้าน ชัดเจน (อารมณ์เดียวกับ Grab Food เมนูหรือร้านที่ปิดจะแสดงสถานะปิดชัดเจนเมื่อรีเฟรช)
  - แสดงสถานะเมนูอาหารที่หมดแล้ว (Sold Out / Out of Stock)
  - ระบบรีวิวและให้คะแนนร้านอาหาร (เขียนรีวิวได้ทันทีโดยไม่ต้องล็อกอิน)
- **ฟังก์ชันฝั่งเจ้าของร้าน (Merchants / Owners)**:
  - เข้าสู่ระบบด้วย **เบอร์โทรศัพท์ (10 หลัก) + PIN (4-6 หลัก)** รวดเร็ว ปลอดภัย ไม่ต้องเสียค่าบริการ SMS OTP
  - ปุ่ม Toggle เปิด/ปิดร้าน ขนาดใหญ่ใช้งานง่ายบนมือถือ
  - ตั้งเวลาเปิด-ปิดร้านอัตโนมัติ (Opening & Closing Hours)
  - ระบบจัดการสต็อกเมนูอาหาร: กดสลับสถานะ "เมนูหมด" หรือ "พร้อมขาย" ได้ทันที
  - เพิ่มและแก้ไขเมนูอาหารของร้าน
- **ฟังก์ชันฝั่งผู้ดูแลระบบ (Admin)**:
  - เพิ่มร้านอาหารใหม่เข้าสู่ระบบ พร้อมกำหนดโรงอาหารและหมวดหมู่

---

### โครงสร้างโฟลเดอร์ตาม Trello To Do Tasks

| โฟลเดอร์ | ชื่องานตาม Trello Card | User Story | รายละเอียดงานที่ทำ |
| :--- | :--- | :--- | :--- |
| `Task24_Sprint1_Infrastructure_DevEnvironment` | Task24:Sprint1:Infrastructure: กำหนดและเตรียมสภาพแวดล้อมพัฒนา | Infra | กำหนด Tech Stack, Tools, Ports, Node/Java, Docker, และสภาพแวดล้อม |
| `Task25_Sprint1_Infrastructure_Docker` | Task25:Sprint1:Infrastructure: เขียน Dockerfile + docker-compose | Infra | สร้าง Dockerfile, docker-compose.yml และสคริปต์รัน container (App + SQL Server) |
| `Task05_U2_Database_Category_Relation` | Task5:U2:Database: เพิ่มหรือจัดการความสัมพันธ์ของตารางข้อมูลร้านและหมวดหมู่ | U2 | SQL Schema DDL, Entity JPA, Data Seed ร้านและหมวดหมู่ใน มธ. |
| `Task06_U2_Backend_Search_API` | Task6:U2:Backend: สร้างAPIค้นหาร้านอาหารที่รองรับพารามิเตอร์ชื่อและหมวดหมู่ | U2 | REST API `/api/restaurants/search` รองรับ query, category, canteen |
| `Task09_U2_Test_Search` | Task9:U2:ทดสอบการค้นหาร้านอาหารผ่านการพิมพ์ชื่อและระบุหมวดหมู่ | U2 | Unit Tests, Integration Tests, HTTP Client scripts, Test report |
| `Task10_11_13_14_U3_GPS_Canceled_Canteen_Location` | Task10, 11, 13, 14:U3: พิกัด GPS แผนที่ (ยกเลิกตามเงื่อนไขผู้ใช้) | U3 | เอกสารสรุปขอยกเลิก GPS เนื่องจากมีค่าใช้จ่าย และใช้ระบบ Canteen Preset แทน |
| `Task15_U4_Database_Owners` | Task15:U4:Database: สร้างตาราง owners | U4 | DDL ตาราง owners, FK เชื่อมต่อร้านอาหาร, Hash PIN ด้วย PBKDF2/BCrypt |
| `Task18_U4_Frontend_Auth_Route_Guard` | Task18:U4:Frontend: เก็บ token และป้องกัน route | U4 | ระบบเก็บ Session Token, Route Guard ป้องกันหน้า Dashboard |
| `Task19_U4_UnitTest_Auth_Security` | Task19:U4:ทำ Unit Test ระบบยืนยันตัวตน และทดสอบความปลอดภัยเบื้องต้น | U4 | Test Cases การล็อกอิน, Rate Limiting (กัน Brute Force 5 ครั้ง), Brute force defense |
| `Task21_U5_Frontend_Owner_Dashboard` | Task21:U5:Frontend: สร้างUI หน้า Dashboard สำหรับให้เจ้าของร้าน | U5 | หน้า Dashboard เจ้าของร้าน Mobile-First, จัดการเมนู, แจ้งเมนูหมด, ตั้งเวลา |
| `Task22_U5_Frontend_Toggle_Status` | Task22:U5:Frontend: สร้างปุ่ม (Toggle) เพื่อกดเปลี่ยนสถานะเปิด/ปิดร้าน | U5 | ปุ่ม Toggle Switch สวยงาม ขนาด >=44px พร้อม API Update Real-time |
| `Task23_U5_Test_Authorization_Data` | Task23:U5:ทดสอบสิทธิ์การเข้าถึง และทดสอบความถูกต้องของข้อมูล | U5 | Test ป้องกันเจ้าของร้านข้ามไปแก้ร้านอื่น (RBAC 403 Forbidden) |
| `Runnable_WebApp_TU_Canteen` | **ระบบเว็บแอปพลิเคชันตัวเต็ม พร้อมรันได้ทันที** | All | Fullstack Web Application พร้อมรันด้วย `node server.js` หรือ Docker |

---

### วิธีการรันระบบเพื่อทดสอบ
ดับเบิ้ลคลิกที่ไฟล์ **`run-web.bat`** ที่โฟลเดอร์หลัก ระบบจะเปิดเซิร์ฟเวอร์และเปิดเบราว์เซอร์ไปที่ `http://localhost:3000` ทันที

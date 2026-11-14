# Development Setup Guide: TU Canteen WebApp

คู่มือนี้จัดทำขึ้นเพื่อให้สมาชิกกลุ่ม 2 (วิชา CS261) สามารถเซ็ตอัปเครื่องสำหรับการพัฒนาและทดสอบระบบได้ตรงกัน

### 1. ความต้องการของระบบ (Prerequisites)
- ติดตั้ง **Node.js LTS (v18+)** หรือ **Java 21 JDK**
- ติดตั้ง **Git** และตั้งค่า Username / Email ที่ตรงกับ Dome Mail
- ติดตั้ง **Docker Desktop** (สำหรับทดสอบ Container)

### 2. ลำดับขั้นตอนการเริ่มพัฒนา
1. Clone หรือดึงโค้ดล่าสุดจาก GitHub:
   ```bash
   git checkout sprint1
   git pull origin sprint1
   ```
2. คัดลอกไฟล์คอนฟิก `.env.example` เป็น `.env`
3. รันระบบ WebApp ตัวเต็ม:
   ```bash
   cd Sprint1/Runnable_WebApp_TU_Canteen
   npm install
   npm start
   ```
4. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`
5. ทดสอบการแสดงผลบนหน้าจอมือถือ (กด F12 บน Chrome แล้วกดปุ่ม Toggle Device Toolbar หรือกด `Ctrl+Shift+M`)

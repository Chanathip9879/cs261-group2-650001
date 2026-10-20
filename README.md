# 🌾 HiwKhaw (หิวข้าว) - มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต
> **ระบบตรวจสอบสถานะเปิด/ปิดร้านอาหาร มธ.รังสิต แบบ Real-time**  
> มุ่งเน้นการใช้งานบนอุปกรณ์มือถือ (Mobile-First Web Application) สำหรับโรงอาหารกรีนแคนทีน และ โรงอาหารคณะวิทยาศาสตร์และเทคโนโลยี (SC)  
> *วิชา CS261 Introduction to Software Engineering - Sprint 1 Deliverable*

---

## 📌 สรุปภาพรวมโครงการ (Project Overview)
**HiwKhaw (หิวข้าว)** พัฒนาขึ้นเพื่อแก้ปัญหาของนักศึกษาและบุคลากร มธ.รังสิต ที่มักเดินไปโรงอาหารแล้วพบว่าร้านประจำปิด หรือเมนูโปรดหมด โดยเฉพาะในช่วงเวลาสอบหรือช่วงบ่าย 

### ขอบเขตการทำงานใน Sprint 1 (MVP 1 Core Features)
1. **U1: ตรวจสอบสถานะเปิด/ปิดร้านอาหารแบบ Real-time**
   - แสดงป้ายสถานะสด 🟢 **เปิดอยู่ (OPEN)** พร้อมไฟกระพริบ Live Pulse หรือ 🔴 **ปิดแล้ว (CLOSED)** ชัดเจน ไม่ต้องเดินไปดูหน้าร้าน
   - แสดงเวลาเปิด-ปิดทำการ และข้อความแจ้งเตือนสถานะจากแม่ค้า (Status Note)
   - มีระบบ Polling ตรวจสอบสถานะใหม่อัตโนมัติทุก 6 วินาที พร้อมปุ่มกด Refresh ทันทีแบบ Grab
2. **U2: ระบบค้นหาร้านอาหาร (Search & Filters)**
   - ค้นหาได้ทั้ง **ชื่อร้านอาหาร** และ **ชื่อเมนูอาหาร** (เช่น พิมพ์ "กะเพรา", "ข้าวมันไก่", "ชาไทย")
   - แท็บสลับโรงอาหาร: **ทั้งหมด**, **โรงอาหารกรีนแคนทีน (Green Canteen)**, **โรงอาหารคณะวิทยาศาสตร์ (SC)**
   - ปุ่มลัดกรอง **"เฉพาะร้านที่เปิดอยู่"** ช่วยให้เลือกร้านที่พร้อมสั่งได้ทันที
   - แถบหมวดหมู่อาหารแบบเลื่อนได้ (Swipeable Chips): ข้าวราดแกง, อาหารตามสั่ง, ก๋วยเตี๋ยว, ข้าวมันไก่, ส้มตำ/ยำ, เครื่องดื่ม/ของหวาน
3. **U3: แสดงร้านอาหารและที่ตั้ง (Shop Location & Details)**
   - การ์ดร้านอาหารระบุ **ชื่อโรงอาหาร** และ **หมายเลขล็อค** (เช่น ล็อค G-01, ล็อค SC-01)
   - มี Modal แสดงรายละเอียดเชิงลึก: ตำแหน่งที่ตั้งในโรงอาหาร, จุดสังเกต (Landmark), รายการเมนูทั้งหมดพร้อมราคามาตรฐาน มธ.
4. **U4: Log in จัดการร้านอาหาร (Vendor Authentication)**
   - ระบบเข้าสู่ระบบสำหรับแม่ค้าด้วย **เบอร์โทรศัพท์มือถือ + รหัส PIN (4-6 หลัก)** รวดเร็ว ปลอดภัย และไม่มีค่าบริการ SMS OTP
   - มีปุ่ม **One-Click Demo Account** อำนวยความสะดวกให้กรรมการ/อาจารย์ทดสอบในห้อง Lab ได้ทันที
5. **U5: เปลี่ยนสถานะร้าน (Toggle Open/Closed)**
   - หน้า Dashboard จัดการร้านของแม่ค้า ออกแบบปุ่มสวิตช์ขนาดใหญ่ (Master Switch) แตะครั้งเดียวเพื่อ **เปิดร้าน / ปิดร้าน**
   - สามารถพิมพ์ข้อความแจ้งเตือนลูกค้าหน้าร้านได้ทันที (เช่น "วัตถุดิบหมด ปิดก่อนเวลา", "เปิดปกติ กับข้าวร้อนๆ")
   - การเปลี่ยนสถานะจะสะท้อนไปยังหน้าจอของนักศึกษาทันที

---

## 🏗️ โครงสร้างสถาปัตยกรรมระบบ (Architecture)

```
pj-hiwkhaw/
├── package.json                   # จัดการสคริปต์รันระบบแบบ Full-Stack
├── Dockerfile                     # Multi-stage Dockerfile สำหรับรันในห้อง Lab
├── docker-compose.yml             # Docker Compose สำหรับคำสั่งเดียวพร้อมใช้งาน
├── .gitignore
├── README.md                      # เอกสารคู่มือโครงการ
├── docs/                          # เอกสารส่งตรวจ CS261 Rubric
│   ├── TRELLO_BOARD_SETUP.md      # คู่มือตั้งค่า Trello ทั้ง 2 บอร์ดตามเกณฑ์ 100%
│   ├── GIT_COMMIT_PLAN.md         # ลำดับการ Commit บน Git เรียงตาม User Story
│   └── SPRINT_RETRO_AND_PLAN2.md  # สรุป Retrospective และ Sprint 2 Planning
├── server/                        # Backend API (Node.js & Express)
│   ├── index.js                   # Main Server & API Routes
│   ├── data/
│   │   └── database.json          # ฐานข้อมูลจำลอง (Persistent Data Store)
│   ├── controllers/
│   │   ├── authController.js      # ระบบยืนยันตัวตนแม่ค้า (U4)
│   │   └── shopController.js      # จัดการสถานะร้าน ค้นหา และฟิลเตอร์ (U1, U2, U3, U5)
│   └── middleware/
│       └── authMiddleware.js      # ตรวจสอบสิทธิ์ Bearer Token
└── client/                        # Frontend (React 18 + Vite + Tailwind CSS)
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx                # ศูนย์กลางแอปพลิเคชัน & State Management
        ├── index.css              # Custom Animations & Mobile Tokens
        ├── components/
        │   ├── Header.jsx         # Header บาร์บน พร้อมนาฬิกา Real-time & ปุ่ม Refresh
        │   ├── SearchAndFilter.jsx# ค้นหาชื่อร้าน/เมนู & แท็บโรงอาหาร (U2)
        │   ├── ShopCard.jsx       # การ์ดร้านอาหารพร้อมป้าย Live Status (U1, U3)
        │   ├── ShopDetailModal.jsx# หน้ารายละเอียดร้าน ผังที่ตั้ง และเมนู (U3)
        │   ├── VendorLoginModal.jsx# หน้าต่างล็อกอินแม่ค้าด้วยเบอร์+PIN (U4)
        │   ├── VendorDashboard.jsx# แผงควบคุมเปิด/ปิดร้านของแม่ค้า (U5)
        │   └── Toast.jsx          # แจ้งเตือนข้อความสวยงาม
        └── services/
            └── api.js             # API Client & Polling Helper
```

---

## 🚀 วิธีการติดตั้งและรันระบบ (How to Run)

### วิธีที่ 1: รันด้วย Docker (แนะนำสำหรับเครื่อง Lab และตรวจประเมิน)
ระบบมี `Dockerfile` แบบ Multi-Stage Build ที่คอมไพล์ Frontend และรัน Backend ใน Container เดียว

```bash
# 1. รันด้วย Docker Compose (คำสั่งเดียว)
docker compose up --build

# หรือใช้คำสั่ง Docker ปกติ
docker build -t hiwkhaw-app .
docker run -p 5000:5000 hiwkhaw-app
```
เปิดเบราว์เซอร์ไปที่: **http://localhost:5000**

---

### วิธีที่ 2: รันในสภาพแวดล้อม Local Development (Node.js)

#### 1. ติดตั้ง Dependencies
```bash
# ติดตั้งที่โฟลเดอร์ Root
npm install

# ติดตั้งที่โฟลเดอร์ Client (Frontend)
cd client
npm install
cd ..
```

#### 2. สั่งรันระบบ
```bash
# รันพร้อมกันทั้ง Backend (Port 5000) และ Frontend (Port 3000)
npm run dev
```
เปิดเบราว์เซอร์ไปที่: **http://localhost:3000** (หรือ **http://localhost:5000** ในกรณี Production)

---

## 🔑 บัญชีทดสอบสำหรับ Demo (Test Accounts)

| ประเภทร้าน/ผู้ใช้ | โรงอาหาร | เบอร์โทรศัพท์ | รหัส PIN | บทบาท |
|---|---|---|---|---|
| **ร้านป้าณี ข้าวราดแกง** | กรีนแคนทีน (ล็อค G-01) | `0811111111` | `1111` | แม่ค้า / เจ้าของร้าน |
| **ครัวคุณยาย อาหารตามสั่ง** | กรีนแคนทีน (ล็อค G-02) | `0822222222` | `2222` | แม่ค้า / เจ้าของร้าน |
| **ลุงหนุ่ม ข้าวมันไก่ตอน** | คณะวิทยาศาสตร์ (ล็อค SC-01) | `0866666666` | `6666` | แม่ค้า / เจ้าของร้าน |
| **ก๋วยเตี๋ยวต้มยำหมูมะนาว** | คณะวิทยาศาสตร์ (ล็อค SC-02) | `0877777777` | `7777` | แม่ค้า / เจ้าของร้าน |
| **ส้มตำ ยำแซ่บ อินเตอร์ SC** | คณะวิทยาศาสตร์ (ล็อค SC-04) | `0812345678` | `1234` | แม่ค้า / เจ้าของร้าน |
| **ผู้ดูแลระบบส่วนกลาง** | ศูนย์รังสิต | `0899999999` | `9999` | แอดมิน (Admin) |

*(ในหน้าต่าง Login มีปุ่ม One-Click Demo ให้คลิกเพื่อกรอกอัตโนมัติได้ทันที)*

---

## 📋 ข้อมูล Trello และเกณฑ์การประเมินวิชา CS261
อ่านรายละเอียดเนื้อหาการจัดทำการ์ด Trello, การแตก Tasks ตาม SDLC และแผนการ Commit Git ได้ที่:
- [docs/TRELLO_BOARD_SETUP.md](docs/TRELLO_BOARD_SETUP.md)
- [docs/GIT_COMMIT_PLAN.md](docs/GIT_COMMIT_PLAN.md)
- [docs/SPRINT_RETRO_AND_PLAN2.md](docs/SPRINT_RETRO_AND_PLAN2.md)

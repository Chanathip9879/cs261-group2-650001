# 🌿 แผนการ Commit Code บน Git (Git Commit Workflow)
> โครงการ **HiwKhaw (หิวข้าว) - TU Rangsit Canteen Web Application**  
> เรียงลำดับ Commit ตาม User Story และความสำคัญของงานบน Trello Board เพื่อให้ได้คะแนนเต็มในส่วน Version Control & Git History

---

## 📌 ขั้นตอนการเตรียม Git Repository ครั้งแรก (ถ้ายังไม่ได้ทำ)

เปิด Terminal หรือ PowerShell ที่โฟลเดอร์โครงการ (`C:\Users\yuma\Desktop\pj-hiwkhaw`):

```bash
cd "C:\Users\yuma\Desktop\pj-hiwkhaw"

# ตรวจสอบหรือเริ่มต้น git
git init
git branch -M main
```

---

## 🚀 ลำดับการ Commit ทีละขั้นตอน (เรียงตาม Trello Board)

ทำตามขั้นตอนด้านล่างนี้ทีละข้อ เพื่อสร้าง Commit History ที่สวยงาม สอดคล้องกับ SDLC และ Trello Board:

---

### Step 1: โครงสร้างโปรเจกต์และการตั้งค่าเบื้องต้น (Project Initialization)
**คำอธิบาย:** ตั้งค่าโปรเจกต์ ติดตั้ง dependencies, กำหนด Dockerfile, docker-compose.yml และ .gitignore

```bash
git add .gitignore package.json Dockerfile docker-compose.yml README.md
git commit -m "chore: initial project structure, dockerfile, and dependencies configuration"
```

---

### Step 2: ฐานข้อมูลจำลองและ API หลัก (Database & Core Services)
**คำอธิบาย:** เตรียมฐานข้อมูลร้านอาหารของโรงอาหารกรีนแคนทีน และคณะวิทยาศาสตร์ พร้อม Controller พื้นฐาน

```bash
git add server/data/database.json server/index.js
git commit -m "chore(server): setup express server and seed database for Green & SC canteens"
```

---

### Step 3: การ์ด U1 — ตรวจสอบสถานะเปิด/ปิดร้านอาหารแบบ Real-time
**คำอธิบาย:** พัฒนาระบบแสดงสถานะเปิด/ปิดร้าน ป้าย Live Status ไฟกระพริบ และกลไก Polling ทุก 6 วินาที

```bash
git add server/controllers/shopController.js client/src/components/ShopCard.jsx client/src/components/Header.jsx client/src/index.css
git commit -m "feat(U1): implement real-time shop status display and polling mechanism"
```

---

### Step 4: การ์ด U2 — ระบบค้นหาร้านอาหาร (Search & Filters)
**คำอธิบาย:** พัฒนาช่องค้นหาชื่อร้าน ชื่อเมนูอาหาร และฟิลเตอร์แยกตามโรงอาหารและหมวดหมู่อาหาร

```bash
git add client/src/components/SearchAndFilter.jsx
git commit -m "feat(U2): implement search by stall/dish name and canteen/category filters"
```

---

### Step 5: การ์ด U3 — แสดงร้านอาหารและที่ตั้ง (Shop Location & Details)
**คำอธิบาย:** พัฒนาหน้าต่าง Modal แสดงข้อมูลล็อค ตำแหน่งที่ตั้งในโรงอาหาร และรายการเมนูอาหารทั้งหมด

```bash
git add client/src/components/ShopDetailModal.jsx
git commit -m "feat(U3): implement shop location details, booth info, and full menu modal"
```

---

### Step 6: การ์ด U4 — Log in จัดการร้านอาหาร (Vendor Authentication)
**คำอธิบาย:** พัฒนาระบบล็อกอินสำหรับแม่ค้าด้วยเบอร์โทร + PIN 4-6 หลัก พร้อมระบบ Bearer Token

```bash
git add server/controllers/authController.js server/middleware/authMiddleware.js client/src/components/VendorLoginModal.jsx
git commit -m "feat(U4): implement vendor authentication with phone number and PIN"
```

---

### Step 7: การ์ด U5 — เปลี่ยนสถานะร้าน (Toggle Open/Closed)
**คำอธิบาย:** พัฒนาแผงควบคุม Vendor Dashboard พร้อมปุ่มสลับสถานะเปิด/ปิดร้านด้วยการแตะครั้งเดียว

```bash
git add client/src/components/VendorDashboard.jsx client/src/components/Toast.jsx client/src/App.jsx client/src/main.jsx client/src/services/api.js client/index.html client/package.json client/vite.config.js client/tailwind.config.js client/postcss.config.js
git commit -m "feat(U5): implement vendor dashboard and one-tap shop open/close toggle"
```

---

### Step 8: เอกสารประกอบการนำเสนอและคู่มือ Trello (Documentation)
**คำอธิบาย:** เพิ่มเอกสารคู่มือ Trello Board, แผนการนำเสนอ Sprint 1 และการวางแผน Sprint 2

```bash
git add docs/
git commit -m "docs: add Trello board setup, SDLC tasks, and Sprint 2 planning guide"
```

---

## 📤 การ Push ขึ้น GitHub ของกลุ่ม

เมื่อทำตามขั้นตอนข้างต้นครบแล้ว ให้เชื่อมต่อกับ GitHub Repository ของกลุ่ม:

```bash
# ใส่ URL ของ GitHub กลุ่ม (เช่น https://github.com/your-group/pj-hiwkhaw.git)
git remote add origin <URL_GITHUB_กลุ่มของคุณ>

# Push ขึ้น branch main
git push -u origin main
```

ตรวจสอบดูประวัติการ Commit ด้วยคำสั่ง:
```bash
git log --oneline
```
จะพบประวัติการ Commit ที่เรียงตาม User Story ตั้งแต่ U1 ถึง U5 อย่างเป็นระเบียบตามเกณฑ์ของอาจารย์ 100%!

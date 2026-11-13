# Task 24: Sprint 1: Infrastructure: กำหนดและเตรียมสภาพแวดล้อมพัฒนา

## ข้อมูลงาน (Task Details)
- **รหัสงานบน Trello**: `Task24:Sprint1:Infrastructure: กำหนดและเตรียมสภาพแวดล้อมพัฒนา`
- **User Story**: Sprint 1 Technical & Infrastructure Backlog
- **ผู้รับผิดชอบ**: DevOps / Fullstack Engineer
- **เป้าหมาย**: กำหนดสเปกของเครื่องมือพัฒนา (Development Environment), ภาษาโปรแกรม, ฐานข้อมูล, ไลบรารี และข้อกำหนดการทำงานร่วมกันของทีม ให้สอดคล้องกับหัวข้อการนำเสนอตามเกณฑ์ Rubric (หัวข้อสภาพแวดล้อม Development Environment)

---

## สภาพแวดล้อมและเครื่องมือที่กำหนด (Environment Specification)

### 1. ภาษาและรันไทม์ (Runtime & SDK)
- **Node.js**: เวอร์ชัน 20.x หรือ 22.x LTS (สำหรับการรัน WebApp, Frontend และ REST API Service)
- **Java**: OpenJDK 21 LTS (สำหรับส่วน Spring Boot Service ของกลุ่ม)
- **Package Manager**: `npm` v10+ หรือ `yarn` v1.22+ / Maven Wrapper (`./mvnw`)

### 2. ฐานข้อมูล (Database)
- **Development / Demo**: SQLite หรือ In-Memory JSON Database (ทำให้แอปพลิเคชัน Standalone รันได้ทันทีโดยไม่ต้องติดตั้ง Server เพิ่มเติมในเครื่องห้อง Lab)
- **Production / Group Integration**: Microsoft SQL Server 2022 หรือ PostgreSQL บน Docker Container

### 3. พอร์ตและการเชื่อมต่อ (Port Allocation)
- **Frontend / Fullstack WebApp**: Port `3000` (หรือ `8080` สำหรับ Spring Boot)
- **REST API Backend**: `http://localhost:3000/api` หรือ `http://localhost:8080/api`
- **Database (SQL Server)**: Port `1433`

### 4. มาตรฐานโค้ดและ Git Workflow
- **Branching Strategy**: 
  - `main`: Production / Presentation Ready
  - `sprint1`: Branch สำหรับพัฒนา Sprint 1
  - `feature/task-X`: Branch สำหรับงานแต่ละการ์ดบน Trello
- **Commit Message Convention**: Angular/Conventional Commits เช่น `feat:`, `fix:`, `docs:`, `test:`, `refactor:`

---

## สิ่งที่ได้จัดทำใน Task นี้
1. กำหนดข้อกำหนด Environment Specification ในรูปแบบ `env-spec.json`
2. สร้างไฟล์ `.env.example` เป็นแม่แบบการตั้งค่าคอนฟิก
3. จัดทำเอกสารคู่มือการติดตั้งและเตรียมเครื่องสำหรับสมาชิกในทีม `development-guide.md`

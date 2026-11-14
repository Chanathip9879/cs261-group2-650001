# Task 25: Sprint 1: Infrastructure: เขียน Dockerfile + docker-compose (app + sqlserver) และทดสอบ

## ข้อมูลงาน (Task Details)
- **รหัสงานบน Trello**: `Task25:Sprint1:Infrastructure: เขียน Dockerfile + docker-compose (app + sqlserver) และทดสอบ`
- **User Story**: Sprint 1 Technical & Infrastructure Backlog
- **ผู้รับผิดชอบ**: DevOps / Cloud Engineer
- **เป้าหมาย**: สร้าง `Dockerfile` และ `docker-compose.yml` สำหรับสร้าง Container Image และรัน Container ทั้งส่วน Web Application และ Database (SQL Server) เพื่อนำไปสาธิตและทดสอบรันบนเครื่องในห้อง Lab ตามเกณฑ์การประเมิน (30% ของส่วน Sprint Demo)

---

## สถาปัตยกรรม Container (Container Architecture)
ระบบถูกออกแบบให้ทำงานร่วมกันผ่าน Docker Network (`canteen-network`):

1. **`tu-canteen-app`**:
   - Container รัน Web Application (Mobile-first UI + REST API)
   - Port ที่เปิดใช้งาน: `3000:3000` (หรือ `8080:8080`)
   - มี Healthcheck endpoint ตรวจสอบความพร้อมการทำงาน

2. **`tu-canteen-db` (SQL Server)**:
   - Image: `mcr.microsoft.com/mssql/server:2022-latest`
   - Port ที่เปิดใช้งาน: `1433:1433`
   - มี Persistent Volume `sqlserver_data` สำหรับเก็บข้อมูลถาวร
   - มี Initialization Script `init-sqlserver.sql` เพื่อสร้างตารางและ Seed ข้อมูลเริ่มต้น

---

## คำสั่งการใช้งาน (Docker Commands)

### 1. สั่ง Build และรันทั้งระบบด้วย Docker Compose:
```bash
docker compose up -d --build
```

### 2. ตรวจสอบสถานะของ Containers:
```bash
docker compose ps
```

### 3. ดู Log การทำงาน:
```bash
docker compose logs -f app
```

### 4. สั่งหยุดการทำงาน:
```bash
docker compose down
```

### 5. สั่งหยุดและล้างข้อมูล Volume เก่าเพื่อเริ่มใหม่:
```bash
docker compose down -v
```

# Task 15: U4: Database: สร้างตาราง owners

## ข้อมูลงาน (Task Details)
- **รหัสงานบน Trello**: `Task15:U4:Database: สร้างตาราง owners`
- **User Story**: `U4: Log in จัดการร้านอาหาร`
- **ผู้รับผิดชอบ**: Database Developer
- **เป้าหมาย**: ออกแบบและสร้างตาราง `owners` ในฐานข้อมูล เพื่อรองรับระบบล็อกอินของเจ้าของร้าน (แม่ค้า) ด้วย **เบอร์โทรศัพท์ (10 หลัก) + PIN (4-6 หลัก)** โดยคำนึงถึงความปลอดภัย (Security by Design) ห้ามเก็บ PIN เป็น Plaintext ต้องเก็บเป็นค่า Hash ปลอดภัยด้วย PBKDF2/BCrypt และมี Foreign Key ผูกกับร้านอาหารที่ตนเองเป็นเจ้าของ

---

## Data Dictionary: ตาราง `owners`

| ชื่อฟิลด์ (Column) | ประเภทข้อมูล (Type) | คีย์ / ข้อกำหนด | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | รหัสประจำตัวเจ้าของร้าน |
| `phone` | VARCHAR(10) | UNIQUE, NOT NULL | หมายเลขโทรศัพท์ 10 หลัก (เช่น `0812345678`) |
| `pin_hash` | VARCHAR(255) | NOT NULL | ค่า Salted Hash ของรหัส PIN (เช่น PBKDF2/BCrypt) |
| `restaurant_id` | BIGINT | NOT NULL, FOREIGN KEY | รหัสร้านอาหารที่สังกัด (ผูกกับตาราง `restaurants.id`) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | วันที่และเวลาที่สร้างบัญชี |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | วันที่และเวลาแก้ไขข้อมูลล่าสุด |

---

## ความสัมพันธ์ (Relationship)
- ตาราง `owners` สัมพันธ์กับตาราง `restaurants` ในลักษณะ **1:1 หรือ N:1 (เจ้าของ 1 คนดูแลร้านที่ตนเองรับผิดชอบ)**
- ใช้ Foreign Key Constraint ป้องกัน Orphan Records:
  ```sql
  CONSTRAINT fk_owner_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
  ```

---

## ไฟล์ในโฟลเดอร์นี้
1. `create_owners_table.sql`: คำสั่ง DDL สร้างตารางสำหรับทั้ง MySQL, PostgreSQL และ SQL Server
2. `seed_owners.sql`: ข้อมูลตัวอย่างสำหรับใช้ทดสอบการล็อกอินใน Sprint Demo
3. `OwnerEntity.java`: JPA Entity Class สำหรับ Spring Boot
4. `OwnerRepository.java`: JPA Repository Interface

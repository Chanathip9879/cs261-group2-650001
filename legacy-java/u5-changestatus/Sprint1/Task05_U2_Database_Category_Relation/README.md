# Task 5: U2: Database: เพิ่มหรือจัดการความสัมพันธ์ของตารางข้อมูลร้านและหมวดหมู่อาหาร

## ข้อมูลงาน (Task Details)
- **รหัสงานบน Trello**: `Task5:U2:Database: เพิ่มหรือจัดการความสัมพันธ์ของตารางข้อมูลร้านและหมวดหมู่อาหาร`
- **User Story**: `U2: ระบบค้นหาร้านอาหาร`
- **ผู้รับผิดชอบ**: Database Developer
- **เป้าหมาย**: ออกแบบและสร้างโครงสร้างฐานข้อมูล (Data Schema & Relationships) เชื่อมโยงระหว่าง "ร้านอาหาร" (Restaurants) และ "หมวดหมู่อาหาร" (Categories) พร้อมตารางตัวกลาง (Junction Table: `restaurant_categories`) แบบ Many-to-Many เพื่อให้ 1 ร้านอาหาร สามารถมีได้หลายหมวดหมู่ (เช่น ข้าวแกง และ อาหารฮาลาล) และ 1 หมวดหมู่สามารถมีได้หลายร้าน

---

## โครงสร้าง Entity Relationship (ER Diagram)

```
+--------------------+         +------------------------+         +--------------------+
|    restaurants     |         |  restaurant_categories |         |     categories     |
+--------------------+         +------------------------+         +--------------------+
| id (PK)            |<---1---*| restaurant_id (PK, FK) |*---1--->| id (PK)            |
| name               |         | category_id   (PK, FK) |         | code (Unique)      |
| canteen_code (FK)  |         +------------------------+         | name_th            |
| is_open            |                                            | icon               |
| open_time          |                                            +--------------------+
| close_time         |
+--------------------+
          | *
          |
          | 1
+--------------------+
|      canteens      |
+--------------------+
| code (PK)          |
| name_th            |
+--------------------+
```

---

## ไฟล์ในโฟลเดอร์นี้
1. `schema_categories.sql`: คำสั่ง DDL สร้างตาราง `categories`, `restaurant_categories` และ Foreign Keys
2. `seed_data.sql`: ข้อมูลเริ่มต้นสำหรับโรงอาหารกรีนแคนทีน และ โรงอาหารคณะวิทยาศาสตร์ พร้อมหมวดหมู่
3. `Category.java`: JPA Entity สำหรับ Spring Boot
4. `CategoryRepository.java`: Spring Data JPA Repository ค้นหาตามชื่อและหมวดหมู่

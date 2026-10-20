-- SQL Server Initialization Script for TU Canteen Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'tu_canteen_db')
BEGIN
    CREATE DATABASE tu_canteen_db;
END
GO

USE tu_canteen_db;
GO

-- 1. ตารางโรงอาหาร (Canteens)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'canteens')
BEGIN
    CREATE TABLE canteens (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name_th NVARCHAR(150) NOT NULL,
        name_en VARCHAR(150) NOT NULL,
        location_desc NVARCHAR(255)
    );

    INSERT INTO canteens (code, name_th, name_en, location_desc)
    VALUES
    ('GREEN_CANTEEN', N'โรงอาหารกรีนแคนทีน (Green Canteen)', 'Green Canteen', N'ใกล้หอพักและอาคารเรียนรวม มธ.รังสิต'),
    ('SCIENCE_FACULTY', N'โรงอาหารคณะวิทยาศาสตร์และเทคโนโลยี', 'Science Faculty Canteen', N'ใต้อาคารบรรยายรวม คณะวิทยาศาสตร์ มธ.รังสิต');
END
GO

-- 2. ตารางหมวดหมู่อาหาร (Categories)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'categories')
BEGIN
    CREATE TABLE categories (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name_th NVARCHAR(100) NOT NULL,
        icon VARCHAR(50)
    );

    INSERT INTO categories (code, name_th, icon)
    VALUES
    ('RICE_CURRY', N'ข้าวแกง', 'rice-bowl'),
    ('A_LA_CARTE', N'อาหารตามสั่ง', 'chef-hat'),
    ('NOODLES', N'ก๋วยเตี๋ยว / บะหมี่', 'noodles'),
    ('BEVERAGES', N'เครื่องดื่ม / กาแฟ', 'cup'),
    ('DESSERT', N'ของหวาน / เบเกอรี่', 'ice-cream'),
    ('HALAL', N'อาหารฮาลาล', 'check-circle');
END
GO

-- 3. ตารางร้านอาหาร (Restaurants)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'restaurants')
BEGIN
    CREATE TABLE restaurants (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        canteen_code VARCHAR(50) NOT NULL,
        is_open BIT NOT NULL DEFAULT 0,
        open_time VARCHAR(10) DEFAULT '07:30',
        close_time VARCHAR(10) DEFAULT '16:00',
        rating DECIMAL(3,2) DEFAULT 4.5,
        review_count INT DEFAULT 0,
        stall_number NVARCHAR(50),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- 4. ตารางเจ้าของร้าน (Owners) สำหรับล็อกอินเบอร์โทร + PIN
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'owners')
BEGIN
    CREATE TABLE owners (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        phone VARCHAR(10) NOT NULL UNIQUE,
        pin_hash NVARCHAR(255) NOT NULL,
        restaurant_id BIGINT NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    );
END
GO

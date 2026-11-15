-- ============================================================================
-- Migration: Sprint 2 Backend Tasks (Task 33, Task 37, Task 48)
-- Author: Nuttakorn
-- ============================================================================

-- 1. ตรวจสอบคอลัมน์พิกัดร้านอาหารสำหรับ Task 33 (ต่อยอดจาก Task 32)
-- หมายเหตุ: หากตาราง shops มีคอลัมน์ latitude และ longitude อยู่แล้ว สามารถข้าม 2 บรรทัดนี้ได้
ALTER TABLE shops ADD COLUMN latitude DOUBLE PRECISION NULL;
ALTER TABLE shops ADD COLUMN longitude DOUBLE PRECISION NULL;

-- 2. สร้างตารางรีวิวร้านอาหารสำหรับ Task 37 (U9)
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(64) PRIMARY KEY,
    shop_id VARCHAR(64) NOT NULL,
    username VARCHAR(100) NOT NULL,
    rating INT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    client_ip VARCHAR(64) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reviews_shop_id ON reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- 3. สร้างตารางเวลาเปิด/ปิดประจำสัปดาห์สำหรับ Task 48 (U13 - ต่อยอดจาก Task 47)
CREATE TABLE IF NOT EXISTS opening_hours (
    id VARCHAR(64) PRIMARY KEY,
    shop_id VARCHAR(64) NOT NULL,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    open_time VARCHAR(5) NULL,
    close_time VARCHAR(5) NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_shop_day UNIQUE (shop_id, day_of_week),
    CONSTRAINT fk_opening_hours_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- 4. สร้างตารางวันหยุดพิเศษสำหรับ Task 48 (U13)
CREATE TABLE IF NOT EXISTS special_holidays (
    id VARCHAR(64) PRIMARY KEY,
    shop_id VARCHAR(64) NOT NULL,
    holiday_date DATE NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT TRUE,
    open_time VARCHAR(5) NULL,
    close_time VARCHAR(5) NULL,
    note VARCHAR(255) NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_shop_holiday_date UNIQUE (shop_id, holiday_date),
    CONSTRAINT fk_special_holidays_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);
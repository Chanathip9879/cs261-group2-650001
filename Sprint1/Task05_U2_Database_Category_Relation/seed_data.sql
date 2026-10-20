-- Seed Data for TU Canteen: Green Canteen & Science Faculty
-- หมวดหมู่อาหาร
INSERT INTO categories (id, code, name_th, icon) VALUES
(1, 'RICE_CURRY', 'ข้าวแกง', 'rice-bowl'),
(2, 'A_LA_CARTE', 'อาหารตามสั่ง', 'chef-hat'),
(3, 'NOODLES', 'ก๋วยเตี๋ยว / บะหมี่', 'noodles'),
(4, 'BEVERAGES', 'เครื่องดื่ม / ชา กาแฟ', 'cup'),
(5, 'CHICKEN_RICE', 'ข้าวมันไก่ / ข้าวหมูกรอบ', 'drumstick'),
(6, 'HALAL', 'อาหารฮาลาล', 'check-circle')
ON DUPLICATE KEY UPDATE name_th=VALUES(name_th);

-- ร้านอาหารตัวอย่าง
-- โรงอาหารกรีนแคนทีน (Green Canteen)
INSERT INTO restaurants (id, name, canteen_code, is_open, open_time, close_time, stall_number) VALUES
(1, 'ร้านป้าศรี ข้าวแกงปักษ์ใต้', 'GREEN_CANTEEN', 1, '07:00', '15:30', 'ล็อค 3 กรีนแคนทีน'),
(2, 'ก๋วยเตี๋ยวเรืออยุธยา ลุงหนุ่ม', 'GREEN_CANTEEN', 1, '08:30', '16:00', 'ล็อค 7 กรีนแคนทีน'),
(3, 'ชาพะยอม & เครื่องดื่มเพื่อสุขภาพ', 'GREEN_CANTEEN', 1, '07:30', '17:00', 'ล็อค 12 กรีนแคนทีน'),

-- โรงอาหารคณะวิทยาศาสตร์และเทคโนโลยี (Science Faculty)
(4, 'ครัววิทย์ อาหารตามสั่งติดแอร์', 'SCIENCE_FACULTY', 1, '08:00', '16:30', 'ห้อง SC1 โรงอาหารวิทย์'),
(5, 'ข้าวมันไก่ตอน สูตรเบตง', 'SCIENCE_FACULTY', 0, '07:30', '14:30', 'ห้อง SC4 โรงอาหารวิทย์'),
(6, 'ป้าใจ ก๋วยเตี๋ยวต้มยำมะนาวสด', 'SCIENCE_FACULTY', 1, '08:30', '15:30', 'ห้อง SC6 โรงอาหารวิทย์')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- เชื่อมโยงร้านกับหมวดหมู่ (restaurant_categories)
INSERT INTO restaurant_categories (restaurant_id, category_id) VALUES
(1, 1), -- ป้าศรี -> ข้าวแกง
(2, 3), -- ก๋วยเตี๋ยวเรือ -> ก๋วยเตี๋ยว
(3, 4), -- ชาพะยอม -> เครื่องดื่ม
(4, 2), -- ครัววิทย์ -> อาหารตามสั่ง
(5, 5), -- ข้าวมันไก่ -> ข้าวมันไก่
(6, 3); -- ป้าใจ -> ก๋วยเตี๋ยว

-- เมนูอาหารและสถานะของหมด (Products)
INSERT INTO products (id, restaurant_id, name, price, is_sold_out, category_id) VALUES
(1, 1, 'ข้าวราดแกงไตปลา + ไข่ต้ม', 45.0, 0, 1),
(2, 1, 'ข้าวราดคั่วกลิ้งหมู', 40.0, 1, 1), -- เมนูหมด (Sold out)
(3, 2, 'ก๋วยเตี๋ยวเรือเนื้อหมก พิเศษ', 50.0, 0, 3),
(4, 2, 'กากหมูเจียวกรอบ', 15.0, 1, 3), -- เมนูหมด (Sold out)
(5, 4, 'กะเพราหมูกรอบไข่ดาว', 55.0, 0, 2),
(6, 4, 'ข้าวผัดต้มยำกุ้ง', 60.0, 0, 2)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed Accounts for Merchant Login Testing (Phone + PIN)
-- PIN ของ 0812345678 คือ '1234'
-- PIN ของ 0898765432 คือ '567890'
-- PIN ของ 0861112222 คือ '9999'

INSERT INTO owners (id, phone, pin_hash, restaurant_id) VALUES
-- ร้านป้าศรี ข้าวแกงปักษ์ใต้ (กรีนแคนทีน)
(1, '0812345678', '120000:7xKzQ2Fv3bL1p0wE:h8B9xY2mN4pK1v7W8z0X3c4V5b6N7m8L9k0J1h2G3f4=', 1),

-- ก๋วยเตี๋ยวเรืออยุธยา ลุงหนุ่ม (กรีนแคนทีน)
(2, '0898765432', '120000:9pLmN3Kj8vT2r5wY:q1W2e3R4t5Y6u7I8o9P0a1S2d3F4g5H6j7K8l9Z0x1=', 2),

-- ครัววิทย์ อาหารตามสั่ง (คณะวิทยาศาสตร์)
(3, '0861112222', '120000:4xTvB1Mn7kL9p2qW:a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T1u2=', 4)
ON DUPLICATE KEY UPDATE pin_hash=VALUES(pin_hash);

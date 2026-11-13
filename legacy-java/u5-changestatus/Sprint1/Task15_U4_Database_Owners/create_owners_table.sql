-- DDL for Owners Table (Task 15: U4)

CREATE TABLE IF NOT EXISTS owners (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(10) NOT NULL UNIQUE,
    pin_hash VARCHAR(255) NOT NULL,
    restaurant_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_owner_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Index สำหรับค้นหาเบอร์โทรศัพท์ได้อย่างรวดเร็วขณะ Login
CREATE INDEX idx_owners_phone ON owners(phone);

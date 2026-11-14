-- DDL Schema for Categories and Relationships (Task 5: U2)

-- 1. ตาราง categories
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_th VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'utensils'
);

-- 2. Junction Table: restaurant_categories (Many-to-Many Relationship)
CREATE TABLE IF NOT EXISTS restaurant_categories (
    restaurant_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (restaurant_id, category_id),
    CONSTRAINT fk_rc_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    CONSTRAINT fk_rc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 3. ตารางเมนูอาหาร (Products / Menu Items)
CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    price DECIMAL(8,2) NOT NULL,
    is_sold_out BOOLEAN NOT NULL DEFAULT FALSE,
    category_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

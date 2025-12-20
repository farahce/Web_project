-- ============================================
-- DAFAH PROJECT - Complete Database Schema
-- ============================================
-- This file creates the complete database structure for the Dafah e-commerce project
-- Database: dafah_db
-- Created: 2025-12-18

-- ============================================
-- 1. DROP EXISTING TABLES (if they exist)
-- ============================================
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS messages;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 2. CREATE USERS TABLE
-- ============================================
CREATE TABLE users (
                       id INT PRIMARY KEY AUTO_INCREMENT,
                       username VARCHAR(100) NOT NULL UNIQUE,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,
                       phone VARCHAR(20),
                       role ENUM('user', 'admin') DEFAULT 'user',
                       address TEXT,
                       city VARCHAR(100),
                       country VARCHAR(100),
                       postal_code VARCHAR(20),
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,
                       is_active BOOLEAN DEFAULT TRUE,
                       INDEX idx_email (email),
                       INDEX idx_username (username)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. CREATE PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
                          id INT PRIMARY KEY AUTO_INCREMENT,
                          name VARCHAR(255) NOT NULL,
                          description TEXT,
                          category VARCHAR(100) NOT NULL,
                          price DECIMAL(10, 2) NOT NULL,
                          discount_price DECIMAL(10, 2),
                          image_url VARCHAR(500),
                          stock_quantity INT DEFAULT 0,
                          rating DECIMAL(3, 2) DEFAULT 0,
                          reviews_count INT DEFAULT 0,
                          is_available BOOLEAN DEFAULT TRUE,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                          INDEX idx_category (category),
                          INDEX idx_name (name),
                          FULLTEXT INDEX ft_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. CREATE CART TABLE
-- ============================================
CREATE TABLE cart (
                      id INT PRIMARY KEY AUTO_INCREMENT,
                      user_id INT NOT NULL,
                      product_id INT NOT NULL,
                      quantity INT NOT NULL DEFAULT 1,
                      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                      UNIQUE KEY unique_user_product (user_id, product_id),
                      INDEX idx_user_id (user_id),
                      INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. CREATE ORDERS TABLE
-- ============================================
CREATE TABLE orders (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        user_id INT NOT NULL,
                        order_number VARCHAR(50) NOT NULL UNIQUE,
                        total_amount DECIMAL(10, 2) NOT NULL,
                        discount_amount DECIMAL(10, 2) DEFAULT 0,
                        final_amount DECIMAL(10, 2) NOT NULL,
                        status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                        payment_method VARCHAR(50),
                        payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
                        shipping_address TEXT,
                        shipping_city VARCHAR(100),
                        shipping_country VARCHAR(100),
                        shipping_postal_code VARCHAR(20),
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        INDEX idx_user_id (user_id),
                        INDEX idx_status (status),
                        INDEX idx_created_at (created_at),
                        INDEX idx_order_number (order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. CREATE ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
                             id INT PRIMARY KEY AUTO_INCREMENT,
                             order_id INT NOT NULL,
                             product_id INT,
                             product_name VARCHAR(255) NOT NULL,
                             quantity INT NOT NULL,
                             unit_price DECIMAL(10, 2) NOT NULL,
                             total_price DECIMAL(10, 2) NOT NULL,
                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                             FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                             FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
                             INDEX idx_order_id (order_id),
                             INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6b. CREATE NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('sms', 'email') NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_recipient (recipient),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6c. CREATE MESSAGES TABLE (Contact Us)
-- ============================================
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. INSERT SAMPLE DATA - USERS
-- ============================================
INSERT INTO users
(username, email, password, phone, address, city, country, postal_code, role)
VALUES
    ('john_doe', 'john@example.com', '123456',
     '1234567890', '123 Main St', 'New York', 'USA', '10001', 'user');

INSERT INTO users
(username, email, password, phone, address, city, country, postal_code, role)
VALUES

    ('jane_smith', 'jane@example.com', '123456',
     '0987654321', '456 Oak Ave', 'Los Angeles', 'USA', '90001', 'user'),

    ('mike_brown', 'mike@example.com', '123456',
     '1112223333', '789 Pine Rd', 'Chicago', 'USA', '60601', 'user'),

    ('sara_ali', 'sara@example.com', '123456',
     '2223334444', '12 Sunset Blvd', 'San Diego', 'USA', '92101', 'user'),

    ('admin_user', 'admin@example.com', 'admin123',
     '9998887777', '1 Admin Plaza', 'San Francisco', 'USA', '94105', 'admin');

-- ============================================
-- 8. INSERT SAMPLE DATA - PRODUCTS (DONUTS)
-- ============================================
INSERT INTO products (name, description, category, price, discount_price, stock_quantity, rating, reviews_count, is_available) VALUES
                                                                                                                                   ('Classic Glazed Donut', 'Traditional glazed donut with a perfect balance of sweetness', 'donuts', 2.50, 2.00, 50, 4.5, 120, TRUE),
                                                                                                                                   ('Chocolate Frosted', 'Rich chocolate frosting with sprinkles', 'donuts', 3.00, 2.50, 45, 4.7, 95, TRUE),
                                                                                                                                   ('Strawberry Jam Filled', 'Soft donut filled with fresh strawberry jam', 'donuts', 3.50, 3.00, 30, 4.6, 78, TRUE),
                                                                                                                                   ('Boston Cream', 'Creamy vanilla custard filling with chocolate top', 'donuts', 3.75, 3.25, 25, 4.8, 110, TRUE),
                                                                                                                                   ('Maple Bar', 'Maple glazed bar donut with bacon bits', 'donuts', 4.00, 3.50, 20, 4.9, 85, TRUE),
                                                                                                                                   ('Cinnamon Sugar', 'Warm cinnamon and sugar coating', 'donuts', 2.75, 2.25, 55, 4.4, 92, TRUE),
                                                                                                                                   ('Lemon Zest', 'Bright lemon flavor with glaze', 'donuts', 3.25, 2.75, 35, 4.3, 68, TRUE),
                                                                                                                                   ('Cookies & Cream', 'Crushed cookies mixed into the donut', 'donuts', 3.50, 3.00, 28, 4.6, 105, TRUE);

-- ============================================
-- 9. INSERT SAMPLE DATA - PRODUCTS (COOKIES)
-- ============================================
INSERT INTO products (name, description, category, price, discount_price, stock_quantity, rating, reviews_count, is_available) VALUES
                                                                                                                                   ('Chocolate Chip Cookie', 'Classic chocolate chip cookie', 'cookies', 1.50, 1.25, 100, 4.5, 200, TRUE),
                                                                                                                                   ('Oatmeal Raisin', 'Chewy oatmeal with plump raisins', 'cookies', 1.75, 1.50, 80, 4.3, 145, TRUE),
                                                                                                                                   ('Peanut Butter', 'Creamy peanut butter cookie', 'cookies', 2.00, 1.75, 60, 4.6, 175, TRUE),
                                                                                                                                   ('Sugar Cookie', 'Soft and sweet sugar cookie', 'cookies', 1.50, 1.25, 90, 4.4, 160, TRUE),
                                                                                                                                   ('Double Chocolate', 'Intense chocolate flavor', 'cookies', 2.25, 2.00, 50, 4.7, 190, TRUE),
                                                                                                                                   ('Macadamia Nut', 'Premium macadamia nuts', 'cookies', 2.50, 2.25, 40, 4.8, 120, TRUE);

-- ============================================
-- 10. INSERT SAMPLE DATA - PRODUCTS (DRINKS)
-- ============================================
INSERT INTO products (name, description, category, price, discount_price, stock_quantity, rating, reviews_count, is_available) VALUES
                                                                                                                                   ('Iced Coffee', 'Cold brew coffee with ice', 'drinks', 3.50, 3.00, 200, 4.6, 250, TRUE),
                                                                                                                                   ('Cappuccino', 'Espresso with steamed milk', 'drinks', 4.00, 3.50, 150, 4.7, 220, TRUE),
                                                                                                                                   ('Vanilla Latte', 'Smooth vanilla flavored latte', 'drinks', 4.25, 3.75, 140, 4.5, 200, TRUE),
                                                                                                                                   ('Iced Tea', 'Refreshing iced tea', 'drinks', 2.50, 2.00, 250, 4.3, 180, TRUE),
                                                                                                                                   ('Smoothie - Strawberry', 'Fresh strawberry smoothie', 'drinks', 5.00, 4.50, 100, 4.8, 160, TRUE),
                                                                                                                                   ('Smoothie - Mango', 'Tropical mango smoothie', 'drinks', 5.00, 4.50, 95, 4.7, 155, TRUE),
                                                                                                                                   ('Hot Chocolate', 'Rich hot chocolate', 'drinks', 3.75, 3.25, 120, 4.6, 190, TRUE),
                                                                                                                                   ('Espresso Shot', 'Single or double espresso', 'drinks', 2.00, 1.75, 300, 4.4, 210, TRUE);

-- ============================================
-- 11. INSERT SAMPLE DATA - PRODUCTS (GAMES)
-- ============================================
INSERT INTO products (name, description, category, price, discount_price, stock_quantity, rating, reviews_count, is_available) VALUES
                                                                                                                                   ('Arcade Game Token Pack', '50 tokens for arcade games', 'games', 10.00, 8.50, 500, 4.5, 300, TRUE),
                                                                                                                                   ('VR Experience - 30 min', 'Virtual reality gaming experience', 'games', 25.00, 22.00, 50, 4.8, 120, TRUE),
                                                                                                                                   ('Bowling Game Pass', 'One game of bowling for 2 people', 'games', 15.00, 13.00, 100, 4.6, 180, TRUE),
                                                                                                                                   ('Laser Tag Session', '30 minute laser tag game', 'games', 20.00, 18.00, 80, 4.7, 150, TRUE),
                                                                                                                                   ('Escape Room Ticket', 'One escape room experience', 'games', 30.00, 27.00, 40, 4.9, 95, TRUE),
                                                                                                                                   ('Gaming Console Rental', 'PS5 rental for 24 hours', 'games', 35.00, 30.00, 20, 4.8, 75, TRUE);

-- ============================================
-- 12. INSERT SAMPLE DATA - CART
-- ============================================
SELECT id, username FROM users;

INSERT INTO cart (user_id, product_id, quantity) VALUES
                                                     (1, 1, 2),
                                                     (1, 3, 1),
                                                     (1, 5, 3),
                                                     (1, 10, 1);

-- ============================================
-- 13. INSERT SAMPLE DATA - ORDERS
-- ============================================
INSERT INTO orders (user_id, order_number, total_amount, discount_amount, final_amount, status, payment_method, payment_status, shipping_address, shipping_city, shipping_country, shipping_postal_code) VALUES
                                                                                                                                                                                                             (1, 'ORD-2025-001', 25.00, 5.00, 20.00, 'delivered', 'credit_card', 'completed', '123 Main St', 'New York', 'USA', '10001'),
                                                                                                                                                                                                             (2, 'ORD-2025-002', 45.00, 8.00, 37.00, 'shipped', 'paypal', 'completed', '456 Oak Ave', 'Los Angeles', 'USA', '90001'),
                                                                                                                                                                                                             (1, 'ORD-2025-003', 60.00, 10.00, 50.00, 'processing', 'credit_card', 'completed', '123 Main St', 'New York', 'USA', '10001');

-- ============================================
-- 14. INSERT SAMPLE DATA - ORDER_ITEMS
-- ============================================
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES
                                                                                                    (1, 1, 'Classic Glazed Donut', 2, 2.50, 5.00),
                                                                                                    (1, 3, 'Strawberry Jam Filled', 1, 3.50, 3.50),
                                                                                                    (2, 5, 'Maple Bar', 3, 4.00, 12.00),
                                                                                                    (2, 10, 'Chocolate Chip Cookie', 1, 1.50, 1.50),
                                                                                                    (3, 2, 'Chocolate Frosted', 2, 3.00, 6.00),
                                                                                                    (3, 15, 'Cappuccino', 1, 4.00, 4.00);

-- ============================================
-- 15. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_cart_user_product ON cart(user_id, product_id);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================
-- DATABASE SETUP COMPLETE!
-- ============================================
-- Tables created:
-- 1. users - User accounts
-- 2. products - Product catalog
-- 3. cart - Shopping cart items
-- 4. orders - Customer orders
-- 5. order_items - Items in each order
--
-- Sample data has been inserted for testing.
-- You can now use the API endpoints!
-- ============================================
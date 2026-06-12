-- Enable UUID extension if needed, but we can use standard SERIAL/BIGSERIAL or UUIDs.
-- Let's use SERIAL for simplicity and clean auto-increment, or UUIDs. The prompt does not specify, but serial primary keys are solid.

-- ENUMs
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance');
CREATE TYPE day_type AS ENUM ('weekday', 'weekend', 'holiday');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled');
CREATE TYPE payment_method AS ENUM ('vnpay', 'momo', 'zalopay', 'card', 'cash');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE point_transaction_type AS ENUM ('earn', 'redeem', 'expire', 'bonus');
CREATE TYPE voucher_type AS ENUM ('discount_percent', 'discount_amount', 'free_night');

-- 1. room_types
CREATE TABLE room_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    base_price DECIMAL(12, 2) NOT NULL CHECK (base_price >= 0),
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    amenities JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE room_types IS 'Defines categories of rooms and their baseline pricing and capacity';

-- 2. rooms
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_type_id INTEGER REFERENCES room_types(id) ON DELETE RESTRICT,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    floor INTEGER NOT NULL,
    status room_status DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE rooms IS 'Physical room instances';

-- 3. pricing_rules
CREATE TABLE pricing_rules (
    id SERIAL PRIMARY KEY,
    room_type_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
    day_type day_type NOT NULL,
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    CONSTRAINT check_dates CHECK (valid_from <= valid_to)
);
COMMENT ON TABLE pricing_rules IS 'Overrides base room prices based on weekday/weekend/holiday and date range';

-- 4. guests
CREATE TABLE guests (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    nationality VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE guests IS 'Customer profile information';

-- 5. membership_tiers
CREATE TABLE membership_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    min_nights INTEGER NOT NULL DEFAULT 0 CHECK (min_nights >= 0),
    min_spend DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (min_spend >= 0),
    points_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.00 CHECK (points_multiplier >= 1.00),
    benefits JSONB DEFAULT '[]'::jsonb
);
COMMENT ON TABLE membership_tiers IS 'Loyalty tiers rules';

-- 6. guest_memberships
CREATE TABLE guest_memberships (
    id SERIAL PRIMARY KEY,
    guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE UNIQUE,
    tier_id INTEGER REFERENCES membership_tiers(id) ON DELETE RESTRICT,
    total_nights INTEGER NOT NULL DEFAULT 0 CHECK (total_nights >= 0),
    total_spend DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total_spend >= 0),
    current_points INTEGER NOT NULL DEFAULT 0 CHECK (current_points >= 0),
    lifetime_points INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_points >= 0),
    since_date DATE DEFAULT CURRENT_DATE
);
COMMENT ON TABLE guest_memberships IS 'Mapping of guest to their current loyalty membership status';

-- 7. bookings
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_ref VARCHAR(50) NOT NULL UNIQUE,
    guest_id INTEGER REFERENCES guests(id) ON DELETE RESTRICT,
    room_id INTEGER REFERENCES rooms(id) ON DELETE RESTRICT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    adults INTEGER NOT NULL CHECK (adults > 0),
    children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0),
    status booking_status DEFAULT 'pending',
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
    points_earned INTEGER NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_booking_dates CHECK (check_in < check_out)
);
COMMENT ON TABLE bookings IS 'Reservations made by guests';

-- 8. payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) DEFAULT 'VND',
    method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',
    transaction_id VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE
);
COMMENT ON TABLE payments IS 'Payment transaction details';

-- 9. point_transactions
CREATE TABLE point_transactions (
    id SERIAL PRIMARY KEY,
    guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    type point_transaction_type NOT NULL,
    points INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE point_transactions IS 'History of loyalty points earned, redeemed, or expired';

-- 10. vouchers
CREATE TABLE vouchers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type voucher_type NOT NULL,
    value DECIMAL(12, 2) NOT NULL CHECK (value >= 0),
    min_spend DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (min_spend >= 0),
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_guest_id INTEGER REFERENCES guests(id) ON DELETE SET NULL,
    CONSTRAINT check_voucher_dates CHECK (valid_from <= valid_to)
);
COMMENT ON TABLE vouchers IS 'Vouchers that can be used for booking discounts';

-- 11. email_logs
CREATE TABLE email_logs (
    id SERIAL PRIMARY KEY,
    guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL
);
COMMENT ON TABLE email_logs IS 'Log of system-sent notifications';

-- 12. admins
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE admins IS 'System administrator details';

-- Indexes for Optimization
CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_bookings_ref ON bookings(booking_ref);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_point_transactions_guest ON point_transactions(guest_id);
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_admins_email ON admins(email);

-- Seed Data: Room Types
INSERT INTO room_types (name, description, base_price, capacity, amenities, images) VALUES
('Superior', 'Cozy 25m2 room with city view, perfect for business travelers.', 1200000.00, 2, '["WiFi", "AC", "TV", "Minibar"]'::jsonb, '["/images/superior-1.jpg"]'::jsonb),
('Deluxe', 'Spacious 35m2 room with ocean view, private balcony and bathtub.', 1800000.00, 2, '["WiFi", "AC", "TV", "Minibar", "Balcony", "Bathtub", "Ocean View"]'::jsonb, '["/images/deluxe-1.jpg"]'::jsonb),
('Suite', 'Luxurious 60m2 suite with separate living area, ocean view and premium amenities.', 3500000.00, 4, '["WiFi", "AC", "TV", "Minibar", "Balcony", "Bathtub", "Ocean View", "Coffee Maker", "Living Room"]'::jsonb, '["/images/suite-1.jpg"]'::jsonb);

-- Seed Data: Rooms (Adding some rooms)
INSERT INTO rooms (room_type_id, room_number, floor, status) VALUES
(1, '101', 1, 'available'),
(1, '102', 1, 'available'),
(1, '103', 1, 'available'),
(2, '201', 2, 'available'),
(2, '202', 2, 'available'),
(3, '301', 3, 'available');

-- Seed Data: Membership Tiers
INSERT INTO membership_tiers (name, min_nights, min_spend, points_multiplier, benefits) VALUES
('Silver', 0, 0.00, 1.00, '["Free bottled water", "Standard WiFi"]'::jsonb),
('Gold', 10, 15000000.00, 1.50, '["Free bottled water", "High-speed WiFi", "Late checkout (2 PM)", "Welcome drink"]'::jsonb),
('Platinum', 25, 40000000.00, 2.00, '["Free bottled water", "High-speed WiFi", "Late checkout (4 PM)", "Welcome drink", "Room upgrade on arrival", "Lounge access"]'::jsonb);

-- Seed Data: Admins
-- Password is 'Admin@123' hashed with bcrypt (rounds=12)
INSERT INTO admins (email, password_hash, first_name, last_name) VALUES
('admin@hotel.com', '$2b$12$Z0bB6s40kFvK5c3oY/kC3e.bNz5v.H48H7pDkHnswHqFqYm1W8m.S', 'System', 'Administrator');

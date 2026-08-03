-- ══════════════════════════════════════════════════════════════
-- schema.sql — HMS, PostgreSQL
-- Полная схема "с нуля". БД `hotel` должна быть создана заранее
-- (createdb hotel), этот скрипт её не создаёт.
-- Выполнять: psql -U <user> -d hotel -f schema.sql
-- ══════════════════════════════════════════════════════════════

-- ── 1. ENUM-типы ──────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'user');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_category') THEN
        CREATE TYPE room_category AS ENUM ('Одноместный', 'Двухместный', 'Полулюкс', 'Люкс');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status_type') THEN
        -- 'недоступен' — например ремонт/техобслуживание, номер нельзя забронировать
        CREATE TYPE room_status_type AS ENUM ('свободен', 'занят', 'недоступен');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_type') THEN
        CREATE TYPE booking_status_type AS ENUM ('активна', 'отменена', 'завершена');
    END IF;
END $$;

-- ── 2. Пользователи ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id       SERIAL PRIMARY KEY,
  login    VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,        -- bcrypt-хеш
  role     user_role DEFAULT 'user'
);

-- Сид-пароль admin/admin хранится в виде bcrypt-хеша.
-- После применения схемы с нуля запустите один раз:
--   node server/scripts/rehash-admin.js
-- чтобы установить корректный bcrypt-хеш для встроенного аккаунта admin.
INSERT INTO users (login, password, role) VALUES
('admin', '$2a$10$placeholder-run-server/scripts/rehash-admin.js', 'admin')
ON CONFLICT (login) DO NOTHING;

-- ── 3. Номера ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id              SERIAL PRIMARY KEY,
  number          VARCHAR(10) UNIQUE NOT NULL,
  type            room_category NOT NULL,
  price           DECIMAL(10,2) NOT NULL,
  status          room_status_type DEFAULT 'свободен',

  -- Пометка администратора (необязательна) — причина "недоступен" и т.п.
  note            VARCHAR(500) NULL,

  -- Флаг уборки — НЕ входит в status, накладывается визуально в UI.
  -- Устанавливается в TRUE при отмене/завершении брони (номер освободился,
  -- но ещё не убран). Сбрасывается кнопкой "Отметить убранным".
  needs_cleaning  BOOLEAN NOT NULL DEFAULT FALSE,
  last_cleaned_at TIMESTAMP NULL
);

INSERT INTO rooms (number, type, price, status) VALUES
('101', 'Одноместный', 3000, 'свободен'),
('102', 'Двухместный', 4000, 'занят'),
('201', 'Полулюкс',    5000, 'свободен'),
('202', 'Люкс',        7500, 'занят'),
('103', 'Одноместный', 3000, 'свободен'),
('203', 'Двухместный', 4000, 'свободен'),
('301', 'Люкс',        7500, 'свободен'),
('104', 'Полулюкс',    5000, 'занят')
ON CONFLICT (number) DO NOTHING;

-- ── 4. Гости ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guests (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  phone           VARCHAR(20),
  email           VARCHAR(100),
  passport_number VARCHAR(20) UNIQUE,
  passport_scan   VARCHAR(500)
);

INSERT INTO guests (name, phone, email, passport_number) VALUES
('Иванов Иван Иванович',          '+7 924 111-22-33', 'ivanov@mail.ru',    '2507 842156'),
('Петрова Анна Сергеевна',         '+7 924 222-33-44', 'petrova@gmail.com', '2508 123456'),
('Сидоров Алексей Викторович',     '+7 924 333-44-55', 'sidorov@yandex.ru', '2509 654321'),
('Козлова Мария Петровна',         '+7 924 444-55-66', 'kozlova@mail.ru',   '2510 987654'),
('Новиков Дмитрий Александрович',  '+7 924 555-66-77', 'novikov@gmail.com', '2511 321654'),
('Морозова Екатерина Игоревна',    '+7 924 666-77-88', 'morozova@yandex.ru','2512 741852')
ON CONFLICT (passport_number) DO NOTHING;

-- ── 5. Бронирования ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id        SERIAL PRIMARY KEY,
  guest_id  INT,
  room_id   INT,
  check_in  DATE NOT NULL,
  check_out DATE NOT NULL,
  status    booking_status_type DEFAULT 'активна',
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE RESTRICT,
  FOREIGN KEY (room_id)  REFERENCES rooms(id)  ON DELETE RESTRICT
);

INSERT INTO bookings (guest_id, room_id, check_in, check_out, status)
SELECT g.id, r.id, '2025-06-01', '2025-06-05', 'активна'
FROM guests g, rooms r
WHERE g.name='Иванов Иван Иванович' AND r.number='102'
  AND NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.guest_id = g.id AND b.room_id = r.id AND b.check_in = '2025-06-01'
  )
LIMIT 1;

INSERT INTO bookings (guest_id, room_id, check_in, check_out, status)
SELECT g.id, r.id, '2025-06-03', '2025-06-07', 'активна'
FROM guests g, rooms r
WHERE g.name='Петрова Анна Сергеевна' AND r.number='202'
  AND NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.guest_id = g.id AND b.room_id = r.id AND b.check_in = '2025-06-03'
  )
LIMIT 1;

INSERT INTO bookings (guest_id, room_id, check_in, check_out, status)
SELECT g.id, r.id, '2025-06-10', '2025-06-15', 'активна'
FROM guests g, rooms r
WHERE g.name='Козлова Мария Петровна' AND r.number='104'
  AND NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.guest_id = g.id AND b.room_id = r.id AND b.check_in = '2025-06-10'
  )
LIMIT 1;
# Архитектура HMS

Hotel Management System — платформа для управления гостиницей.

[↩ На главную](../docs/PRODUCT.md) · [API](API.md) · [DATABASE](DATABASE.md)

---

## Общая схема

```
┌──────────────────────────────────────────────────────┐
│                    Browser (клиент)                   │
│  landing.html │ login.html │ dashboard.html │ ...     │
│  css/style.css │ js/app.js │ js/api.js │ js/*.js     │
└───────┬──────────────────────────────────┬────────────┘
        │  static (Express)                 │  fetch()
        │  HTML/CSS/JS/Lucide/Chart.js      │  JSON
        ▼                                   ▼
┌──────────────────────────────────────────────────────────┐
│                  Express Server (порт 5000)               │
│  server/index.js  →  маршрутизация + middleware           │
│  server/routes/   →  auth │ rooms │ guests │ bookings     │
│  server/db.js     →  PostgreSQL connection pool             │
└──────────────────────────┬───────────────────────────────┘
                           │  pg (PostgreSQL driver)
                           ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │  БД: hotel   │
                    │  users       │
                    │  rooms       │
                    │  guests      │
                    │  bookings    │
                    └──────────────┘
```

## Структура каталогов

```
hotel-management-system/
├── .env                        # Переменные окружения (DB credentials)
├── package.json                # Зависимости проекта
├── schema.sql                  # Схема БД (PostgreSQL)
├── DESIGN.md                   # Дизайн-система (гайдлайн)
│
├── server/                     # Backend
│   ├── index.js                # Точка входа Express-приложения
│   ├── db.js                   # PostgreSQL connection pool
│   ├── middleware/             # Middleware (auth, error handling)
│   │   └── auth.js             # requireAuth - JWT verification
│   └── routes/                 # API-маршруты
│       ├── auth.js             # POST /api/auth/login, /register, /logout
│       ├── rooms.js            # CRUD номеров: GET/POST/PUT/DELETE/PATCH /api/rooms
│       ├── guests.js           # CRUD гостей: GET/POST/PUT/DELETE /api/guests
│       └── bookings.js         # CRUD броней + stat: /api/bookings
│
├── public/                     # Frontend (статика)
│   ├── css/
│   │   └── style.css           # Единый CSS-файл
│   │
│   ├── js/
│   │   ├── api.js              # Обёртка над fetch — apiFetch()
│   │   ├── app.js              # Глобальные утилиты: theme, sidebar, modal, toast, validateForm, escapeHtml
│   │   ├── dashboard.js        # Логика главной панели
│   │   ├── rooms.js            # Логика страницы номеров
│   │   ├── guests.js           # Логика страницы гостей
│   │   ├── bookings.js         # Логика страницы бронирований
│   │   ├── booking-modal.js    # Переиспользуемая модалка бронирования
│   │   └── mock.js             # Мок-данные (не используется)
│   │
│   ├── landing.html            # Лендинг / стартовая страница
│   ├── login.html              # Вход / регистрация
│   ├── dashboard.html          # Главная панель
│   ├── rooms.html              # Управление номерами
│   ├── guests.html             # База гостей
│   └── bookings.html           # Бронирования
│
└── docs/                       # Документация
    ├── ARCHITECTURE.md
    ├── API.md
    ├── DATABASE.md
    ├── SECURITY.md
    ├── STYLEGUIDE.md
    ├── DESIGN_SYSTEM.md
    ├── DESIGN.md
    ├── DEPLOY.md
    ├── ROADMAP.md
    ├── TASKS.md
    ├── PRODUCT.md
    ├── AI_CONTEXT.md
    ├── CHANGELOG.md
    ├── CONTRIBUTING.md
    └── KNOWN_ISSUES.md
```

## Назначение папок

| Каталог | Назначение |
|---------|------------|
| `server/` | Весь backend: точка входа Express, подключение к БД, REST API маршруты |
| `server/routes/` | Отдельные модули маршрутов по сущностям (auth, rooms, guests, bookings) |
| `public/` | Полностью клиентская часть — HTML страницы, CSS, JS |
| `public/css/` | Единый CSS-файл с CSS-переменными, компонентами, адаптивностью |
| `public/js/` | Клиентская логика: api.js — HTTP client, app.js — shared utils, * — page modules |

## Взаимодействие frontend ↔ backend ↔ database

```
Клиент (браузер)
  │
  ├─ 1. Загружает HTML (GET /dashboard.html)
  │     └─ Express раздаёт статику из public/
  │
  ├─ 2. При загрузке страницы JS делает fetch()
  │     └─ GET /api/rooms, POST /api/bookings, etc.
  │
  └─ 3. Ответ — JSON с данными
        └─ JS рендерит DOM

Express Server (port 5000)
  │
  ├─ Middleware: cors(), express.json(), static()
  │
  ├─ /api/auth/*    →  routes/auth.js
  ├─ /api/rooms/*   →  routes/rooms.js
  ├─ /api/guests/*  →  routes/guests.js
  └─ /api/bookings/* →  routes/bookings.js

PostgreSQL Database (hotel)
  │
  ├─ users      — учётные записи (login/password bcrypt/role)
  ├─ rooms      — номерной фонд
  ├─ guests     — база гостей (паспортные данные)
  └─ bookings   — бронирования (связь guest_id → guest, room_id → room)

└─ Фронтенд использует `credentials: 'include'` для автоматической отправки JWT в httpOnly cookie.

## Поток данных (Data Flow)

```
[UI: пользователь нажимает "Создать бронь"]
  │
  ▼
[bookings.js → openAddBooking()]
  │  загружает гостей и свободные номера через DB.getGuests(), DB.getRooms()
  ▼
[api.js → apiFetch('GET /api/guests'), apiFetch('GET /api/rooms')]
  │
  ▼
[server/routes/guests.js, rooms.js]
  │  → db.query('SELECT ...')
  │  → результат в JSON
  ▼
[bookings.js → render формы из select-опций]
  │
  ▼
[UI: пользователь заполняет, нажимает "Создать бронь"]
  │
  ▼
[bookings.js → saveBooking()]
  │  → DB.addBooking({guest_id, room_id, check_in, check_out})
  │  → apiFetch('POST /api/bookings', body)
  ▼
[server/routes/bookings.js → POST /]
  │  1. conn.beginTransaction()
  │  2. SELECT ... FOR UPDATE  (блокировка номера)
  │  3. INSERT INTO bookings
  │  4. UPDATE rooms SET status='занят'
  │  5. conn.commit()
  │  6. Возврат полной записи с JOIN
  ▼
[bookings.js → renderBookings()]
  │  Перерисовка таблицы с новой бронью
  ▼
[Toastify: "Бронирование создано"]
```

## Жизненный цикл HTTP-запроса

```mermaid
sequenceDiagram
    participant Browser
    participant Express
    participant Router
    participant DB as PostgreSQL
    participant Browser as Клиент

    Browser->>Express: GET /dashboard.html
    Express->>Browser: 200 + static HTML/CSS/JS

    Browser->>Express: GET /api/bookings
    Express->>Router: routes/bookings.js
    Router->>DB: SELECT b.*, g.name, r.number...
    DB->>Router: rows[]
    Router->>Express: res.json(rows)
    Express->>Browser: 200 JSON

    Browser->>Express: POST /api/bookings {body}
    Express->>Router: routes/bookings.js
    Router->>DB: BEGIN; SELECT FOR UPDATE; INSERT; UPDATE; COMMIT
    DB->>Router: result
    Router->>Express: res.status(201).json(booking)
    Express->>Browser: 201 JSON
```

## Используемые технологии

| Уровень | Технология | Назначение |
|---------|------------|------------|
| **Runtime** | Node.js | Выполнение server-кода |
| **Framework** | Express 4.18 | HTTP-сервер, маршрутизация |
| **Database** | PostgreSQL (pg 8.22) | Хранение данных, connection pool |
| **Dev** | nodemon 3.0 | Hot-reload при разработке |
| **CSS** | Pure CSS | Стилизация без фреймворков |
| **Icons** | Lucide (CDN) | Иконки в интерфейсе |
| **Charts** | Chart.js (CDN) | Графики на дашборде |
| **Datepicker** | flatpickr (CDN) | Выбор дат для бронирований |
| **Animations** | AOS (CDN) | Scroll-анимации на лендинге |
| **Toasts** | Toastify (CDN) | Всплывающие уведомления |

## Сторонние библиотеки

Зависимости `package.json` (server):

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `express` | ^4.18.2 | HTTP-фреймворк |
| `cors` | ^2.8.5 | Разрешение кросс-доменных запросов |
| `dotenv` | ^16.3.1 | Загрузка .env переменных |
| `pg` | ^8.22.0 | PostgreSQL драйвер (promise API + pool) |
| `helmet` | ^8.3.0 | Security headers |
| `morgan` | ^1.11.0 | HTTP логирование |
| `express-rate-limit` | ^8.5.2 | Rate limiting |
| `bcryptjs` | ^2.4.3 | Хеширование паролей (bcrypt) |
| `jsonwebtoken` | ^9.0.2 | JWT-подпись и верификация |
| `cookie-parser` | ^1.4.6 | Парсинг cookie-заголовков |
| `nodemon` | ^3.0.1 | Dev-зависимость, автоперезапуск |

CDN-библиотеки (frontend):

| Библиотека | Где используется |
|------------|-----------------|
| Lucide Icons (unpkg) | Все внутренние страницы — иконки |
| Toastify (jsdelivr) | Все страницы — уведомления |
| Chart.js (jsdelivr) | dashboard.html — графики |
| flatpickr (jsdelivr) | bookings.html — датапикер |
| AOS (unpkg) | landing.html — анимации при скролле |
| IMask (jsdelivr) | guests.html, bookings.html — маски телефона и паспорта |

## Принципы организации

1. **Одна страница = один JS-модуль** (`dashboard.js`, `rooms.js`, `guests.js`, `bookings.js`)
2. **Единый CSS** — `style.css` содержит все стили проекта
3. **Единый API-клиент** — `api.js` обёртывает `fetch` + объект `DB`
4. **Shared utilities** — `app.js` содержит общие модули (`theme`, `sidebar`, `modal`, `toast`, `validateForm`, `utils`, `escapeHtml`)
5. **Route-per-entity** — отдельные файлы маршрутов в `server/routes/` для каждой сущности
6. **Connection pool** — единый пул PostgreSQL-подключений в `server/db.js`
7. **Transaction для бронирований** — создание/отмена брони внутри транзакции с `SELECT ... FOR UPDATE`
8. **Fallback SPA** — маршрут `get('*')` отдаёт `landing.html` для неизвестных URL

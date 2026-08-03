# AI_CONTEXT — Краткая справка для LLM

**Максимум 2 страницы. Для деталей см. другие документы.**

---

## Что это

HMS (Hotel Management System) — система управления гостиницей на Node.js + Express + PostgreSQL.
Frontend — vanilla JS/CSS/HTML (без фреймворков).

## Структура

```
server/
  index.js       # Express entry (port 5000), middleware, routes, SPA fallback
  db.js          # PostgreSQL pool (10 connections)
  routes/
    auth.js      # POST /api/auth/login, /register
    rooms.js     # CRUD /api/rooms (GET/POST/PUT/DELETE + PATCH /cleaning)
    guests.js    # CRUD /api/guests
    bookings.js  # CRUD /api/bookings + GET /stats
public/
  css/style.css     # Все стили (2 темы)
  js/
    api.js          # apiFetch() + DB-интерфейс
    app.js          # theme, sidebar, modal, toast, validateForm, utils, escapeHtml
    dashboard.js    # Dashboard логика
    rooms.js        # Rooms CRUD логика
    guests.js       # Guests CRUD логика
    bookings.js     # Bookings логика
    booking-modal.js # Переиспользуемая модалка бронирования
    mock.js         # Мок-данные (не используется)
  *.html           # landing, login, dashboard, rooms, guests, bookings
```

## Ключевые файлы

| Файл | Зачем |
|------|-------|
| `server/index.js` | Главная точка входа (НЕ `index.js` в корне) |
| `server/db.js` | Connection pool, экспортируется в route-файлы |
| `server/middleware/auth.js` | requireAuth — JWT verification для защищённых роутов |
| `server/routes/bookings.js` | Самые сложные маршруты (транзакции, JOIN) |
| `public/js/app.js` | Shared utilities — theme, modal, toast, validateForm |
| `public/js/api.js` | API client — обёртка fetch + объект DB |
| `DESIGN.md` | Дизайн-система — цвета, типографика, компоненты |

## Топология DB

| Таблица | Поля |
|---------|------|
| users | id, login, password(bcrypt), role |
| rooms | id, number(UNIQUE), type, price, status, note, needs_cleaning, last_cleaned_at |
| guests | id, name, phone, email, passport_number, passport_scan |
| bookings | id, guest_id, room_id, check_in(date), check_out(date), status |

## Обязательные .env переменные

- `JWT_SECRET` — секретный ключ для подписи JWT токенов (обязательно менять в продакшене)
- `DB_PASS`, `DB_USER`, `DB_NAME`, `PORT` — настройки БД и сервера

## Важные правила

- **НЕ менять архитектуру** без явного разрешения
- **НЕ переписывать файлы полностью** — встраивать в существующую структуру
- **Использовать CSS-переменные** из `:root` — не выдумывать новые цвета
- **Один REST endpoint = одна операция**
- **Все SQL-запросы параметризированы** (`$1, $2, ...`)
- **Транзакции** для операций, затрагивающих bookings + rooms
- **Формат дат:** `ДД.ММ.ГГГГ` на клиенте, `YYYY-MM-DD` в базе (PostgreSQL DATE)
- **PATCH /api/rooms/:id/cleaning** — управление флагом уборки номера

## Нельзя менять без необходимости

- `.env`, `package.json`, `package-lock.json`
- `server/db.js` (pool configuration)
- `DESIGN.md` (дизайн-система)
- CSS-переменные в `:root`

## Принципы

- **Reuse:** использовать существующие CSS-классы и JS-утилиты
- **Consistency:** новые страницы должны выглядеть так же как старые
- **Validation:** всегда на frontend и ideally на backend
- **Russian UI:** все тексты на русском языке
- **Toast feedback:** успех/Ошибка/Предупреждение через `toast.*()`

## Быстрая навигация

| Что нужно | Смотри |
|-----------|--------|
| Добавить API endpoint | `server/routes/` + `public/js/api.js` |
| Добавить страницу | Создать `.html` + `.js` в `public/` |
| Изменить стили | `public/css/style.css` + `DESIGN.md` |
| Изменить DB | `server/db.js` + `DESIGN.md` |
| Добавить компонент | `public/css/style.css` (CSS) + `public/js/app.js` (JS utils) |

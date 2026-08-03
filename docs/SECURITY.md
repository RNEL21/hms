# SECURITY — Анализ безопасности HMS

[↩ На главную](../docs/PRODUCT.md) · Known issues: [KNOWN_ISSUES.md](KNOWN_ISSUES.md)

---

## Уже реализовано

### Prepared Statements (SQL Injection — защищено)
- Все запросы используют параметризированные SQL (`$1, $2, ...` placeholder для PostgreSQL).
- Значения подставляются через `db.query(sql, params)`, что защищает от SQL-инъекций.
- **Исключение:** динамическое формирование WHERE-условий (`where.join(' AND ')`) — структуры запроса зависят от ввода, но параметры всё равно передаются через `$1`, `$2`, поэтому SQLi **не применим**.

**Статус:** ✅ SQL Injection защищён.

### SHA-256 для паролей
- Пароли хешируются через `crypto.createHash('sha256')`.
- **Однако:** SHA-256 без соли **не является криптографически безопасным** для хранения паролей.

**Статус:** ⚠️ Частично (см. Отсутствует).

### Password Hashing (bcrypt/argon2)

**Реализовано:** ✅ Используется `bcrypt` с автоматической генерацией соли (cost factor 10).

**Статус:** ✅ Реализовано

### Transaction для бронирований
- Создание и отмена бронирования выполняется в транзакции с `SELECT ... FOR UPDATE`.
- Это предотвращает race condition при одновременном бронировании одного номера.

**Статус:** ✅ ACID-соблюдение для критической операции.

### Authentication / Session Management

**Реализовано:** ✅ JWT-аутентификация с httpOnly cookie.

**Механизм:**
- Токен подписывается секретом `JWT_SECRET` из `.env`, истекает через 7 дней
- Хранится в httpOnly cookie (не доступен для чтения через JS, снижает риск кражи при XSS)
- Middleware `requireAuth` в `server/middleware/auth.js` проверяет токен перед обработкой защищённых роутов
- Защищённые роуты: `/api/rooms/*`, `/api/guests/*`, `/api/bookings/*`
- Открыты: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`

**Статус:** ✅ Реализовано

---

## Отсутствует

### Authorization / RBAC

**Проблема:** Нет проверки ролей.
- Таблица `users` имеет поле `role`, но оно не используется.
- Все эндпоинты доступны любому пользователю.
- Нет middleware для проверки `isAdmin`.

**Рекомендация:** Добавить middleware `authenticate` + `authorize` на каждый маршрут.

**Severity:** 🔴 Критический

---

### Helmet (Security Headers)

**Статус:** ✅ Установлен

- Пакет `helmet` (^8.3.0) подключён в `server/index.js`
- Применяется ко всем запросам: `app.use(helmet())`
- CSP отключён (`contentSecurityPolicy: false`) для совместимости с inline-скриптами в HTML

**Severity:** 🟡 Средний (CSP отключён)

---

### Rate Limiting

**Статус:** ✅ Установлен

- Пакет `express-rate-limit` (^8.5.2) подключён в `server/index.js`
- Применяется ко всем запросам к `/api/auth/login`: максимум 10 запросов за 15 минут
- Ответ: `{ error: 'Слишком много попыток входа. Попробуйте позже.' }`

**Severity:** 🟡 Средний

---

### Input Validation

**Статус:** 🟡 Частично реализовано

**Реализовано:**
- Проверка обязательных полей на сервере (ФИО, паспорт, дата заезда/выезда)
- Валидация email через regex
- Проверка `check_out > check_in`
- Проверка цены (`price > 0`)

**Остаётся добавить:**
- Полная валидация через `zod` или `express-validator`
- Проверка диапазона цен
- Дополнительная sanitization

**Severity:** 🟡 Средний

---

### XSS (Cross-Site Scripting)

**Решено:** Функция `escapeHtml()` реализована в `public/js/app.js` и применяется при рендере данных гостей и номеров.
- Используется `utils.escapeHtml()` для экранирования перед `innerHTML`.

**Severity:** ✅ Реализовано

---

### CSRF Protection

**Проблема:** Нет CSRF-токенов.
- POST/PUT/DELETE запросы не защищены.
- Cookie-based auth (когда появится) будет уязвим.

**Рекомендация:** Добавить `csurf` или использовать JWT в Authorization header.

**Severity:** 🟡 Средний (пока нет auth — не применимо, но нужно при внедрении)

---

### File Upload Security

**Проблема:** Поле `passport_scan` сохраняется только как имя файла.
- Файл не загружается на сервер.
- Валидация `.jpg` только на клиенте (в `handleScan()`).
- При реализации загрузки — нужна серверная валидация:
  - MIME type проверка
  - Ограничение размера
  - Уникальные имена файлов
  - Безопасное хранение (вне webroot)

**Severity:** 🟢 Пока не реализовано (низкий).

---

### CORS

**Проблема:** `cors()` без ограничений — разрешает любые origins.
- Любое приложение может делать fetch-запросы к API.
- Не критично, если API защищён auth, но снижает защиту.

**Текущий код:**
```javascript
app.use(cors());
```

**Рекомендация:** `app.use(cors({ origin: ['http://localhost:5000', 'https://yourdomain.com'] }))`

**Severity:** 🟢 Низкий (до появления auth).

---

### Logging / Audit

**Проблема:** Нет системного логирования.
- Только `console.log` при старте.
- Нет логов запросов, ошибок, действий пользователей.
- audit trail для операций отсутствует.

**Рекомендация:**
- `morgan` для HTTP-логов
- Custom middleware для audit (кто, что, когда изменил)

**Severity:** 🟡 Средний

---

### Secrets Management

**Проблема:** `.env` файл содержит секреты, которые не должны попадать в репозиторий.

**Текущий `.env` (пример):**
```
# ── Сервер ───────
PORT=5000

# ── PostgreSQL ────────
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=ваш_пароль_базы
DB_NAME=hotel

# ── JWT ──────────────────
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**Важные секреты:**
- `DB_PASS` — пароль к базе данных
- `JWT_SECRET` — секретная строка для подписи JWT токенов (обязательно менять в продакшене)

`.env` должен быть в `.gitignore`.

**Severity:** ✅ Реализовано (правильное управление секретами)

---

## Желательно добавить

### Security Headers (в дополнение к Helmet)
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=()
Content-Security-Policy: ... (ограничить внешние скрипты)
```

### Audit Log
- Таблица `audit_log` с записями: `user_id, action, entity, entity_id, timestamp, old_value, new_value`
- Кто удалил гостя/номер/бронь
- Кто создал бронирование

### Password Reset
- Восстановление пароля через email

### Account Lockout
- Блокировка после 5 неудачных попыток входа

### HTTPS
- TLS/SSL в production
- `app.set('trust proxy', 1)` для обратного прокси

### Data Retention / GDPR / ФЗ-152
- Удаление данных гостя по запросу
- История изменений

### Backup
- Регулярное резервное копирование БД

---

## Сводка по категориям

| Категория | Статус | Уровень |
|-----------|--------|---------|
| SQL Injection | ✅ Защищён (prepared statements) | |
| XSS | ✅ Реализовано (escapeHtml) | |
| CSRF | 🟡 Нет токенов (но пока нет auth) | Средний |
| Password Hashing | ✅ bcrypt с солью | Критический |
| Authentication | ✅ JWT с httpOnly cookie | Критический |
| Authorization | 🔴 Отсутствует | Критический |
| Session Management | ✅ JWT в httpOnly cookie | Критический |
| Helmet | ✅ Установлен | Средний (CSP отключён) |
| Rate Limiting | ✅ Установлен | Средний |
| Input Validation | 🟡 Частичная | Средний |
| File Upload | 🔴 Не реализовано | Низкий |
| CORS | ✅ Включён (без ограничений) | Низкий |
| Logging | 🔴 Только console.log | Средний |
| Audit | 🔴 Отсутствует | Средний |
| Secrets | ✅ JWT_SECRET в .env | Средний |
| HTTPS | 🔴 Отсутствует (dev only) | Средний (для prod — критический) |

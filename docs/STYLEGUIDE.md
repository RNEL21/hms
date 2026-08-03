# STYLEGUIDE — Соглашения по стилю HMS

[↩ На главную](../docs/PRODUCT.md) · [DESIGN_SYSTEM](DESIGN_SYSTEM.md) · [CONTRIBUTING](CONTRIBUTING.md)

---

## Структура файлов

### Общие правила

| Элемент | Правило |
|---------|---------|
| **Одна сущность = один файл (backend)** | `rooms.js`, `guests.js`, `bookings.js`, `auth.js` |
| **Одна страница = один JS-модуль (frontend)** | `dashboard.js`, `rooms.js`, `guests.js`, `bookings.js` |
| **Единый CSS** | Один файл `style.css` — все стили проекта |
| **Единый API-клиент** | `api.js` — обёртка над `fetch` |
| **Shared utilities** | `app.js` — общие модули (theme, sidebar, modal, toast, validateForm) |

---

## Соглашения по именованию

### Файлы

| Тип | Стиль | Примеры |
|-----|-------|---------|
| JS-файлы | `kebab-case` | `dashboard.js`, `api.js` |
| CSS-файлы | `kebab-case` | `style.css` |
| HTML-файлы | `kebab-case` | `dashboard.html`, `rooms.html` |
| Маршруты | `kebab-case` | `auth.js`, `rooms.js` |

### Переменные и функции

| Область | Стиль | Примеры |
|---------|-------|---------|
| **Backend** | `camelCase` | `getConnection`, `beginTransaction` |
| **Frontend (глобальные модули)** | `camelCase` | `validateForm`, `openAddRoom`, `renderRooms` |
| **DOM-элементы** | `camelCase` | `_editRoomId`, `_deleteGuestId`, `_scanFilePath` |
| **Константы (объекты)** | `UPPER_CASE` | `TYPE_PRICES`, `_DEFAULT`, `_scanFilePath` |
| **CSS-классы** | `kebab-case` | `.btn-primary`, `.room-card`, `.form-input`, `.badge-success` |
| **CSS-переменные** | `--kebab-case` | `--accent`, `--bg`, `--surface`, `--radius` |
| **ID элементов** | `camelCase` | `roomsGrid`, `searchRoom`, `roomModal` |

### Приватные переменные

- Префикс `_` для приватных/внутренних переменных: `_editRoomId`, `_scanFilePath`
- Префикс `_DEFAULT` для объектов-констант по умолчанию

---

## HTML

### Правила

| Правило | Пример |
|---------|--------|
| Язык по умолчанию | `<html lang="ru" data-theme="light">` |
| Charset | `<meta charset="UTF-8">` первым |
| Viewport | `<meta name="viewport" content="width=device-width, initial-scale=1.0">` |
| Title | `<title>Страница — HMS</title>` |
| CDN-скрипты | В конце `<body>` перед закрывающим тегом |
| Локальные скрипты | После CDN, порядок: `app.js` → `api.js` → `<page>.js` |
| Lucide иконки | `<i data-lucide="icon-name"></i>` |
| ID элементов | camelCase, уникальные |

### Структура страницы (шаблон)

```html
<!DOCTYPE html>
<html lang="ru" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Название — HMS</title>
  <link rel="stylesheet" href="css/style.css">
  <!-- CDN CSS (Toastify, flatpickr) -->
</head>
<body>
<div class="app-layout">
  <aside class="app-sidebar">...</aside>
  <div id="mobOverlay" class="mob-overlay">...</div>
  <div id="mobSidebar" class="mob-sidebar">...</div>
  <div class="app-main">
    <header class="app-header">
      <button class="app-hamburger">...</button>
      <span class="app-header-title">Название</span>
      <span class="app-header-sub" id="count"></span>
      <!-- action button -->
    </header>
    <div class="app-content">
      <!-- filter bar -->
      <!-- content (table/grid) -->
    </div>
  </div>
</div>

<!-- Modals -->
<div id="...Modal" class="modal-overlay">...</div>

<!-- Scripts: CDN first, then local -->
<script src="https://unpkg.com/lucide@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
<script src="https://cdn.jsdelivr.net/npm/..."></script>
<script src="js/app.js"></script>
<script src="js/api.js"></script>
<script src="js/<page>.js"></script>
</body>
</html>
```

---

## CSS

### Правила

| Правило | Описание |
|---------|----------|
| CSS-переменные | Определены в `:root` и `[data-theme="dark"]` |
| Не использовать дефолтные Bootstrap-стили | |
| Не использовать Tailwind или Material | |
| Один файл | Все стили в `style.css` |
| Селекторы | Классы — приоритет, ID — для модалок/оверлеев |
| Переходы | Максимум 0.20s ease |
| Радиусы | Только 8px, 12px, 18px |

### Структура CSS-файта

1. `@import` шрифтов
2. CSS-переменные (`:root`)
3. Тёмная тема (`[data-theme="dark"]`)
4. Сброс (`*`)
5. Типографика
6. Компоненты (с комментариями-разделителями)
7. Layout (sidebar, app-main)
8. Страницы (dashboard, rooms, etc.)
9. Адаптивность (media queries)

### Шрифты

| Шрифт | Назначение | Где используется |
|-------|------------|-------------------|
| `Golos Text` | Основной текст | body, buttons, form inputs |
| `Outfit` | Заголовки, числа, логотипы | h1-h4, .num |
| `Geist Mono` | Моноширинный текст | `.mono` — для отображения паспортных данных (guests.html, bookings.html) |

### Компонентные имена

| Компонент | Имя | Варианты |
|-----------|-----|----------|
| Кнопка | `.btn` | `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-success`, `.btn-icon`, `.btn-sm`, `.btn-lg` |
| Бейдж | `.badge` | `.badge-success`, `.badge-danger`, `.badge-warn`, `.badge-accent`, `.badge-muted` |
| Карточка (solid) | `.card` | `.card` — основной компонент для внутренних страниц |
| Карточка (стеклянный эффект) | `.glass` | `.glass` — используется на лендинге, логине, в модалках |
| Карточка статистики | `.room-stat-card` | Карточки со статистикой номеров |
| Canvas wrapper | `.chart-canvas-wrap` | Обёртка для графиков |
| Форма | `.form-group`, `.form-input`, `.form-select` | `.form-error`, `.form-row`, `.form-actions`, `.form-label` |
| Таблица | `table`, `.table-wrap` | |
| Модалка | `.modal`, `.modal-overlay` | `.confirm-modal` |
| Поиск/Фильтр | `.filter-bar`, `.search-wrap`, `.filter-select` | |
| Моноширинный текст | `.mono` | Для отображения паспортных данных |
| Утилиты | `.flex`, `.items-center`, `.gap-2`, `.mt-1`, `.mt-2`, `.fw-700` | |

---

## JavaScript (Frontend)

### Правила

| Правило | Описание |
|---------|----------|
| Глобальные объекты | `theme`, `sidebar`, `modal`, `toast`, `utils`, `DB` |
| Привязка к DOM | `document.addEventListener('DOMContentLoaded', ...)` |
| Глобальные функции | `openAddRoom()`, `saveRoom()`, `renderRooms()` — доступны через `onclick` в HTML |
| Валидация | Функция `validateForm(rules)` с массивом правил |
| Тосты | `toast.success()`, `toast.error()`, `toast.warn()` |
| API-клиент | `apiFetch(url, opts)` — обёртка над `fetch` |
| DB-интерфейс | `DB.getRooms()`, `DB.addRoom()`, `DB.updateRoom()`, `DB.deleteRoom()` и т.д. |

### Форматирование

| Элемент | Стиль |
|---------|-------|
| Indentation | 2 пробела |
| Строки | Без жёсткого лимита (файлы могут быть длинными) |
| Скобки | 1TBS (на той же строке) |
| Пустые строки | Разделители между логическими блоками |
| Комментарии | `/* ── ... ──────────────────────── */` — декоративные разделители |

### Шаблон страницы

```javascript
// ── Конфигурация ─────────────────────────────────
const TYPE_PRICES = {...};
let _editId = null;

// ── Главная функция рендера ─────────────────
async function renderRooms() {
  // получение данных, фильтрация, DOM-обновление
}

// ── Модальные окна ─────────────────────────────────
function openAddRoom() { ... }
async function openEditRoom(id) { ... }

// ── Сохранение ──────────────────────────────────────
async function saveRoom() { ... }

// ── Удаление ────────────────────────────────────────
async function openDeleteRoom(id) { ... }
async function confirmDeleteRoom() { ... }

// ── Инициализация ────────────────────────────────────
document.addEventListener('DOMContentLoaded', renderRooms);
```

---

## Backend (Express)

### Правила

| Правило | Описание |
|---------|----------|
| Маршруты | Один маршрут — одна сущность (`rooms.js`, `guests.js`) |
| CRUD порядок | GET (все), GET (/:id), POST, PUT, DELETE |
| Обработка ошибок | `try/catch` → `res.status(500).json({ error })` |
| Параметризация | Всегда `$1, $2, ...` для значений, никогда строковая конкатенация |
| Статусы | 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 409 (Conflict), 500 (Server Error) |
| Middleware | `cors()`, `express.json()`, `static()` |

### Шаблон route-файла

```javascript
const router = require('express').Router();
const db     = require('../db');

// GET / — все (с фильтрацией)
router.get('/', async (req, res) => { ... });

// GET /:id — один
router.get('/:id', async (req, res) => { ... });

// POST / — создать
router.post('/', async (req, res) => { ... });

// PUT /:id — обновить
router.put('/:id', async (req, res) => { ... });

// DELETE /:id — удалить
router.delete('/:id', async (req, res) => { ... });

module.exports = router;
```

---

## Express (server/index.js)

### Порядок middleware

1. `cors()`
2. `express.json()`
3. `express.static()` — раздача статики
4. `app.use('/api/...')` — маршруты
5. `app.use('/api', ...)` — 404 fallback для API
6. `app.get('*', ...)` — SPA fallback (landing.html)

---

## PostgreSQL

### Правила

| Правило | Описание |
|---------|----------|
| Драйвер | `pg` (async/await) |
| Pool | `createPool()` — не отдельные соединения |
| Проверка подключения | `pool.connect()` при старте |
| Транзакции | Для операций, затрагивающих несколько таблиц |
| FOR UPDATE | При конкурентном доступе к номеру |
| Кодировка | `UTF8` (на уровне БД) |

---

## Комментарии

### Стиль

| Тип | Формат | Пример |
|-----|--------|--------|
| Разделитель раздела | Декоративная линия | `/* ── Rooms ──────────────────────────────── */` |
| Однострочный | `//` | `// проверка подключения при старте` |
| Блочный | `/* */` | `/* ── Theme ──────────────────────────────── */` |
| TODO | `// TODO:` | `// TODO: replace get/set with fetch('/api/...')` |
| Проблема | `// ⚠️:` | `// ⚠️ Нет проверки FK-связи` |

---

## Правила оформления функций

| Правило | Описание |
|---------|----------|
| Имя | `camelCase`, начинается с глагола: `openAddRoom()`, `renderRooms()`, `saveGuest()` |
| Async | Для API-вызовов — `async/await` |
| Обработка ошибок | `try/catch` + `toast.error()` |
| Возврат | Явный, не зависит от побочного эффекта |
| Параметры | Объект для нескольких опциональных, иначе отдельные |
| Размер | Функции до 50 строк обычно, render до ~80 |

---

## Правила создания новых страниц

1. Создать HTML в `public/` с именем `pagename.html`
2. Скопировать layout из существующей страницы (sidebar, header, mobile)
3. Создать JS в `public/js/` с именем `pagename.js`
4. Подключить скрипты: `app.js`, `api.js`, `pagename.js`
5. Использовать существующие CSS-классы
6. Добавить ссылку в sidebar на всех внутренних страницах

---

## Правила написания API

1. Один endpoint — одна операция
2. CRUD: GET (все), GET (/:id), POST, PUT, DELETE
3. Все запросы параметризированы (`?`)
4. JSON ответы
5. HTTP статусы по семантике
6. Ошибки: `{ error: 'сообщение' }`
7. Транзакции для операций с несколькими таблицами
8. FOR UPDATE для конкурентного доступа

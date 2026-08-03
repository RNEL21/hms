# CONTRIBUTING — Руководство для разработчиков HMS

[↩ На главную](../docs/PRODUCT.md) · [STYLEGUIDE](STYLEGUIDE.md) · [KNOWN_ISSUES](KNOWN_ISSUES.md)

---

## Как запускать проект

### Требования

- Node.js ≥ 18.x
- PostgreSQL ≥ 14.x (или Docker-контейнер)
- npm ≥ 9.x

### Установка

```bash
npm install
```

### Настройка PostgreSQL

```bash
# Docker
docker run --name postgres-local \
  -e POSTGRES_PASSWORD=ваш_пароль \
  -e POSTGRES_DB=hotel \
  -p 5432:5432 \
  -d postgres:latest
```

Создать БД и применить схему:
```bash
createdb hotel
psql -U postgres -d hotel -f schema.sql
```

### Запуск

```bash
# Development (автоперезапуск)
npm run dev

# Production
npm start
```

Приложение доступно по адресу: `http://localhost:5000`

---

## Как создавать новые страницы

### 1. Создать HTML

Файл: `public/pagename.html`

```html
<!DOCTYPE html>
<html lang="ru" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Название — HMS</title>
  <link rel="stylesheet" href="css/style.css">
  <!-- CDN CSS при необходимости -->
</head>
<body>
<div class="app-layout">
  <!-- Sidebar (скопировать из dashboard.html) -->
  <!-- Mobile sidebar -->
  <div class="app-main">
    <header class="app-header">
      <button class="app-hamburger"><i data-lucide="menu"></i></button>
      <span class="app-header-title">Название страницы</span>
      <span class="app-header-sub" id="count"></span>
      <!-- action button -->
    </header>
    <div class="app-content">
      <!-- filter bar -->
      <!-- content -->
    </div>
  </div>
</div>

<!-- Scripts: CDN -> local -->
<script src="https://unpkg.com/lucide@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
<script src="js/app.js"></script>
<script src="js/api.js"></script>
<script src="js/pagename.js"></script>
</body>
</html>
```

### 2. Создать JavaScript

Файл: `public/js/pagename.js`

```javascript
// ── Конфигурация ─────────────────────────────────

// ── Главная функция рендера ─────────────────

async function renderPage() {
  try {
    const data = await DB.getSomething();
    // DOM обновление
  } catch (e) { toast.error(e.message); }
}

// ── Модальные окна ──────────────────────────────
function openModal() { ... }
async function saveSomething() { ... }

// ── Инициализация ───────────────────────────────
document.addEventListener('DOMContentLoaded', renderPage);
```

### 3. Добавить ссылку в sidebar

На **всех** внутренних страницах (`dashboard.html`, `rooms.html`, `guests.html`, `bookings.html` и новой странице):

```html
<a href="pagename.html" class="s-item" data-tip="Название">
  <i data-lucide="icon-name"></i>
</a>
```

---

## Как создавать новые API

### 1. Создать route-файл

Файл: `server/routes/pagename.js`

```javascript
const router = require('express').Router();
const db     = require('../db');

router.get('/', async (req, res) => { ... });
router.get('/:id', async (req, res) => { ... });
router.post('/', async (req, res) => { ... });
router.put('/:id', async (req, res) => { ... });
router.delete('/:id', async (req, res) => { ... });

module.exports = router;
```

### 2. Зарегистрировать в server/index.js

```javascript
app.use('/api/pagename', require('./routes/pagename'));
```

### 3. Добавить в API-клиент

Файл: `public/js/api.js`

```javascript
const DB = {
  // ... existing
  getSomething:   ()             => apiFetch('/api/pagename'),
  addSomething:   (data)         => apiFetch('/api/pagename', { method:'POST', body: data }),
  updateSomething:({ id, ...d }) => apiFetch(`/api/pagename/${id}`, { method:'PUT', body: d }),
  deleteSomething:(id)           => apiFetch(`/api/pagename/${id}`, { method:'DELETE' }),
};
```

### 4. Проверить

```bash
curl http://localhost:5000/api/pagename
curl -X POST http://localhost:5000/api/pagename -H 'Content-Type: application/json' -d '{"data":"..."}'
```

---

## Как оформлять код

### CSS

- Использовать существующие переменные (`--accent`, `--surface`, `--text`)
- Не добавлять новые цвета
- Один файл `style.css` — все стили
- Разделители: `/* ── Раздел ──────────────────────── */`

### JavaScript

- 2 пробела для отступов
- `async/await` для API
- Всегда `try/catch` + `toast.error()`
- Имена функций: `camelCase`, с глагола
- Глобальные объекты: `theme`, `sidebar`, `modal`, `toast`, `utils`, `DB`

### Backend

- Один маршрут — одна сущность
- CRUD порядок: GET, GET /:id, POST, PUT, DELETE
- Always `?` for SQL parameters
- JSON ответы с `{ error: '...' }`
- Транзакции для операций с несколькими таблицами

---

## Как тестировать изменения

### Backend

```bash
# Запустить сервер
npm run dev

# Проверить API
curl http://localhost:5000/api/rooms
curl -X POST http://localhost:5000/api/rooms \
  -H 'Content-Type: application/json' \
  -d '{"number":"302","type":"Люкс","price":7500}'
```

### Frontend

1. Открыть страницу
2. Проверить загрузку данных
3. Проверить формы (add/edit/delete)
4. Проверить toast-уведомления
5. Проверить мобильную адаптивность

### Ручная проверка checklist

- [ ] Страница загружается
- [ ] Данные из API корректны
- [ ] Формы работают (add/edit/delete)
- [ ] Toast-уведомления появляются
- [ ] Мобильная версия работает
- [ ] Тёмная тема переключается
- [ ] Иконки Lucide отображаются
- [ ] Нет ошибок в консоли

---

## Рекомендации перед Pull Request

### Обязательно

- [ ] Сервер запускается без ошибок
- [ ] Все существующие страницы работают
- [ ] Новые страницы соответствуют дизайн-системе
- [ ] API-эндпоинты возвращают корректный JSON
- [ ] Нет `console.log` в production-коде (кроме server startup)
- [ ] Все SQL-запросы параметризированы

### Запрещено

- ❌ Менять `package.json` без необходимости
- ❌ Менять `.env`
- ❌ Переписывать файлы полностью без причины
- ❌ Добавлять новые цвета в CSS
- ❌ Добавлять зависимости без согласования
- ❌ Удалять существующую функциональность

### Желательно

- [ ] Добавить описание изменения в CHANGELOG.md
- [ ] Обновить API.md если добавлены эндпоинты
- [ ] Обновить KNOWN_ISSUES.md если найдены новые проблемы

---

## Полезные ссылки

| Документ | Описание |
|----------|----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Общая архитектура проекта |
| [API.md](API.md) | REST API документация |
| [DATABASE.md](DATABASE.md) | Структура БД |
| [STYLEGUIDE.md](STYLEGUIDE.md) | Соглашения по стилю |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | CSS-переменные, компоненты |
| [SECURITY.md](SECURITY.md) | Анализ безопасности |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | Известные проблемы |
| [TASKS.md](TASKS.md) | Backlog задач |

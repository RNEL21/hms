# TASKS — Backlog HMS

[↩ На главную](../docs/PRODUCT.md) · [ROADMAP](ROADMAP.md)

**Легенда:** ✅ Готово | 🟡 В процессе | ⬜ Не начато | 🔴 Критический | 🟡 Средний | 🟢 Низкий

---

## 🔴 КРИТИЧЕСКИЕ

| ID | Задача | Приоритет | Сложность | Статус |
|----|--------|-----------|-----------|--------|
| T-001 | Реализовать JWT аутентификацию | 🔴 K | Medium | ⬜ |
| T-002 | Добавить bcrypt вместо SHA-256 | 🔴 K | Low | ⬜ |
| T-003 | Внедрить middleware защиты маршрутов (auth required) | 🔴 K | Medium | ⬜ |
| T-004 | Экранировать данные перед innerHTML (XSS защита) | 🔴 K | Medium | ⬜ |
| T-005 | Серверная input validation (express-validator/zod) | 🔴 K | Medium | ⬜ |
| T-006 | Реализовать реальный logout endpoint + удаление сессии | 🔴 K | Low | ⬜ |
| T-007 | Защитить DELETE endpoints от удаления связанных записей | 🔴 K | Medium | ⬜ |

---

## 🟡 СРЕДНИЕ

| ID | Задача | Приоритет | Сложность | Статус |
|----|--------|-----------|-----------|--------|
| T-008 | Установить helmet middleware | 🟡 S | Low | ⬜ |
| T-009 | Установить express-rate-limit | 🟡 S | Low | ⬜ |
| T-010 | Добавить CSRF токены | 🟡 S | Low | ⬜ |
| T-011 | Настроить morgan для HTTP логов | 🟡 S | Low | ⬜ |
| T-012 | Создать audit_log таблицу и middleware | 🟡 S | High | ⬜ |
| T-013 | Реализовать загрузку файлов (passport сканы) | 🟡 S | Medium | ⬜ |
| T-014 | Валидация дат (check_in < check_out) | 🟡 S | Low | 🟡 Частично (есть на frontend) |
| T-015 | Реализовать страницу настроек пользователя | 🟡 S | Medium | ⬜ |
| T-016 | Добавить page title в sidebar на внутренних страницах (динамический) | 🟡 S | Low | ⬜ |

---

## 🟢 НИЗКИЕ

| ID | Задача | Приоритет | Сложность | Статус |
|----|--------|-----------|-----------|--------|
| T-017 | Создать DDL скрипты (CREATE TABLE) | 🟢 L | Low | ⬜ |
| T-018 | Написать Dockerfile | 🟢 L | Medium | ⬜ |
| T-019 | Создать docker-compose.yml | 🟢 L | Medium | ⬜ |
| T-020 | Написать тесты для API (jest/supertest) | 🟢 L | High | ⬜ |
| T-021 | Unit-тесты для frontend утилит | 🟢 L | High | ⬜ |
| T-022 | E2E тесты (Playwright/Cypress) | 🟢 L | High | ⬜ |
| T-023 | Настроить CI/CD (GitHub Actions) | 🟢 L | Medium | ⬜ |
| T-024 | Добавить .gitignore для .env, node_modules | 🟢 L | Low | ⬜ |
| T-025 | Создать API документацию (Swagger/OpenAPI) | 🟢 L | Medium | ⬜ |
| T-026 | Создать календарь бронирований | 🟢 L | Medium | ⬜ |
| T-027 | Страница отчётов | 🟢 L | Medium | ⬜ |
| T-028 | Revenue dashboard | 🟢 L | Medium | ⬜ |
| T-029 | Уведомления (email/SMS) | 🟢 L | High | ⬜ |
| T-030 | Room status: уборка, ремонт | 🟢 L | Medium | ⬜ |
| T-031 | Employee management | 🟢 L | High | ⬜ |
| T-032 | AI Assistant (чат-бот) | 🟢 L | High | ⬜ |
| T-033 | Мульти-отель (multi-tenant) | 🟢 L | High | ⬜ |
| T-034 | Мобильная нативная версия | 🟢 L | Very High | ⬜ |

---

## По категориям

### Frontend

| ID | Задача | Статус |
|----|--------|--------|
| T-004 | XSS защита (экранирование innerHTML) | ⬜ |
| T-014 | Валидация дат на frontend | 🟡 Частично |
| T-026 | Календарь бронирований | ⬜ |
| T-027 | Страница отчётов | ⬜ |
| T-028 | Revenue dashboard | ⬜ |
| T-030 | Room status: уборка/ремонт | ⬜ |

### Backend

| ID | Задача | Статус |
|----|--------|--------|
| T-001 | JWT аутентификация | ⬜ |
| T-002 | bcrypt hashing | ⬜ |
| T-003 | Auth middleware | ⬜ |
| T-005 | Серверная валидация | ⬜ |
| T-006 | Logout endpoint | ⬜ |
| T-007 | FK-проверки при DELETE | ⬜ |
| T-008 | helmet middleware | ⬜ |
| T-009 | Rate limiting | ⬜ |
| T-010 | CSRF токены | ⬜ |
| T-011 | HTTP логи (morgan) | ⬜ |
| T-013 | File upload | ⬜ |

### Database

| ID | Задача | Статус |
|----|--------|--------|
| T-017 | DDL скрипты | ⬜ |
| T-012 | Audit log таблица | ⬜ |
| T-007 | FK constraints | ⬜ |
| T-016 | Индексы для поиска | ⬜ |

### Security

| ID | Задача | Статус |
|----|--------|--------|
| T-001 | JWT аутентификация | ⬜ |
| T-002 | bcrypt | ⬜ |
| T-003 | Auth middleware | ⬜ |
| T-004 | XSS защита | ⬜ |
| T-005 | Server validation | ⬜ |
| T-008 | helmet | ⬜ |
| T-009 | Rate limiting | ⬜ |
| T-010 | CSRF | ⬜ |

### Performance

| ID | Задача | Статус |
|----|--------|--------|
| T-016 | Индексы для поиска | ⬜ |
| T-019 | Redis кеш (v2.0) | ⬜ |
| T-033 | Оптимизация запросов | ⬜ |

### Accessibility

| ID | Задача | Статус |
|----|--------|--------|
| T-035 | aria-labels для кнопок | ⬜ |
| T-036 | keyboard navigation | ⬜ |
| T-037 | Контраст (проверить WCAG) | ⬜ |
| T-038 | screen reader тест | ⬜ |

### UX

| ID | Задача | Статус |
|----|--------|--------|
| T-026 | Календарь бронирований | ⬜ |
| T-029 | Уведомления | ⬜ |
| T-030 | Room status | ⬜ |
| T-015 | Настройки пользователя | ⬜ |

### Testing

| ID | Задача | Статус |
|----|--------|--------|
| T-020 | API тесты (jest/supertest) | ⬜ |
| T-021 | Frontend unit тесты | ⬜ |
| T-022 | E2E тесты | ⬜ |
| T-038 | Accessibility тест | ⬜ |

### Deployment

| ID | Задача | Статус |
|----|--------|--------|
| T-018 | Dockerfile | ⬜ |
| T-019 | docker-compose.yml | ⬜ |
| T-023 | CI/CD pipeline | ⬜ |
| T-024 | .gitignore | ⬜ |

### Documentation

| ID | Задача | Статус |
|----|--------|--------|
| T-025 | API документация (Swagger) | ⬜ |
| T-017 | DDL скрипты | ⬜ |

---

## Итого

| Категория | Всего | Готово | В процессе | Не начато |
|-----------|-------|--------|------------|-----------|
| Frontend | 5 | 4 | 1 | 1 |
| Backend | 10 | 0 | 0 | 10 |
| Database | 4 | 0 | 0 | 4 |
| Security | 8 | 0 | 0 | 8 |
| Performance | 3 | 0 | 0 | 3 |
| Accessibility | 4 | 0 | 0 | 4 |
| UX | 4 | 0 | 0 | 4 |
| Testing | 4 | 0 | 0 | 4 |
| Deployment | 4 | 0 | 0 | 4 |
| Documentation | 2 | 0 | 0 | 2 |
| **Всего** | **38** | **4** | **1** | **33** |

⚠️ 33 из 38 задач остались невыполненными. Основные пробелы: безопасность, тестирование, деплой.

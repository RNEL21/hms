# DESIGN SYSTEM — HMS

[↩ На главную](../docs/PRODUCT.md) · [STYLEGUIDE](STYLEGUIDE.md) · [DESIGN.md](../DESIGN.md)

---

> Дизайн-система описана в файле [`DESIGN.md`](../DESIGN.md). Ниже — краткая выжимка + CSS Variables.

---

## Цветовая палитра

### Светлая тема (`data-theme="light"`)

| Переменная | Значение | Эмоция |
|------------|----------|--------|
| `--accent` | `#D95F18` | Тёплый оранжевый — энергия и действие |
| `--accent-hover` | `#C04F10` | Усиленный акцент при hover |
| `--accent-dim` | `rgba(217,95,24,0.10)` | Мягкий фон акцента |
| `--tint` | `#FFE3D1` | Светло-оранжевый |
| `--bg` | `#FFF8F2` | Основной фон страницы |
| `--bg2` | `#FFF3E8` | Вторичный фон |
| `--surface` | `#FFFFFF` | Карточки, модальные окна |
| `--glass-bg` | `rgba(255,255,255,0.68)` | Стеклянные панели |
| `--text` | `#2B1D16` | Основной текст |
| `--text-2` | `#5B463A` | Вторичный текст |
| `--text-3` | `#9A7E6B` | Третичный текст, метки |
| `--border` | `rgba(43,29,22,0.10)` | Границы |
| `--success` | `#4D8B55` | Зелёный — успех, свободно |
| `--danger` | `#C45C4A` | Красный — ошибка, занято |
| `--warn` | `#D9A441` | Жёлтый — внимание |

### Тёмная тема (`data-theme="dark"`)

| Переменная | Значение | Эмоция |
|------------|----------|--------|
| `--accent` | `#E76F00` | Яркий оранжевый |
| `--accent-hover` | `#FF8F1F` | При hover — ещё ярче |
| `--accent-dim` | `rgba(231,111,0,0.13)` | Мягкий фон |
| `--bg` | `#181615` | Фон страницы |
| `--bg2` | `#24201d` | Вторичный фон |
| `--surface` | `#231c17` | Карточки |
| `--text` | `#FFF4E8` | Основной текст |
| `--text-2` | `#D7C5B3` | Вторичный |
| `--text-3` | `#9F8A77` | Третичный |
| `--border` | `rgba(231,111,0,0.11)` | Границы |
| `--success` | `#63C174` | Зелёный |
| `--danger` | `#E06B5A` | Красный |
| `--warn` | `#F4B942` | Жёлтый |

---

## Типографика

| Шрифт | Назначение | Где |
|-------|------------|-----|
| `Outfit` | Заголовки, числа, логотипы | `h1-h4`, `.num` |
| `Golos Text` | Основной текст | `body`, `.btn`, `.form-input` |
| `Geist Mono` | Моноширинный текст | `.mono` — для отображения паспортных данных (guests.html, bookings.html) |

| Элемент | Вес | Размер | Межстрочность |
|---------|-----|--------|---------------|
| H1 | 700→800 | `clamp(2rem, 5vw, 3.5rem)` | 1.2 |
| H2 | 700 | `clamp(1.5rem, 3vw, 2.2rem)` | 1.2 |
| H3 | 700 | `1.2rem` | 1.2 |
| Body | 400 | `0.9–1rem` | 1.6 |

---

## Отступы

Разрешённые отступы: `4px`, `6px`, `8px`, `10px`, `12px`, `14px`, `16px`, `18px`, `20px`, `22px`, `24px`, `28px`, `36px`, `56px`, `60px`, `80px`.

| Элемент | Отступ |
|---------|--------|
| Section padding | `80px 24px` |
| Card padding | `20px–28px` |
| Form group gap | `6px` |
| Form row gap | `16px` |
| Filter bar padding | `14px 18px` |
| App content padding | `28px` |

---

## Размеры

| Элемент | Значение |
|---------|----------|
| `--sidebar-w` | `64px` |
| `--nav-h` | `64px` |
| `--radius-sm` | `8px` (кнопки, инпуты, бэджи) |
| `--radius` | `12px` (карточки) |
| `--radius-lg` | `18px` (модалки, логин-карточка) |
| `--tr` (transition) | `0.20s ease` |

---

## Компоненты

### Кнопки

| Класс | Фон | Цвет текста |
|-------|-----|-------------|
| `.btn-primary` | `var(--accent)` | `#fff` |
| `.btn-ghost` | `var(--surface)`, рамка `border` | `var(--text)` |
| `.btn-danger` | `var(--danger)` | `#fff` |
| `.btn-success` | `var(--success)` | `#fff` |
| `.btn-icon` | `padding: 7px`, квадрат | наследуется |
| `.btn-sm` | `padding: 6px 14px`, `.82rem` | |
| `.btn-lg` | `padding: 13px 28px`, `1rem` | |

**Hover:** `translateY(-1px)`, `--accent-hover`

---

### Карточки

| Тип | Фон | Где |
|-----|-----|-----|
| `.card` | `var(--surface)` | Внутренние страницы |
| `.glass` | `backdrop-filter: blur(16px) saturate(160%)` | Лендинг, логин, модалки |

**Тени карточек:**
- Светлая: `0 1px 3px rgba(43,29,22,.05), 0 4px 16px rgba(43,29,22,.04)`
- Тёмная: `0 1px 3px rgba(0,0,0,.2), 0 4px 16px rgba(0,0,0,.15)`

**Glass тени (светлая):** `0 8px 32px rgba(217,95,24,0.08)`

---

### Бейджи

| Класс | Цвет |
|-------|------|
| `.badge-success` | `--success` + `success-glass` фон |
| `.badge-danger` | `--danger` + `danger-glass` фон |
| `.badge-warn` | `--warn-text` + `warn-glass` фон |
| `.badge-accent` | `--accent` + `accent-dim` фон |

**Стиль:** `height: 22px`, `border-radius: 20px`, `0.77rem`, `600`, `::before { content:'●' }`

---

### Формы

| Элемент | Стиль |
|---------|-------|
| Padding | `10px 14px` |
| Border | `1.5px solid var(--border)` |
| Focus | `border-color: var(--accent)`, `box-shadow: 0 0 0 3px var(--accent-dim)` |
| Error | `border-color: var(--danger)` |
| `border-radius` | `var(--radius-sm)` |

---

### Таблицы

| Элемент | Стиль |
|---------|-------|
| `thead th` | `0.75rem`, uppercase, `letter-spacing: .06em`, `color: --text-3` |
| `tbody td` | `padding: 14px 16px`, `0.9rem` |
| `tbody tr:hover` | `background: var(--accent-dim)` |
| Бордер | `1px solid var(--border)` между строками |

---

### Модальные окна

| Параметр | Значение |
|----------|----------|
| Макс. ширина | `520px` (`360px` для confirm) |
| Фон | `var(--surface)` + бордёр `var(--border)` |
| Радиус | `var(--radius-lg)` (`18px`) |
| Animation | `modalIn` — `0.2s ease` |
| Overlay | `backdrop-filter: blur(6px)`, полупрозрачный |

---

## Адаптивность

| Breakpoint | Поведение |
|------------|-----------|
| `≤ 1024px` | Sidebar → 1fr grid, hero → 1 колонка |
| `≤ 768px` | Sidebar скрыт, hamburger виден, padding 16px, форм-роу → 1 колонка |
| `≤ 480px` | Rooms → 1 колонка, модалки → меньше радиус |

### Мобильный Sidebar

- Десктоп: фиксированный `64px` sidebar (иконки)
- Мобильный: выдвижной drawer `240px` (текст + иконки)

---

## Свечение и переходы

| Эффект | Значение |
|--------|----------|
| Все переходы | `0.20s ease` |
| Hover на кнопках | `translateY(-1px)` |
| Hover на строках | `background: var(--accent-dim)` |
| Hover на карточках | Тень увеличивается |

---

## Переключение темы

Реализовано через `localStorage` + `document.documentElement.setAttribute('data-theme', ...)`.

```js
// Сохранение
localStorage.setItem('hms-theme', 'dark');
document.documentElement.setAttribute('data-theme', 'dark');

// Загрузка при старте
const saved = localStorage.getItem('hms-theme') || 'light';
document.documentElement.setAttribute('data-theme', saved);
```

Иконки Lucide (moon/sun) обновляются при переключении.

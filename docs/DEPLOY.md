# DEPLOY — Руководство по развёртыванию HMS

[↩ На главную](../docs/PRODUCT.md)

---

## Требования

| Компонент | Версия | Статус |
|-----------|--------|--------|
| Node.js | ≥ 18.x | ✅ Требуется |
| PostgreSQL | ≥ 14.x | ✅ Требуется |
| npm | ≥ 9.x | ✅ Входит в Node.js |
| ОЗУ | ≥ 512 MB | Для Node.js + PostgreSQL |
| Диск | ≥ 1 GB | Достаточно для приложения |

---

## Установка

### 1. Клонирование / подготовка

```bash
# Перенести проект в целевую директорию
cd /opt/hotel-management
```

### 2. Установка зависимостей

```bash
npm ci --production    # production dependencies only
```

### 3. Настройка PostgreSQL

**Локально (Docker для разработки):**
```bash
docker run --name postgres-local \
  -e POSTGRES_PASSWORD=ваш_пароль \
  -e POSTGRES_DB=hotel \
  -p 5432:5432 \
  -d postgres:latest
```

**Production (системный PostgreSQL):**
```bash
sudo apt install postgresql postgresql-contrib    # Ubuntu/Debian
sudo systemctl start postgresql
sudo -u postgres psql
```

Создать БД и пользователя:
```sql
-- Внутри psql
CREATE DATABASE hotel;
CREATE USER hms WITH PASSWORD 'сложный_пароль';
GRANT ALL PRIVILEGES ON DATABASE hotel TO hms;
\q
```

Применить схему:
```bash
psql -U hms -d hotel -f schema.sql
```

### 4. Переменные окружения

Создать `.env`:
```env
# ── Сервер ───────
PORT=5000

# ── PostgreSQL ────────
DB_HOST=localhost
DB_PORT=5432
DB_USER=hms
DB_PASS=сложный_пароль
DB_NAME=hotel

# ── JWT ───────────────
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**⚠️ Важно:** `.env` должен быть в `.gitignore`. Никогда не коммитить секреты.

### 5. Запуск

```bash
# Development
npm run dev        # nodemon (автоперезапуск)

# Production
npm start          # node server/index.js
```

---

## Production

### Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Перенаправление на HTTPS (когда будет SSL)
    # return 301 https://$host$request_uri;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Статика (опционально — Express и так раздаёт)
    # location /css/ { alias /opt/hotel-management/public/css/; }
    # location /js/  { alias /opt/hotel-management/public/js/; }
}
```

### PM2 (process manager)

```bash
npm install -g pm2

# Запуск
pm2 start server/index.js --name hms

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Команды
pm2 status hms      # статус
pm2 logs hms        # логи
pm2 restart hms     # перезапуск
pm2 stop hms        # остановка
pm2 delete hms      # удаление
```

**ecosystem.config.js (опционально):**
```javascript
module.exports = {
  apps: [{
    name: 'hms',
    script: 'server/index.js',
    instances: 1,              // single instance (нет session sharing)
    autorestart: true,
    max_memory_restart: '256M',
    env_production: {
      NODE_ENV: 'production',
    },
  }],
};
```

### SSL / HTTPS

Получить сертификат через Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Docker (отсутствует)

**Статус:** ⚠️ Docker-конфигурация отсутствует в проекте.

**Необходимо создать:**
- `Dockerfile` для Node.js приложения
- `docker-compose.yml` для PostgreSQL + приложение
- `.dockerignore`

**Примерный `docker-compose.yml`:**
```yaml
version: '3.8'
services:
  db:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_DB: hotel
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  app:
    build: .
    restart: always
    depends_on:
      - db
    ports:
      - "5000:5000"
    env_file:
      - .env

volumes:
  postgres-data:
```

---

## Checklist перед деплоем

- [ ] `.env` имеет реальные значения
- [ ] PostgreSQL БД создана (`createdb hotel`)
- [ ] Схема применена (`psql -U hms -d hotel -f schema.sql`)
- [ ] `npm ci --production` выполнен
- [ ] Nginx настроен
- [ ] SSL сертификат установлен
- [ ] PM2 запущен
- [ ] Бэкап PostgreSQL настроен
- [ ] Логи доступны
- [ ] Firewall открыт только нужные порты (80/443)
- [ ] `helmet` middleware установлен (см. SECURITY.md)
- [ ] Auth реализован (см. SECURITY.md)
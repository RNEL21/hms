const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { requireAuth } = require('./middleware/auth');

const app = express();

// ── Middleware ───────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Отключаем CSP, чтобы не ломать vanilla JS с onclick-атрибутами
  })
);
app.use(morgan('combined'));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ── Rate Limiting для входа ─────────────────────────────
// Применяется только к POST /api/auth/login — брутфорс-защита пароля.
// Register и logout не лимитируются.
const loginLimiter = rateLimit({
  windowMs:  15 * 60 * 1000, // 15 минут
  max:       20,             // максимум 20 попыток входа
  message:   { error: 'Слишком много попыток входа. Попробуйте позже.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Статика ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API Routes ───────────────────────────────────────────
// auth — открытый роутер (login/register/logout)
// loginLimiter применяется только к пути /api/auth/login
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth',     require('./routes/auth'));
// защищённые роуты — requireAuth применяется в самом начале каждого роутера
app.use('/api/rooms',    requireAuth, require('./routes/rooms'));
app.use('/api/guests',   requireAuth, require('./routes/guests'));
app.use('/api/bookings', requireAuth, require('./routes/bookings'));

// ── 404 для API ──────────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// ── Фоллбэк: отдаём лендинг для всех остальных роутов ───
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'landing.html'));
});

// ── Запуск ───────────────────────────────────────────────
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🏨 HMS запущен → http://localhost:${PORT}`);
});

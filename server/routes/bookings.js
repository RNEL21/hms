const router = require('express').Router();
const db     = require('../db');

// ── Вспомогательные функции для конвертации дат ──────────
// Принимает DD.MM.YYYY или YYYY-MM-DD (ISO), возвращает YYYY-MM-DD
const toDBDate = str => {
  if (!str || typeof str !== 'string') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parts = str.split('.');
  if (parts.length !== 3) return null;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

// из YYYY-MM-DD (PostgreSQL DATE) в ISO строку YYYY-MM-DD (для API)
const toDisplayDate = str => {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// форматирование записи бронирования для API
const formatBooking = row => ({
  ...row,
  check_in:  toDisplayDate(row.check_in),
  check_out: toDisplayDate(row.check_out),
});

// GET /api/bookings/stats — статистика для дашборда
router.get('/stats', async (req, res) => {
  try {
    const { rows: totalRows } = await db.query('SELECT COUNT(*) AS total FROM rooms');
    const { rows: freeRows }  = await db.query("SELECT COUNT(*) AS free FROM rooms WHERE status='свободен'");
    const { rows: activeRows} = await db.query("SELECT COUNT(*) AS active FROM bookings WHERE status='активна'");
    const total = +totalRows[0].total;
    const free  = +freeRows[0].free;
    const active = +activeRows[0].active;
    res.json({ total, free, busy: total - free, active });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/bookings — все бронирования с JOIN
router.get('/', async (req, res) => {
  const { status, search } = req.query;
  let sql    = `
    SELECT
      b.id, b.check_in, b.check_out, b.status,
      g.id   AS guest_id,  g.name  AS guest_name,
      r.id   AS room_id,   r.number AS room_number,
      r.type AS room_type, r.price AS room_price
    FROM bookings b
    LEFT JOIN guests g ON b.guest_id = g.id
    LEFT JOIN rooms  r ON b.room_id  = r.id
  `;
  const params = [];
  const where  = [];

  if (status) {
    params.push(status);
    where.push('b.status = $' + (params.length));
  }
  if (search) {
    params.push(`%${search}%`, `%${search}%`);
    where.push('(g.name ILIKE $' + (params.length - 1) + ' OR r.number ILIKE $' + (params.length) + ')');
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY b.id DESC';

  try {
    const { rows } = await db.query(sql, params);
    res.json(rows.map(formatBooking));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/bookings/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT b.*, g.name AS guest_name, r.number AS room_number, r.type AS room_type
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms  r ON b.room_id  = r.id
      WHERE b.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Не найдено' });
    res.json(formatBooking(rows[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/bookings — создать бронь (с транзакцией и блокировкой FOR UPDATE)
router.post('/', async (req, res) => {
  const { guest_id, new_guest, room_id, check_in, check_out } = req.body;
  if ((!guest_id && !new_guest) || !room_id || !check_in || !check_out)
    return res.status(400).json({ error: 'Все поля обязательны' });

  const dbCheckIn  = toDBDate(check_in);
  const dbCheckOut = toDBDate(check_out);
  if (!dbCheckIn || !dbCheckOut)
    return res.status(400).json({ error: 'Неверный формат даты' });
  if (new Date(dbCheckOut) <= new Date(dbCheckIn))
    return res.status(400).json({ error: 'Дата выезда должна быть позже даты заезда' });

  const conn = await db.connect();
  try {
    await conn.query('BEGIN');

    // Создаём нового гостя, если передан new_guest
    let finalGuestId = guest_id;
    if (new_guest) {
      const { name, phone = '', email = '', passport_number } = new_guest;
      if (!name || !passport_number) {
        await conn.query('ROLLBACK');
        return res.status(400).json({ error: 'ФИО и паспорт нового гостя обязательны' });
      }
      try {
        const { rows: guestRows } = await conn.query(
          'INSERT INTO guests (name, phone, email, passport_number, passport_scan) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [name, phone, email, passport_number, '']
        );
        finalGuestId = guestRows[0].id;
      } catch (e) {
        await conn.query('ROLLBACK');
        if (e.code === '23505')
          return res.status(409).json({ error: 'Гость с таким паспортом уже зарегистрирован' });
        throw e;
      }
    }

    // Блокируем строку номера на время транзакции
    const { rows: roomRows } = await conn.query(
      'SELECT * FROM rooms WHERE id = $1 FOR UPDATE',
      [room_id]
    );
    if (!roomRows.length) {
      await conn.query('ROLLBACK');
      return res.status(404).json({ error: 'Номер не найден' });
    }

    // Проверяем пересечение дат с существующими активными бронями
    const { rows: overlaps } = await conn.query(`
      SELECT id FROM bookings
      WHERE room_id = $1
        AND status = 'активна'
        AND NOT (check_out <= $2 OR check_in >= $3)
      LIMIT 1
    `, [room_id, dbCheckIn, dbCheckOut]);

    if (overlaps.length) {
      await conn.query('ROLLBACK');
      return res.status(409).json({ error: 'Номер уже занят на выбранные даты' });
    }

    // Создаём бронь
    const { rows: insertRows } = await conn.query(
      'INSERT INTO bookings (guest_id, room_id, check_in, check_out, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [finalGuestId, room_id, dbCheckIn, dbCheckOut, 'активна']
    );

    // Помечаем номер как занятый
    await conn.query("UPDATE rooms SET status='занят' WHERE id=$1", [room_id]);

    await conn.query('COMMIT');

    // Возвращаем полную запись с JOIN
    const { rows: resultRows } = await db.query(`
      SELECT b.*, g.name AS guest_name, r.number AS room_number,
             r.type AS room_type, r.price AS room_price
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms  r ON b.room_id  = r.id
      WHERE b.id = $1`, [insertRows[0].id]);

    res.status(201).json(formatBooking(resultRows[0]));
  } catch (e) {
    await conn.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// PUT /api/bookings/:id/cancel — отменить бронь
router.put('/:id/cancel', async (req, res) => {
  const conn = await db.connect();
  try {
    await conn.query('BEGIN');

    const { rows } = await conn.query(
      'SELECT * FROM bookings WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) {
      await conn.query('ROLLBACK');
      return res.status(404).json({ error: 'Бронь не найдена' });
    }
    if (rows[0].status !== 'активна') {
      await conn.query('ROLLBACK');
      return res.status(409).json({ error: 'Бронь уже отменена' });
    }

    // Меняем статус брони
    await conn.query("UPDATE bookings SET status='отменена' WHERE id=$1", [req.params.id]);

    // Освобождаем номер и отмечаем потребность в уборке
    await conn.query(
      "UPDATE rooms SET status='свободен', needs_cleaning=TRUE WHERE id=$1",
      [rows[0].room_id]
    );

    await conn.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await conn.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

module.exports = router;

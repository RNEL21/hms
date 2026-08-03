const router = require('express').Router();
const db     = require('../db');

// GET /api/guests — все гости (опциональный поиск ?search=)
router.get('/', async (req, res) => {
  const { search } = req.query;
  let sql    = 'SELECT * FROM guests';
  const params = [];

  if (search) {
    sql += ' WHERE name LIKE $1 OR phone LIKE $2 OR passport_number LIKE $3 OR email LIKE $4';
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  sql += ' ORDER BY name';

  try {
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/guests/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM guests WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Не найдено' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/guests — создать гостя
router.post('/', async (req, res) => {
  const { name, phone = '', email = '', passport_number, passport_scan = '' } = req.body;
  if (!name || !passport_number)
    return res.status(400).json({ error: 'ФИО и паспорт обязательны' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Некорректный email' });

  try {
    const { rows } = await db.query(
      'INSERT INTO guests (name, phone, email, passport_number, passport_scan) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phone, email, passport_number, passport_scan]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/guests/:id — обновить гостя
router.put('/:id', async (req, res) => {
  const { name, phone = '', email = '', passport_number, passport_scan = '' } = req.body;
  if (!name || !passport_number)
    return res.status(400).json({ error: 'ФИО и паспорт обязательны' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Некорректный email' });

  try {
    const { rows } = await db.query(
      'UPDATE guests SET name=$1, phone=$2, email=$3, passport_number=$4, passport_scan=$5 WHERE id=$6 RETURNING *',
      [name, phone, email, passport_number, passport_scan, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Не найдено' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/guests/:id
router.delete('/:id', async (req, res) => {
  const conn = await db.connect();
  try {
    // Проверяем наличие активных бронирований у этого гостя
    const { rows } = await conn.query(
      'SELECT id FROM bookings WHERE guest_id = $1 AND status = $2 LIMIT 1',
      [req.params.id, 'активна']
    );
    if (rows.length) {
      return res.status(400).json({ error: 'Невозможно удалить гостя, так как у него есть активные бронирования' });
    }

    const { rowCount } = await conn.query('DELETE FROM guests WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Не найдено' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

module.exports = router;

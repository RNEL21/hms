const router = require('express').Router();
const db     = require('../db');

// GET /api/rooms — все номера (опциональные фильтры ?type=&status=)
router.get('/', async (req, res) => {
  const { type, status } = req.query;
  let sql    = `
    SELECT r.*, b.check_out AS active_checkout
    FROM rooms r
    LEFT JOIN bookings b ON b.room_id = r.id AND b.status = 'активна'
  `;
  const params = [];
  const where  = [];

  if (type)   { where.push('r.type = $' + (params.length + 1));   params.push(type);   }
  if (status) { where.push('r.status = $' + (params.length + 1)); params.push(status); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY r.number';

  try {
    const { rows } = await db.query(sql, params);
    res.json(rows.map(r => ({ ...r, price: +r.price })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/rooms/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Не найдено' });
    res.json({ ...rows[0], price: +rows[0].price });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/rooms — создать номер
router.post('/', async (req, res) => {
  const { number, type, price, status = 'свободен', note = null } = req.body;
  if (!number || !type || price == null)
    return res.status(400).json({ error: 'Номер, тип и цена обязательны' });
  if (price <= 0)
    return res.status(400).json({ error: 'Цена должна быть больше нуля' });
  try {
    const { rows } = await db.query(
      'INSERT INTO rooms (number, type, price, status, note) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [number, type, price, status, note]
    );
    res.status(201).json({ ...rows[0], price: +rows[0].price });
  } catch (e) {
    if (e.code === '23505')
      return res.status(409).json({ error: 'Такой номер уже существует' });
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/rooms/:id — обновить номер
router.put('/:id', async (req, res) => {
  const { number, type, price, status, note = null } = req.body;
  if (price != null && price <= 0) {
    return res.status(400).json({ error: 'Цена должна быть больше нуля' });
  }
  try {
    const { rows } = await db.query(
      'UPDATE rooms SET number=$1, type=$2, price=$3, status=$4, note=$5 WHERE id=$6 RETURNING *',
      [number, type, price, status, note, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Не найдено' });
    res.json({ ...rows[0], price: +rows[0].price });
  } catch (e) {
    if (e.code === '23505')
      return res.status(409).json({ error: 'Такой номер уже существует' });
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/rooms/:id/cleaning — переключить needs_cleaning
router.patch('/:id/cleaning', async (req, res) => {
  const { needs_cleaning } = req.body;
  try {
    const { rows } = await db.query(
      needs_cleaning
        ? 'UPDATE rooms SET needs_cleaning = TRUE WHERE id = $1 RETURNING *'
        : 'UPDATE rooms SET needs_cleaning = FALSE, last_cleaned_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Не найдено' });
    res.json({ ...rows[0], price: +rows[0].price });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/rooms/:id
router.delete('/:id', async (req, res) => {
  const conn = await db.connect();
  try {
    // Проверяем наличие активных бронирований для этого номера
    const { rows } = await conn.query(
      'SELECT id FROM bookings WHERE room_id = $1 AND status = $2 LIMIT 1',
      [req.params.id, 'активна']
    );
    if (rows.length) {
      return res.status(400).json({ error: 'Невозможно удалить номер, так как на него оформлены бронирования' });
    }

    const { rowCount } = await conn.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Не найдено' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

module.exports = router;

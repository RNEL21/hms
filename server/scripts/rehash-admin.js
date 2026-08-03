require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db');

(async () => {
  try {
    const hash = await bcrypt.hash('admin', 10);
    await db.query("UPDATE users SET password = $1 WHERE login = 'admin'", [hash]);
    console.log('✅ Пароль admin переведён на bcrypt');
  } catch (e) {
    console.error('❌ Ошибка:', e.message);
    process.exit(1);
  }
  process.exit(0);
})();

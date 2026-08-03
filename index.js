const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 5000;

// Настройка подключения к вашей MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'docker run --name mysql-local -e MYSQL_ROOT_PASSWORD=ваш_пароль -p 3306:3306 -d mysql:latest', // <-- Укажите ваш пароль
    database: 'cinema'
});

connection.connect(err => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
        return;
    }
    console.log('Успешно подключено к MySQL!');
});

// Настройка автоматической раздачи статики из папки public
app.use(express.static(path.join(__dirname, 'public')));

// API для получения данных из БД
app.get('/api/films', (req, res) => {
    connection.query('SELECT * FROM films', (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен. Страница доступна по адресу: http://localhost:${PORT}`);
});
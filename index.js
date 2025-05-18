require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express(); 
const port = process.env.PORT || 3000;

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Підключення до MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Помилка підключення до бази даних:', err);
        return;
    }
    console.log('Підключено до бази даних MySQL');
});

app.use(bodyParser.json());

// Збереження нової схеми
app.post('/save-schema', (req, res) => {
    const { title, schemaData } = req.body;
    const query = 'INSERT INTO schemas_drawflow (title, schema_data) VALUES (?, ?)';
    db.query(query, [title, JSON.stringify(schemaData)], (err, result) => {
        if (err) {
            console.error('Помилка при збереженні:', err);
            return res.status(500).json({ error: 'Не вдалося зберегти схему' });
        }
        res.json({ message: 'Схема успішно збережена', id: result.insertId });
    });
});

// Оновлення схеми
app.put('/update-schema/:id', (req, res) => {
    const schemaId = req.params.id;
    const { title, schemaData } = req.body;
    const query = 'UPDATE schemas_drawflow SET title = ?, schema_data = ? WHERE id = ?';
    db.query(query, [title, JSON.stringify(schemaData), schemaId], (err, result) => {
        if (err) {
            console.error('Помилка при оновленні:', err);
            return res.status(500).json({ error: 'Не вдалося оновити схему' });
        }
        res.json({ message: 'Схема оновлена' });
    });
});

// Отримати схему за id
app.get('/get-schema/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM schemas_drawflow WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Схема не знайдена' });

        let schemaData = results[0].schema_data;

        // Якщо schemaData є рядком, парсимо його, інакше передаємо як є
        try {
            if (typeof schemaData === 'string') {
                schemaData = JSON.parse(schemaData);
            }
        } catch (parseErr) {
            return res.status(500).json({ error: 'Помилка парсингу JSON у schema_data' });
        }

        res.json({
            id: results[0].id,
            title: results[0].title,
            schemaData: schemaData
        });
    });
});

// Отримати всі схеми
app.get('/get-all-schemas', (req, res) => {
    db.query("SELECT * FROM schemas_drawflow", (err, results) => {
        if (err) {
            console.error("Помилка при запиті до MySQL:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Видалення схеми
app.delete('/delete-schema/:id', (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM schemas_drawflow WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(port, () => {
    console.log(`Сервер працює на http://localhost:${port}`);
});
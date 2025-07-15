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

// Connecting to MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

app.use(bodyParser.json());

// Saving a new scheme
app.post('/save-schema', (req, res) => {
    const { title, schemaData } = req.body;
    const query = 'INSERT INTO schemas_drawflow (title, schema_data) VALUES (?, ?)';
    db.query(query, [title, JSON.stringify(schemaData)], (err, result) => {
        if (err) {
            console.error('Error while saving:', err);
            return res.status(500).json({ error: 'Failed to save the schema' });
        }
        res.json({ message: 'Schema successfully saved', id: result.insertId });
    });
});

// Updating a schema
app.put('/update-schema/:id', (req, res) => {
    const schemaId = req.params.id;
    const { title, schemaData } = req.body;
    const query = 'UPDATE schemas_drawflow SET title = ?, schema_data = ? WHERE id = ?';
    db.query(query, [title, JSON.stringify(schemaData), schemaId], (err, result) => {
        if (err) {
            console.error('Error while updating:', err);
            return res.status(500).json({ error: 'Failed to update the schema' });
        }
        res.json({ message: 'Schema updated' });
    });
});

// Get a schema by id
app.get('/get-schema/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM schemas_drawflow WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Schema not found' });

        let schemaData = results[0].schema_data;

        // If schemaData is a string, parse it; otherwise, pass it as is
        try {
            if (typeof schemaData === 'string') {
                schemaData = JSON.parse(schemaData);
            }
        } catch (parseErr) {
            return res.status(500).json({ error: 'Error parsing JSON in schema_data' });
        }

        res.json({
            id: results[0].id,
            title: results[0].title,
            schemaData: schemaData
        });
    });
});

// Get all schemas
app.get('/get-all-schemas', (req, res) => {
    db.query("SELECT * FROM schemas_drawflow", (err, results) => {
        if (err) {
            console.error("Error querying MySQL:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Deleting a schema
app.delete('/delete-schema/:id', (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM schemas_drawflow WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
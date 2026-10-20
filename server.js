require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

pool.query(`CREATE TABLE IF NOT EXISTS items (id SERIAL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), created_at TIMESTAMP DEFAULT NOW())`, (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
  console.log('Database connected & table ready');
});

app.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
  res.render('index', { items: result.rows });
});

app.post('/items', async (req, res) => {
  const { name, email } = req.body;
  await pool.query(
    'INSERT INTO items (name, email) VALUES ($1, $2)',
    [name, email]
  );
  res.redirect('/');
});

app.put('/items/:id', async (req, res) => {
  const { name, email } = req.body;
  await pool.query(
    'UPDATE items SET name = $1, email = $2 WHERE id = $3',
    [name, email, req.params.id]
  );
  res.json({ success: true });
});

app.delete('/items/:id', async (req, res) => {
  await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
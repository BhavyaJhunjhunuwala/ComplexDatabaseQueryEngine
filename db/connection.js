require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false } // For Neon's SSL
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        price DECIMAL(10, 2),
        stock INTEGER DEFAULT 100
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER
      );
    `);

    // Add indexes for optimization
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);');

    // Insert sample data (if tables are empty)
    const userCount = await client.query('SELECT COUNT(*) FROM users;');
    if (userCount.rows[0].count === '0') {
      await client.query(`
        INSERT INTO users (name, email) VALUES
        ('Alice', 'alice@example.com'),
        ('Bob', 'bob@example.com'),
        ('Charlie', 'charlie@example.com');
      `);
      await client.query(`
        INSERT INTO products (name, price) VALUES
        ('Laptop', 1200.00),
        ('Phone', 800.00),
        ('Headphones', 150.00);
      `);
      await client.query(`
        INSERT INTO orders (user_id, product_id, quantity) VALUES
        (1, 1, 1), (1, 2, 2), (2, 1, 3), (2, 3, 1), (3, 2, 1);
      `);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw new Error(`Database initialization failed: ${err.message}`);
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };
const { pool } = require('./connection');

async function placeOrder(userId, productId, quantity) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO orders (user_id, product_id, quantity) VALUES ($1, $2, $3);',
      [userId, productId, quantity]
    );
    const stockCheck = await client.query(
      'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING stock;',
      [quantity, productId]
    );
    if (stockCheck.rowCount === 0) {
      throw new Error('Insufficient stock or invalid product ID');
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw new Error(`Error placing order: ${err.message}`);
  } finally {
    client.release();
  }
}

module.exports = { placeOrder };
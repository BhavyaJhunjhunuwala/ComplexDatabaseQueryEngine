const { pool } = require('./connection');

async function getRecommendations(userId, pageSize = 5, page=1) {
  const query = `
    SELECT p.name AS product_name, p.price
    FROM users u
    CROSS JOIN products p
    WHERE u.id = $1 AND p.id NOT IN (SELECT product_id FROM orders WHERE user_id = $1)
    LIMIT $2 OFFSET $3;
  `;

  offset = (page - 1) * pageSize;
  const values = [userId, pageSize, offset];
  try {
    const res = await pool.query(query, values);
    const totalResult = await pool.query("SELECT COUNT(*) FROM products");
    const totalResults = parseInt(totalResult.rows[0].count);
    const totalPages = Math.ceil(totalResults / pageSize);

    return {
      result: res.rows,
      pagination: {
        currentPage: page,
        pageSize,
        totalPages,
        totalResults,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages
      }
    };
  } catch (err) {
    throw new Error(`Error fetching recommendations: ${err.message}`);
  }
}

async function getHighValueUsers(vlu, pageSize, page) {
  const offset = (page - 1) * pageSize;

  // Main query with pagination
  const query = `
    SELECT u.id, u.name, SUM(o.quantity * p.price) AS total_value
    FROM users u
    JOIN orders o ON u.id = o.user_id
    JOIN products p ON o.product_id = p.id
    GROUP BY u.id, u.name
    HAVING SUM(o.quantity * p.price) > $1
    ORDER BY total_value DESC
    LIMIT $2 OFFSET $3;
  `;

  const values = [vlu, pageSize, offset];

  try {
    // Get paginated rows
    const result = await pool.query(query, values);

    // Get total count of high-value users (without LIMIT/OFFSET)
    const countQuery = `
      SELECT COUNT(*) FROM (
        SELECT u.id
        FROM users u
        JOIN orders o ON u.id = o.user_id
        JOIN products p ON o.product_id = p.id
        GROUP BY u.id, u.name
        HAVING SUM(o.quantity * p.price) > $1
      ) AS subquery;
    `;
    const totalResult = await pool.query(countQuery, [vlu]);
    const totalResults = parseInt(totalResult.rows[0].count);
    const totalPages = Math.ceil(totalResults / pageSize);

    return {
      data: result.rows,
      pagination: {
        currentPage: page,
        pageSize,
        totalPages,
        totalResults,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages
      }
    };
  } catch (err) {
    console.error("Error fetching high-value users:", err);
    throw err;
  }
}


async function getTopProductsPerUser(userId) {
  const query = `
    SELECT u.name AS user_name, p.name AS product_name, sub.total_quantity
    FROM users u
    JOIN (
      SELECT user_id, product_id, SUM(quantity) AS total_quantity
      FROM orders
      WHERE user_id = $1
      GROUP BY user_id, product_id
      ORDER BY total_quantity DESC
      LIMIT 1
    ) sub ON u.id = sub.user_id
    JOIN products p ON sub.product_id = p.id;
  `;

  const values = [userId];
  try {
    const res = await pool.query(query, values);
    return res.rows;
  } catch (err) {
    throw new Error(`Error fetching top products: ${err.message}`);
  }
}

module.exports = { getRecommendations, getHighValueUsers, getTopProductsPerUser };
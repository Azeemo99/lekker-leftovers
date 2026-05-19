const express = require('express');
const router = express.Router();
const db = require('../database');

// POST /place_order
router.post('/', async (req, res) => {
  const user = req.session.user;

  if (!user || user.account_type !== 'customer') {
    return res.redirect('/login');
  }

  const { product_id, order_quantity } = req.body;

  if (!product_id || !order_quantity) {
    return res.status(400).send("Missing product ID or order quantity.");
  }

  try {
    // First, check if enough quantity is available
    const [rows] = await db.promise().query(
      'SELECT product_quantity FROM product_table WHERE product_id = ?',
      [product_id]
    );

    if (rows.length === 0) {
      return res.status(404).send("Product not found.");
    }

    const availableQty = rows[0].product_quantity;

    if (order_quantity > availableQty) {
      return res.status(400).send(`Only ${availableQty} items available.`);
    }

    // Start a transaction
    await db.promise().beginTransaction();

    // Insert order into order_table
    const insertOrder = `
      INSERT INTO order_table (customer_id, order_quantity, product_id, status)
      VALUES (?, ?, ?, 'ordered')
    `;

    await db.promise().query(insertOrder, [
      user.id,
      order_quantity,
      product_id
    ]);

    // Decrement product quantity
    const updateQty = `
      UPDATE product_table
      SET product_quantity = product_quantity - ?
      WHERE product_id = ?
    `;

    await db.promise().query(updateQty, [order_quantity, product_id]);

    // Commit transaction
    await db.promise().commit();

    console.log(`Order placed by customer ${user.id} for product ${product_id}`);

    res.redirect('/customer_dashboard'); // Or confirmation page
  } catch (err) {
    // Rollback if any error happens
    await db.promise().rollback();
    console.error("Order placement error:", err);
    res.status(500).send("Failed to place order.");
  }
});
module.exports = router;
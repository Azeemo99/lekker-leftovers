const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');


router.get('/:productId', async (req, res) => {
  const productId = req.params.productId;
  const user = req.session.user;

  try {
    // Basic product + supplier info
    const [productRows] = await db.promise().query(
      `SELECT p.*, s.fname AS supplier_fname, s.username AS supplier_username, s.lname AS supplier_lname
       FROM product_table p
       JOIN supplier_table s ON p.supplier_id = s.supplier_id
       WHERE p.product_id = ?`,
      [productId]
    );

    if (productRows.length === 0) {
      return res.status(404).send("Product not found.");
    }

    const product = productRows[0];

    product.pickupTime = new Date(product.pickupTime).toLocaleString();
    product.latidude = product.latitude;

    // Default to 0
    product.order_quantity = 0;
    product.total_price = 0;

    // If logged in customer, fetch their order_quantity
    if (user && user.account_type === 'customer') {
      const [orderRows] = await db.promise().query(
        `SELECT order_quantity FROM order_table
         WHERE customer_id = (SELECT customer_id FROM customer_table WHERE username = ?)
         AND product_id = ?`,
        [user.username, productId]
      );

      if (orderRows.length > 0) {
        product.order_quantity = orderRows[0].order_quantity;
        product.total_price = product.price * product.order_quantity;
      }
    }

    res.render('order', {
      title: product.name,
      user,
      product
    });

  } catch (err) {
    console.error("Error fetching product details:", err);
    res.status(500).send("Server error.");
  }
});


router.post('/delete_order', async (req, res) => {
  const { product_id } = req.body;
  const user = req.session.user;

  if (!user || user.account_type !== 'customer') {
    return res.status(403).send('Unauthorized');
  }

  if (!product_id) {
    return res.status(400).send('Missing product_id');
  }

  try {
    // 1. Get customer_id
    const [customerRows] = await db.promise().query(
      'SELECT customer_id FROM customer_table WHERE username = ?',
      [user.username]
    );

    if (customerRows.length === 0) {
      return res.status(404).send('Customer not found');
    }

    const customer_id = customerRows[0].customer_id;

    // 2. Get order_quantity from order_table
    const [orderRows] = await db.promise().query(
      'SELECT order_quantity FROM order_table WHERE product_id = ? AND customer_id = ?',
      [product_id, customer_id]
    );

    if (orderRows.length === 0) {
      return res.status(404).send('Order not found or not authorized');
    }

    const orderQuantity = orderRows[0].order_quantity;

    // 3. Delete the order
    const [deleteResult] = await db.promise().query(
      'DELETE FROM order_table WHERE product_id = ? AND customer_id = ?',
      [product_id, customer_id]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).send('Order not found or not authorized');
    }

    // 4. Add back the quantity to product_table
    await db.promise().query(
      'UPDATE product_table SET product_quantity = product_quantity + ? WHERE product_id = ?',
      [orderQuantity, product_id]
    );

    // 5. Redirect after all done
    res.redirect('/listings');

  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).send('Internal Server Error');
  }
});


// In order.js
router.post('/show_code', async (req, res) => {
  const { product_id } = req.body;
  const user = req.session.user;

  if (!user || user.account_type !== 'customer') {
    return res.status(403).send('Unauthorized');
  }

  try {
    const [customerRows] = await db.promise().query(
      'SELECT customer_id FROM customer_table WHERE username = ?',
      [user.username]
    );

    if (customerRows.length === 0) {
      return res.status(404).send('Customer not found');
    }

    const customer_id = customerRows[0].customer_id;

    const [orderRows] = await db.promise().query(
      'SELECT order_id FROM order_table WHERE product_id = ? AND customer_id = ?',
      [product_id, customer_id]
    );

    if (orderRows.length === 0) {
      return res.status(404).send('Order not found');
    }

    const order_id = orderRows[0].order_id;

    // Short, user-friendly code
    const shortCode = order_id.toString(36).padStart(4, '0').slice(-4).toUpperCase();

    // Render it to the user
    res.render('code', {
      title: 'Your Pickup Code',
      code: shortCode
    });

  } catch (err) {
    console.error('Error generating order code:', err);
    res.status(500).send('Internal Server Error');
  }
});


module.exports = router;

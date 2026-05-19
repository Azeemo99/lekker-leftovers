const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /supplier_order/:orderId
router.get('/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const user = req.session.user;

  if (!user || user.account_type !== 'supplier') {
    return res.redirect('/login');
  }

  try {
    const [rows] = await db.promise().query(`
      SELECT o.order_id, o.order_quantity, o.status,
             c.fname AS customer_fname, c.lname AS customer_lname,
             p.name AS product_name, p.description, p.price, p.pickupTime
      FROM order_table o
      JOIN product_table p ON o.product_id = p.product_id
      JOIN customer_table c ON o.customer_id = c.customer_id
      WHERE o.order_id = ? AND p.supplier_id = ?
    `, [orderId, user.id]);

    if (rows.length === 0) {
      return res.status(404).send("Order not found.");
    }

    const order = rows[0];
    const total_price = (order.price * order.order_quantity).toFixed(2);
    const short_code = order.order_id.toString(36);
    res.render('supplier_order', {
        user,
        order: {
            ...order,
         pickupTime: new Date(order.pickupTime).toLocaleString(),
     total_price
    },
    short_code
});
  } catch (err) {
    console.error("Error loading order details:", err);
    res.status(500).send("Server error.");
  }
});

// POST to verify pickup code (stubbed for now)
router.post('/verify_code', async (req, res) => {
  const { short_code } = req.body;

  if (!short_code) {
    return res.status(400).send('Missing code');
  }

  const orderId = parseInt(short_code, 36);

  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM order_table WHERE order_id = ?',
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).send('Order not found');
    }

    await db.promise().query(
      'UPDATE order_table SET status = ? WHERE order_id = ?',
      ['completed', orderId]
    );

    res.send(`Order ${orderId} marked as completed.`);
  } catch (err) {
    console.error('Error verifying code:', err);
    res.status(500).send('Server error');
  }
});


module.exports = router;

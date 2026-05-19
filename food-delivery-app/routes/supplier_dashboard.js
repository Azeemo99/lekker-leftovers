const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  const user = req.session.user;

  if (!user || user.account_type !== 'supplier') {
    return res.redirect('/login');
  }

  try {
    // Get supplier data
    const [supplierRows] = await db.promise().query(
      'SELECT * FROM supplier_table WHERE supplier_id = ?',
      [user.id]
    );
    if (supplierRows.length === 0) {
      return res.status(404).send("Supplier not found.");
    }
    const supplier = supplierRows[0];

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get today's "ordered" orders for this supplier's products
    const [orderRows] = await db.promise().query(`
      SELECT o.order_id, o.order_quantity, o.status,
       p.name AS product_name, p.description, p.price, p.upload_date, p.pickupTime
      FROM order_table o
      JOIN product_table p ON o.product_id = p.product_id
      WHERE p.supplier_id = ?
      AND o.status = 'ordered'
      AND DATE(p.upload_date) = ?
    `, [user.id, today]);
  const formattedOrders = orderRows.map(order => {
  return {
    ...order,
    pickupTime: new Date(order.pickupTime).toLocaleString(),
    total_price: order.price * order.order_quantity 
  };
  });

    res.render('supplier_dashboard', {
      user: {
        fname: supplier.fname,
        lname: supplier.lname,
        username: supplier.username,
        phone_number: supplier.phone_number,
        account_type: user.account_type,
        id: user.userId
      },
      listings: formattedOrders
    });

  } catch (err) {
    console.error("Error loading supplier dashboard:", err);
    res.status(500).send("Server error.");
  }
});

module.exports = router;

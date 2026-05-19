const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  const user = req.session.user;

  if (!user || user.account_type !== 'customer') {
    return res.redirect('/login');
  }

  try {
    // Get customer data
    const [customerRows] = await db.promise().query(
      'SELECT * FROM customer_table WHERE customer_id = ?',
      [user.id]
    );

    if (customerRows.length === 0) {
      return res.status(404).send("Customer not found.");
    }

    const customer = customerRows[0];

    // Get all orders made by this customer (regardless of date)
    const [orderRows] = await db.promise().query(`
    SELECT o.order_id, o.order_quantity, o.status,
             p.product_id, p.name AS product_name, p.description, p.price, p.upload_date, p.pickupTime, p.latitude, p.longitude
        FROM order_table o
        JOIN product_table p ON o.product_id = p.product_id
        WHERE o.customer_id = ?
          AND o.status = 'ordered'
          AND DATE(p.pickupTime) = CURDATE()

    `, [user.id]);
    const formattedOrders = orderRows.map(order => {
    return {
      ...order,
      pickupTime: new Date(order.pickupTime).toLocaleString(),
      latitude: order.latitude,   // Fixed typo: latidude -> latitude
      longitude: order.longitude,
      total_price: order.order_quantity * order.price  // Calculate total price
      };
    });
    res.render('customer_dashboard', {
      user: {
        fname: customer.fname,
        lname: customer.lname,
        username: customer.username,
        phone_number: customer.phone_number,
        account_type: user.account_type,
        id: user.id
      },
      listings: formattedOrders
    }); 
    

  } catch (err) {
    console.error("Error loading customer dashboard:", err);
    res.status(500).send("Server error.");
  }
});

module.exports = router;

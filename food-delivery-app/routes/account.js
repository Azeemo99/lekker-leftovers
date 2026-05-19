const express = require('express');
const router = express.Router();
const connection = require('../database');
const bcrypt = require('bcrypt');


router.get('/', async (req, res) => {
    try {

        const customerId = req.session.user.id;

        
        const [customerRows] = await connection.promise().query(
            `SELECT * FROM customer_table WHERE customer_id = ?`, 
            [customerId]
        );

        if (customerRows.length === 0) {
            return res.status(404).render('error', { 
                message: 'Customer account not found' 
            });
        }

// In your order history query, modify to:
        const [orderRows] = await connection.promise().query(
            `SELECT 
                o.order_id,
                o.status,
                o.order_quantity,
                o.status_update_time as order_date,
                p.product_id,
                p.name as product_name,
                CAST(p.price AS DECIMAL(10,2)) as price,
             s.supplier_id,
             s.fname as supplier_fname,
                s.lname as supplier_lname,
             CAST((p.price * o.order_quantity) AS DECIMAL(10,2)) as total_price
             FROM order_table o
           JOIN product_table p ON o.product_id = p.product_id
             JOIN supplier_table s ON p.supplier_id = s.supplier_id
             WHERE o.customer_id = ?
          ORDER BY o.status_update_time DESC`,
            [customerId]
        );

// Then process the results:
const orders = orderRows.map(order => ({
    ...order,
    price: Number(order.price),
    total_price: Number(order.total_price),
    order_quantity: Number(order.order_quantity),
    order_date: order.order_date || new Date()
}));

        res.render('account', {
            title: 'My Account',
            customer: customerRows[0],
            orders: orderRows,
            messages: req.session.messages || null
        });
        
        delete req.session.messages;
    } catch (err) {
        console.error('Account page error:', err);
        res.status(500).render('error', { 
            message: 'Error loading account',
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }
});

// Update customer account
// Update customer account
// Update customer account
router.post('/update', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const customerId = req.session.user.id;

    // Get current hashed password
    const [[customer]] = await connection.promise().query(
      `SELECT password FROM customer_table WHERE customer_id = ?`, 
      [customerId]
    );

    // Validate current password before proceeding
    const matchCurrent = await bcrypt.compare(currentPassword, customer.password);
    if (!matchCurrent) {
      req.session.messages = { error: 'Current password is incorrect' };
      return res.redirect('/account');
    }

    // If a new password is provided
    if (newPassword) {
      // Check if new password is the same as old
      const sameAsOld = await bcrypt.compare(newPassword, customer.password);
      if (sameAsOld) {
        req.session.messages = { error: 'New password cannot be the same as the old password' };
        return res.redirect('/account');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update username and password
      await connection.promise().query(
        `UPDATE customer_table SET username = ?, password = ? WHERE customer_id = ?`,
        [username, hashedPassword, customerId]
      );
    } else {
      // Update only the username
      await connection.promise().query(
        `UPDATE customer_table SET username = ? WHERE customer_id = ?`,
        [username, customerId]
      );
    }

    req.session.user.username = username;
    req.session.messages = { success: 'Account updated successfully' };
    res.redirect('/account');
  } catch (err) {
    console.error('Error updating account:', err);
    req.session.messages = { error: 'Error updating account' };
    res.redirect('/account');
  }
});



module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/:productId', async (req, res) => {
  const productId = req.params.productId;

  try {
    const [rows] = await db.promise().query(
      'SELECT p.*, s.fname AS supplier_fname, s.lname AS supplier_lname FROM product_table p JOIN supplier_table s ON p.supplier_id = s.supplier_id WHERE product_id = ?',
      [productId]
    );

    if (rows.length === 0) {
      return res.status(404).send("Product not found.");
    }
    const formattedOrders = rows.map(order => {
      return {
        ...order,
        pickupTime: new Date(order.pickupTime).toLocaleString(),
        latidude: order.latidude,
        longitude: order.longitude
        };
      });
    const product = rows[0];
    res.render('product_detail', {
      title: product.name,
      user: req.session.user || null,
      product
    });
  } catch (err) {
    console.error("Error fetching product details:", err);
    res.status(500).send("Server error.");
  }
});

module.exports = router;

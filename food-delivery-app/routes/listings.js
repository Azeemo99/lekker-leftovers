  const express = require('express');
  const router = express.Router();
  const db = require('../database');

  router.get('/', async (req, res) => {
    try {
      const [products] = await db.promise().query(`
        SELECT p.*, s.fname AS supplier_fname, s.lname AS supplier_lname
        FROM product_table p
        JOIN supplier_table s ON p.supplier_id = s.supplier_id
        WHERE DATE(p.pickupTime) = CURDATE() AND
         p.product_quantity != 0
        ORDER BY p.upload_date DESC
      `);
      const formattedProducts = products.map(product => {
        return {
          ...product,
          pickupTime: new Date(product.pickupTime).toLocaleString()
          };
        });    

      res.render('listings', {
        title: 'Product Listings',
        user: req.session.user || null,
        formattedProducts
      });
    } catch (err) {
      console.error("Error fetching products:", err);
      res.status(500).send("Server error.");
    }
  });

  module.exports = router;

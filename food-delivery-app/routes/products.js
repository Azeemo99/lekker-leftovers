const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  const user = req.session.user;

  try {
    // Get all products along with supplier info (optional)
    const [products] = await db.promise().query(`
      SELECT p.product_id, p.name, p.description, p.price, p.upload_date,
             s.fname AS supplier_fname, s.lname AS supplier_lname
      FROM product_table p
      JOIN supplier_table s ON p.supplier_id = s.supplier_id
      ORDER BY p.upload_date DESC
    `);

    res.render('products', {
      title: 'All Products',
      user: user || null,
      products
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Server error.');
  }
});

module.exports = router;

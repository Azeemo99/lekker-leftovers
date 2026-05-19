const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/:productId', async (req, res) => {
  const productId = req.params.productId;
  console.log(productId);
  var deleteQuery = "DELETE FROM product_table WHERE product_id = ?";
  db.query(deleteQuery, productId, (err, result)=>{
    if (err) {
        console.error(err);            
        return res.status(500).send("Error deleting product");
    }
    res.redirect('/supplier_listings');
  });

});

module.exports = router;

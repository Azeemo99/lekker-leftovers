const express = require('express');
const crypto  = require('crypto');
const db      = require('../database');
const router  = express.Router();

// Only allow logged-in suppliers (LOK users)
function ensureSupplier(req, res, next) {
  if (!req.session.user || req.session.user.account_type !== 'supplier') {
    return res.redirect('/login');
  }
  next();
}

// Point values per kilogram
const POINTS = {
  metal:   5,
  plastic: 4,
  paper:   3,
  glass:   2,
  organic: 1
};

// Show the form
router.get('/', ensureSupplier, (req, res) => {
  res.render('lok-dashboard', { code: null, error: null });
});

// Handle submissions
router.post('/generate', ensureSupplier, async (req, res) => {
  const material = req.body.material;
  const weight   = parseFloat(req.body.weight);

  // Validate inputs
  if (!POINTS[material] || isNaN(weight) || weight <= 0) {
    return res.render('lok-dashboard', {
      code:  null,
      error: 'Please select a valid material and enter a positive weight.'
    });
  }

  // Calculate points (allow floats, two decimals)
  const points = parseFloat((POINTS[material] * weight).toFixed(2));

  // Generate a unique 8-character hex code
  let code;
  do {
    code = crypto.randomBytes(4).toString('hex'); 
    const [rows] = await db
      .promise()
      .query('SELECT 1 FROM recycling_codes WHERE code = ?', [code]);
    if (rows.length === 0) break;
  } while (true);

  // Insert into recycling_codes
  await db
    .promise()
    .query(
      `INSERT INTO recycling_codes
         (code, material_name, weight, points_gained, created_by)
       VALUES (?,      ?,             ?,      ?,             ?)`,
      [ code, material, weight, points, req.session.user.id ]
    );

  // Show the newly generated code
  res.render('lok-dashboard', { code, error: null });
});

module.exports = router;

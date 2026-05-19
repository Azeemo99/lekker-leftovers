// routes/recycling.js
const express = require('express');
const router  = express.Router();
const db      = require('../database');

// 1) Only allow logged-in customers
function ensureCustomer(req, res, next) {
  if (!req.session.user || req.session.user.account_type !== 'customer') {
    return res.redirect('/login');
  }
  next();
}

// 2) Helper: sum all points for display
async function getTotalPoints(customerId) {
  const [rows] = await db.promise().query(
    `SELECT COALESCE(SUM(points_gained),0) AS total
       FROM waste_management
      WHERE customer_id = ?`,
    [customerId]
  );
  return rows[0].total;
}

// 3) GET /recycling – show the form & current points
router.get('/', ensureCustomer, async (req, res, next) => {
  try {
    const { id, username } = req.session.user;
    const total = await getTotalPoints(id);
    res.render('recycling', {
      username,
      points_gained: total,
      message: null,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

// 4) POST /recycling – process the submitted code
router.post('/', ensureCustomer, async (req, res, next) => {
  const { unique_code } = req.body;           // ← matches name="unique_code"
  const { id: customerId, username } = req.session.user;

  try {
    // a) Look up that code
    const [codes] = await db.promise().query(
      'SELECT * FROM recycling_codes WHERE code = ?',
      [unique_code]
    );
    if (codes.length === 0) {
      throw new Error('Invalid code. Please check and try again.');
    }
    const codeRec = codes[0];

    // b) Has it already been redeemed?
    if (codeRec.redeemed_by) {
      throw new Error('This code has already been redeemed.');
    }

    // c) Mark the code redeemed
    await db.promise().query(
      `UPDATE recycling_codes
          SET redeemed_by = ?, redeemed_at = NOW()
        WHERE code = ?`,
      [customerId, unique_code]
    );

    // d) Log it in waste_management
    await db.promise().query(
      `INSERT INTO waste_management
         (customer_id, points_gained, waste_type, waste_history)
       VALUES (?, ?, ?, ?)`,
      [customerId, codeRec.points_gained, codeRec.material_name, unique_code]
    );

    // e) Re-calculate total and show success
    const newTotal = await getTotalPoints(customerId);
    res.render('recycling', {
      username,
      points_gained: newTotal,
      message: `Success! You gained ${codeRec.points_gained} points.`,
      error: null
    });

  } catch (err) {
    // On any error, re-render with the existing total + error
    const total = await getTotalPoints(customerId);
    res.render('recycling', {
      username,
      points_gained: total,
      message: null,
      error: err.message
    });
  }
});

module.exports = router;

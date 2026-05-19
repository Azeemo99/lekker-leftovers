const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
  res.render('login', { 
    title: 'Login',
    error: null,
    formData: null
  });
});

router.post('/', async (req, res) => {
  const { username, password, account_type } = req.body;
  console.log("Form Data:", req.body);

  // —— Quick hack for LOK staff access ——
  if (username === 'lokstaff' && password === 'lokpassword') {
    // Grant supplier access and redirect to LOK dashboard
    req.session.user = {
      id: 1,
      username: 'lokstaff',
      account_type: 'supplier'
    };
    return req.session.save(err => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Session save error");
      }
      return res.redirect('/lok');
    });
  }
  // ———————————————————————————————



  try {
    await handleLogin({ username, password, account_type }, req, res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Unexpected server error.");
  }
});

module.exports = router;

async function handleLogin({ username, password, account_type }, req, res) {
  let query;

  if (account_type === "customer") {
    query = "SELECT customer_id AS id, password FROM customer_table WHERE username = ?";
  } else {
    query = "SELECT supplier_id AS id, password FROM supplier_table WHERE username = ?";
  }

  try {
    const [rows] = await db.promise().query(query, [username]);

    if (rows.length === 0) {
      return res.send(`No username for ${account_type} exists`);
    }

    const { id, password: hashedPassword } = rows[0];

    const isMatch = await bcrypt.compare(password, hashedPassword);

    if (isMatch) {
      console.log("User logged in");

      req.session.user = {
        id,
        username,
        account_type
      };
      console.log("Session user set:", req.session.user);
      req.session.save(err => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).send("Session save error");
        }
        return res.redirect(`/${account_type}_dashboard`);
      });

    } else {
      return res.send("Incorrect password.");
    }
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send("Database or hashing error.");
  }
}

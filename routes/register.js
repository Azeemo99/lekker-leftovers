const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Password validation rules
const passwordRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};

router.get('/', (req, res) => {
  res.render('register', {
    title: 'Register',
    errors: null,
    formData: null,
    passwordRules
  });
});

router.post('/', async (req, res) => {
  const { phoneNumber, fname, lname, password, username, account_type } = req.body;
  const formData = { phoneNumber, fname, lname, username, account_type };

  // Validate input
  const errors = validateInput({ phoneNumber, username, password, account_type });

  if (errors.length > 0) {
    return res.render('register', {
      title: 'Register',
      errors,
      formData,
      passwordRules
    });
  }

  try {
    const table = account_type === 'customer' ? 'customer_table' : 'supplier_table';
    await registerUser({ table, data: { phoneNumber, fname, lname, password, username } }, req, res);
  } catch (err) {
    console.error('Registration error:', err);
    res.render('register', {
      title: 'Register',
      errors: ['Registration failed. Please try again.'],
      formData,
      passwordRules
    });
  }
});

// Validation functions
function validateInput({ phoneNumber, username, password, account_type }) {
  const errors = [];

  if (!phoneNumber) errors.push('Phone number is required');
  if (!username) errors.push('Username is required');
  if (!account_type) errors.push('Account type is required');
  
  if (password) {
    const passwordErrors = validatePassword(password);
    errors.push(...passwordErrors);
  } else {
    errors.push('Password is required');
  }

  return errors;
}

function validatePassword(password) {
  const errors = [];

  if (password.length < passwordRules.minLength) {
    errors.push(`Password must be at least ${passwordRules.minLength} characters`);
  }
  if (passwordRules.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (passwordRules.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (passwordRules.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (passwordRules.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return errors;
}

// Registration handler
async function registerUser({ table, data }, req, res) {
  try {
    // Check for existing username
    const [usernameRows] = await db.promise().query(
      `SELECT COUNT(*) AS count FROM ${table} WHERE username = ?`,
      [data.username]
    );

    if (usernameRows[0].count > 0) {
      throw new Error('Username already exists');
    }

    // Check for existing phone number
    const [phoneRows] = await db.promise().query(
      `SELECT COUNT(*) AS count FROM ${table} WHERE phone_number = ?`,
      [data.phoneNumber]
    );

    if (phoneRows[0].count > 0) {
      throw new Error('Phone number already registered');
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    await db.promise().query(
      `INSERT INTO ${table} (phone_number, fname, lname, password, username) VALUES (?, ?, ?, ?, ?)`,
      [data.phoneNumber, data.fname, data.lname, hashedPassword, data.username]
    );

    // Get user ID and set session
    const idField = table === 'customer_table' ? 'customer_id' : 'supplier_id';
    const [userRows] = await db.promise().query(
      `SELECT ${idField} FROM ${table} WHERE username = ?`,
      [data.username]
    );

    req.session.user = {
      id: userRows[0][idField],
      username: data.username,
      account_type: table === 'customer_table' ? 'customer' : 'supplier'
    };

    req.session.save(err => {
      if (err) throw err;
      const dashboard = table === 'customer_table' ? '/customer_dashboard' : '/supplier_dashboard';
      res.redirect(dashboard);
    });

  } catch (err) {
    throw err;
  }
}

module.exports = router;
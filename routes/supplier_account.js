const express = require('express');
const router = express.Router();
const connection = require('../database');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

// Supplier Account Page
router.get('/', async (req, res) => {
    try {

        const supplierId = req.session.user.id;

        // Get supplier profile
        const [supplierRows] = await connection.promise().query(
            `SELECT 
                supplier_id, 
                fname, 
                lname, 
                username, 
                phone_number
             FROM supplier_table 
             WHERE supplier_id = ?`, 
            [supplierId]
        );

        if (supplierRows.length === 0) {
            return res.status(404).render('error', { 
                message: 'Supplier account not found' 
            });
        }

        // Get order history for supplier's products
        const [orderRows] = await connection.promise().query(
            `SELECT 
                o.order_id,
                o.status,
                o.order_quantity,
                DATE_FORMAT(o.status_update_time, '%Y-%m-%d %H:%i:%s') as order_date,
                p.product_id,
                p.name as product_name,
                CAST(p.price AS DECIMAL(10,2)) as price,
                c.customer_id,
                c.username as customer_username,
                c.fname as customer_fname,
                c.lname as customer_lname,
                (p.price * o.order_quantity) as total_price
             FROM order_table o
             JOIN product_table p ON o.product_id = p.product_id
             JOIN customer_table c ON o.customer_id = c.customer_id
             WHERE p.supplier_id = ?
             ORDER BY o.status_update_time DESC`,
            [supplierId]
        );

        // Process orders data
        const orders = orderRows.map(order => ({
            ...order,
            price: parseFloat(order.price) || 0,
            total_price: parseFloat(order.total_price) || 0,
            order_quantity: parseInt(order.order_quantity) || 1,
            order_date: order.order_date || 'Unknown date'
        }));

        res.render('supplier_account', {
            title: 'Supplier Account',
            supplier: supplierRows[0],
            orders,
            messages: req.session.messages || null,
            helpers: {
                formatDate: (dateString) => new Date(dateString).toLocaleString(),
                formatCurrency: (amount) => `£${parseFloat(amount).toFixed(2)}`
            }
        });
        
        delete req.session.messages;
    } catch (err) {
        console.error('Supplier account error:', {
            message: err.message,
            stack: err.stack,
            sql: err.sql
        });
        res.status(500).render('error', { 
            message: 'Error loading supplier account',
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }
});

// Update supplier account
router.post('/update', [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('currentPassword').if(body('newPassword').exists()).notEmpty(),
    body('newPassword').optional().isLength({ min: 6 })
], async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.session.messages = { error: errors.array()[0].msg };
            return res.redirect('/supplier_account');
        }

        const { username, currentPassword, newPassword } = req.body;
        const supplierId = req.session.user.id;

        // Password change logic
        if (newPassword) {
            const [[supplier]] = await connection.promise().query(
                `SELECT password FROM supplier_table WHERE supplier_id = ?`, 
                [supplierId]
            );
            
            const match = await bcrypt.compare(currentPassword, supplier.password);
            if (!match) {
                req.session.messages = { error: 'Current password is incorrect' };
                return res.redirect('/supplier_account');
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await connection.promise().query(
                `UPDATE supplier_table 
                 SET username = ?, password = ? 
                 WHERE supplier_id = ?`,
                [username, hashedPassword, supplierId]
            );
        } else {
            await connection.promise().query(
                `UPDATE supplier_table 
                 SET username = ? 
                 WHERE supplier_id = ?`,
                [username, supplierId]
            );
        }

        // Update session and redirect
        req.session.user.username = username;
        req.session.messages = { success: 'Account updated successfully' };
        res.redirect('/supplier_account');
    } catch (err) {
        console.error('Error updating supplier account:', err);
        req.session.messages = { error: 'Error updating account' };
        res.redirect('/supplier_account');
    }
});

module.exports = router;
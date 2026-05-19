const express = require('express');
const router = express.Router();
const connection = require('../database');

router.get('/', (req, res) => {

    const supplierId = req.session.user.id;

    // Daily summary query (today's data)
    const dailySummaryQuery = `
        SELECT 
            COUNT(o.order_id) AS total_orders,
            SUM(o.order_quantity) AS total_sold,
            COALESCE(SUM(o.order_quantity * p.price), 0) AS total_profit
        FROM order_table o
        JOIN product_table p ON o.product_id = p.product_id
        WHERE p.supplier_id = ?
        AND DATE(o.status_update_time) = CURDATE()
        AND o.status = 'completed'
    `;

    // Weekly summary query (current week's data)
    const weeklySummaryQuery = `
        SELECT 
            COUNT(o.order_id) AS total_orders,
            SUM(o.order_quantity) AS total_sold,
            COALESCE(SUM(o.order_quantity * p.price), 0) AS total_profit
        FROM order_table o
        JOIN product_table p ON o.product_id = p.product_id
        WHERE p.supplier_id = ?
        AND YEARWEEK(o.status_update_time, 1) = YEARWEEK(CURDATE(), 1)
        AND o.status = 'completed'
    `;

    // Product listings query
    const productListingsQuery = `
        SELECT 
            p.*, 
            COUNT(o.order_id) AS total_orders,
            SUM(CASE WHEN o.status = 'completed' THEN o.order_quantity ELSE 0 END) AS total_sold,
            COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.order_quantity * p.price ELSE 0 END), 0) AS total_profit
        FROM product_table p
        LEFT JOIN order_table o ON p.product_id = o.product_id
        WHERE p.supplier_id = ?
        GROUP BY p.product_id
    `;

    Promise.all([
        connection.promise().query(dailySummaryQuery, [supplierId]),
        connection.promise().query(weeklySummaryQuery, [supplierId]),
        connection.promise().query(productListingsQuery, [supplierId])
    ])
    .then(([dailyResults, weeklyResults, productResults]) => {
        // Process daily summary
        const dailySummary = {
            total_orders: Number(dailyResults[0][0]?.total_orders) || 0,
            total_sold: Number(dailyResults[0][0]?.total_sold) || 0,
            total_profit: Number(dailyResults[0][0]?.total_profit) || 0
        };

        // Process weekly summary
        const weeklySummary = {
            total_orders: Number(weeklyResults[0][0]?.total_orders) || 0,
            total_sold: Number(weeklyResults[0][0]?.total_sold) || 0,
            total_profit: Number(weeklyResults[0][0]?.total_profit) || 0
        };

        // Process products
        const products = productResults[0].map(product => ({
            ...product,
            total_orders: Number(product.total_orders) || 0,
            total_sold: Number(product.total_sold) || 0,
            total_profit: Number(product.total_profit) || 0,
            price: Number(product.price) || 0,
            product_quantity: Number(product.product_quantity) || 0
        }));

        res.render('supplier_listings', {
            title: 'My Listings',
            dailySummary,
            weeklySummary,
            products,
            user: req.session.user
        });
    })
    .catch(err => {
        console.error('Error fetching supplier listings:', err);
        res.status(500).render('error', {
            message: 'Error loading your product listings',
            error: err
        });
    });
});

module.exports = router;
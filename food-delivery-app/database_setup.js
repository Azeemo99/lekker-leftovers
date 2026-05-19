var mysql = require('mysql2');
const fs = require('fs');

// Setting up connection to database
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "admin",
    database: "synoptic_project"
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected Successfully!");

    // SQL to create the customer_table
    var customer_table = `
        CREATE TABLE IF NOT EXISTS customer_table (
            customer_id INT AUTO_INCREMENT PRIMARY KEY,
            fname VARCHAR(50) NOT NULL,
            lname VARCHAR(50) NOT NULL,
            phone_number VARCHAR(15) NOT NULL,
            password VARCHAR(255) NOT NULL, 
            username VARCHAR(50) UNIQUE
        )
    `;

    connection.query(customer_table, (err, results) => {
        if (err) {
            console.error('Error creating customer_table:', err.message);
        } else {
            console.log('customer_table created or already exists.');
        }
    });

    // Create supplier_table
    var supplier_table = `
        CREATE TABLE IF NOT EXISTS supplier_table (
            supplier_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            fname VARCHAR(50) NOT NULL,
            lname VARCHAR(50) NOT NULL,
            phone_number VARCHAR(15) NOT NULL,
            password VARCHAR(255) NOT NULL 
        )
    `;

    connection.query(supplier_table, (err, results) => {
        if (err) {
            console.error('Error creating supplier_table:', err.message);
        } else {
            console.log('supplier_table created or already exists.');
        }
    });

    // Create product_table with all columns including pickupTime
    var product_table = `
        CREATE TABLE IF NOT EXISTS product_table (
            product_id INT AUTO_INCREMENT PRIMARY KEY,
            supplier_id INT NOT NULL,
            name VARCHAR(50) NOT NULL,
            description VARCHAR(200),
            price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            product_quantity INT NOT NULL DEFAULT 0, 
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            pickupTime TIMESTAMP NULL,
            latitude DECIMAL(9,6),
            longitude DECIMAL(9,6),
            FOREIGN KEY (supplier_id) REFERENCES supplier_table(supplier_id) ON DELETE CASCADE
        )
    `;

    connection.query(product_table, (err, results) => {
        if (err) {
            console.error('Error creating product_table:', err.message);
        } else {
            console.log('product_table created or already exists.');
        }
    });

    // Create waste management table
    var waste_management = `
        CREATE TABLE IF NOT EXISTS waste_management (
            waste_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT NOT NULL,
            points_gained INT DEFAULT 0,
            waste_history VARCHAR(255),
            waste_type ENUM('plastic', 'paper', 'metal', 'glass', 'organic') NOT NULL,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customer_table(customer_id) ON DELETE CASCADE
        )
    `;

    connection.query(waste_management, (err, results) => {
        if (err) {
            console.error('Error creating waste_management:', err.message);
        } else {
            console.log('waste_management created or already exists.');
        }
    });

    var recycling_codes = `
    CREATE TABLE recycling_codes (
      code           VARCHAR(8)   NOT NULL PRIMARY KEY,
      material_name  VARCHAR(50)  NOT NULL,
      weight         FLOAT        NOT NULL,
      points_gained  FLOAT        NOT NULL,
      created_by     INT          NOT NULL,
      created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      redeemed_by    INT          NULL,
      redeemed_at    DATETIME     NULL,
      FOREIGN KEY (created_by)  REFERENCES supplier_table(supplier_id) ON DELETE CASCADE,
      FOREIGN KEY (redeemed_by) REFERENCES customer_table(customer_id) ON DELETE SET NULL,
      UNIQUE(code)
        )
    `;


    connection.query(recycling_codes, (err, results) => {
        if (err) {
            console.error('Error creating recycling_codes:', err.message);
        } else {
            console.log('recycling codes created or already exists.');
        }
    });


    // Create order_table
    var order_table = `
        CREATE TABLE IF NOT EXISTS order_table (
            order_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT NOT NULL,
            product_id INT NOT NULL,
            order_quantity INT NOT NULL DEFAULT 1,
            status ENUM('ordered', 'completed', 'cancelled') DEFAULT 'ordered',
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status_update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customer_table(customer_id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES product_table(product_id) ON DELETE CASCADE
        )
    `;

    connection.query(order_table, (err, results) => {
        if (err) {
            console.error('Error creating order_table:', err.message);
        } else {
            console.log('order_table created or already exists.');
        }
    });

    console.log('All tables created successfully!');
    connection.end();
});

module.exports = connection;
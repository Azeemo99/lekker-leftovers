const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
    res.render('addlisting', { 
        title: 'Add Listing',
        error: null,
        formData: null
    });
});

router.post('/', (req, res) => {
    const uploadDate = new Date();
    console.log("Adding listing");
    
    const supplier_id = req.session.user?.id;
    if (!supplier_id) {
        return res.status(401).send("Unauthorized");
    }

    const { name, desc, price, quantity, pickUp, latitude, longitude} = req.body;

    
    const pickupDate = new Date(pickUp);

    
    const sameDay = 
        pickupDate.getFullYear() === uploadDate.getFullYear() &&
        pickupDate.getMonth() === uploadDate.getMonth() &&
        pickupDate.getDate() === uploadDate.getDate();

    if (!sameDay) {
        return res.status(400).send("Pickup time must be on the same day as the upload date.");
    }

    
    if (pickupDate <= uploadDate) {
        return res.status(400).send("Pickup time must be later than the current time.");
    }

    var query = "INSERT INTO product_table (supplier_id, name, description, price, product_quantity, upload_date, pickupTime, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    db.query(query, [supplier_id, name, desc, price, quantity, uploadDate, pickupDate, latitude, longitude], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error adding listing");
        }

        res.redirect("supplier_listings");
    });
});

module.exports = router;

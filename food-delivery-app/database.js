var mysql = require('mysql2');

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password1234",
    database: "synoptic_project"
});
console.log("hello");

connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected Successfully!");
});
module.exports = connection;
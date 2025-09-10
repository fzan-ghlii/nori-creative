// Mengimpor package mysql2
const mysql = require('mysql2');

// Memuat variabel lingkungan dari file .env
require('dotenv').config();

// Membuat 'connection pool' ke database.
// Connection pool lebih efisien daripada membuat koneksi baru setiap kali ada query.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Menggunakan .promise() agar kita bisa menggunakan async/await yang lebih modern
// daripada callback-based.
module.exports = pool.promise();

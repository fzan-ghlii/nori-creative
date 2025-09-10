// config/mailer.js
const nodemailer = require('nodemailer');

// Konfigurasi transporter menggunakan kredensial dari file .env
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true untuk port 465, false untuk port lain
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

module.exports = transporter;

// config/midtrans.js
const midtransClient = require('midtrans-client');

// Buat instance Snap API
const snap = new midtransClient.Snap({
    isProduction: false, // Ganti ke `true` saat sudah live
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

module.exports = snap;

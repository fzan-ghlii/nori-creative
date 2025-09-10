// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Ganti nama rute agar lebih sesuai
router.post('/create-transaction', paymentController.createTransaction);

// Rute BARU untuk notifikasi dari Midtrans
router.post('/midtrans-notification', paymentController.handleMidtransNotification);

module.exports = router;

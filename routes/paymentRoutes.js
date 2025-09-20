// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { isUserAuth } = require('../middlewares/authMiddleware');

// Ganti nama rute agar lebih sesuai
router.post('/create-transaction', paymentController.createTransaction);

// Rute BARU untuk notifikasi dari Midtrans
router.post('/midtrans-notification', paymentController.handleMidtransNotification);

// ======================= RUTE BARU UNTUK MELANJUTKAN PEMBAYARAN =======================
// Rute ini diproteksi, hanya user yang login yang bisa mengakses
router.post('/resume-transaction', isUserAuth, paymentController.resumeTransaction);
// ====================================================================================

module.exports = router;

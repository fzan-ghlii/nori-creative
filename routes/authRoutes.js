// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isUserAuth } = require('../middlewares/authMiddleware'); // Impor middleware baru


// Rute untuk memproses data register
router.post('/register', authController.handleRegister);

// Rute untuk memproses data login
router.post('/login', authController.handleLogin);

// Rute untuk logout
router.get('/logout', authController.handleLogout);

// RUTE BARU UNTUK HALAMAN PROFIL (DIPROTEKSI)
router.get('/profile', isUserAuth, authController.showProfilePage);

module.exports = router;

// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rute untuk menampilkan halaman register
router.get('/register', authController.showRegisterPage);

// Rute untuk memproses data register
router.post('/register', authController.handleRegister);

// Rute untuk menampilkan halaman login
router.get('/login', authController.showLoginPage);

// Rute untuk memproses data login
router.post('/login', authController.handleLogin);

// Rute untuk logout
router.get('/logout', authController.handleLogout);

module.exports = router;

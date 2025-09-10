// routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// API Endpoint untuk mengambil semua produk
// Akan diakses melalui GET /api/products
router.get('/products', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products ORDER BY id ASC');
        res.json(products); // Kirim data produk sebagai JSON
    } catch (error) {
        console.error('Error saat mengambil data produk untuk API:', error);
        res.status(500).json({ message: 'Gagal mengambil data produk.' });
    }
});

module.exports = router;

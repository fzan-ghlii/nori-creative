// controllers/authController.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Fungsi showRegisterPage dan showLoginPage sudah tidak diperlukan lagi

exports.handleRegister = async (req, res) => {
    const { name, email, password, confirm_password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Semua field wajib diisi.' });
    }
    if (password !== confirm_password) {
        return res.status(400).json({ success: false, error: 'Password dan konfirmasi password tidak cocok.' });
    }

    try {
        const [users] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ success: false, error: 'Email sudah terdaftar.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        
        res.status(201).json({ success: true, message: 'Pendaftaran berhasil! Silakan login.' });
    } catch (error) {
        console.error('Error saat registrasi:', error);
        res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server.' });
    }
};

exports.handleLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email dan password wajib diisi.' });
    }
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, error: 'Email atau password salah.' });
        }
        
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Email atau password salah.' });
        }
        
        req.session.user = { id: user.id, name: user.name, email: user.email };
        req.session.isLoggedIn = true;

        res.status(200).json({ success: true, message: 'Login berhasil!' });
    } catch (error) {
        console.error('Error saat login:', error);
        res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server.' });
    }
};

exports.handleLogout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Gagal logout:', err);
        }
        res.redirect('/');
    });
};

exports.showProfilePage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // 1. Ambil data pesanan utama pengguna
        const [orders] = await db.query(
            `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );

        // 2. Ambil semua item dari semua pesanan pengguna
        const [allItems] = await db.query(
            `SELECT oi.* FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = ?`,
            [userId]
        );

        // 3. Gabungkan item ke dalam pesanan yang sesuai
        const ordersWithItems = orders.map(order => {
            return {
                ...order,
                items: allItems.filter(item => item.order_id === order.id)
            };
        });

        res.render('profile', {
            // 'user' sudah tersedia secara global dari middleware di server.js
            orders: ordersWithItems
        });

    } catch (error) {
        console.error('Error saat mengambil data profil:', error);
        res.redirect('/');
    }
};
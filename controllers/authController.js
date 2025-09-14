// controllers/authController.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Menampilkan halaman Register
exports.showRegisterPage = (req, res) => {
    res.render('register', { error: null, success: null });
};

// Menangani data pendaftaran baru
exports.handleRegister = async (req, res) => {
    const { name, email, password, confirm_password } = req.body;

    if (password !== confirm_password) {
        return res.render('register', { error: 'Password dan konfirmasi password tidak cocok.', success: null });
    }

    try {
        const [users] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.render('register', { error: 'Email sudah terdaftar. Silakan gunakan email lain.', success: null });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        
        // Alihkan ke halaman login dengan pesan sukses
        res.render('login', { error: null, success: 'Pendaftaran berhasil! Silakan login.' });

    } catch (error) {
        console.error('Error saat registrasi:', error);
        res.render('register', { error: 'Terjadi kesalahan pada server. Coba lagi nanti.', success: null });
    }
};

// Menampilkan halaman Login
exports.showLoginPage = (req, res) => {
    res.render('login', { error: null, success: null });
};

// Menangani data login
exports.handleLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.render('login', { error: 'Email atau password salah.', success: null });
        }
        
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render('login', { error: 'Email atau password salah.', success: null });
        }
        
        // Simpan info pengguna di session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        req.session.isLoggedIn = true;

        res.redirect('/'); // Alihkan ke halaman utama setelah berhasil login

    } catch (error) {
        console.error('Error saat login:', error);
        res.render('login', { error: 'Terjadi kesalahan pada server.', success: null });
    }
};

// Menangani logout
exports.handleLogout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Gagal logout:', err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
};
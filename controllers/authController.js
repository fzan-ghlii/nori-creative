// controllers/authController.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Modul bawaan Node.js untuk token
const transporter = require('../config/mailer'); // Pastikan mailer diimpor

// ======================= FUNGSI REGISTER (DIROMBAK TOTAL) =======================
exports.handleRegister = async (req, res) => {
    const { name, email, password, confirm_password } = req.body;

    if (!name || !email || !password) return res.status(400).json({ success: false, error: 'Semua field wajib diisi.' });
    if (password !== confirm_password) return res.status(400).json({ success: false, error: 'Password tidak cocok.' });

    try {
        const [users] = await db.query('SELECT email FROM users WHERE email = ? AND is_active = true', [email]);
        if (users.length > 0) return res.status(400).json({ success: false, error: 'Email sudah terdaftar dan aktif.' });

        // Hapus akun tidak aktif yang lama jika ada yang mendaftar ulang
        await db.query('DELETE FROM users WHERE email = ? AND is_active = false', [email]);

        const hashedPassword = await bcrypt.hash(password, 12);
        
        // 1. Buat token aktivasi
        const activationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(activationToken).digest('hex');
        
        // 2. Tentukan waktu kedaluwarsa (misal: 1 jam dari sekarang)
        const activationExpires = new Date(Date.now() + 3600000); // 1 jam

        // 3. Simpan user dengan status tidak aktif beserta tokennya
        await db.query(
            'INSERT INTO users (name, email, password, is_active, activation_token, activation_expires) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, false, hashedToken, activationExpires]
        );
        
        // 4. Kirim email aktivasi
        const activationUrl = `${process.env.BASE_URL}/activate/${activationToken}`;
        const mailOptions = {
            from: `"NORI Digital" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Aktivasi Akun NORI Anda',
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h2>Selamat Datang di NORI!</h2>
                    <p>Terima kasih telah mendaftar. Silakan klik tombol di bawah ini untuk mengaktifkan akun Anda:</p>
                    <a href="${activationUrl}" style="background-color: #06b6d4; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Aktifkan Akun</a>
                    <p style="margin-top: 20px;">Link ini akan kedaluwarsa dalam 1 jam.</p>
                    <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        
        res.status(201).json({ success: true, message: 'Pendaftaran berhasil! Silakan cek email Anda untuk link aktivasi.' });
    } catch (error) {
        console.error('Error saat registrasi:', error);
        res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server.' });
    }
};

// ======================= FUNGSI LOGIN (DIPERBARUI) =======================
exports.handleLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email dan password wajib diisi.' });
    
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ success: false, error: 'Email atau password salah.' });
        
        const user = users[0];

        // ========== PERUBAHAN PENTING DI SINI ==========
        if (!user.is_active) {
            return res.status(401).json({ success: false, error: 'Akun Anda belum diaktivasi. Silakan cek email Anda.' });
        }
        // ===============================================

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, error: 'Email atau password salah.' });
        
        req.session.user = { id: user.id, name: user.name, email: user.email };
        req.session.isLoggedIn = true;

        res.status(200).json({ success: true, message: 'Login berhasil!' });
    } catch (error) {
        console.error('Error saat login:', error);
        res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server.' });
    }
};

// ======================= FUNGSI BARU: AKTIVASI AKUN =======================
exports.handleActivation = async (req, res) => {
    try {
        const { token } = req.params;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Cari user berdasarkan token yang belum kedaluwarsa
        const [users] = await db.query(
            'SELECT * FROM users WHERE activation_token = ? AND activation_expires > NOW()',
            [hashedToken]
        );

        if (users.length === 0) {
            // Token tidak valid atau sudah kedaluwarsa
            return res.render('activation-status', {
                success: false,
                message: 'Link aktivasi tidak valid atau telah kedaluwarsa. Silakan coba mendaftar ulang.'
            });
        }

        const user = users[0];
        
        // Aktifkan user dan hapus tokennya untuk keamanan
        await db.query(
            'UPDATE users SET is_active = true, activation_token = NULL, activation_expires = NULL WHERE id = ?',
            [user.id]
        );

        res.render('activation-status', {
            success: true,
            message: 'Akun Anda telah berhasil diaktivasi! Anda sekarang dapat login.'
        });

    } catch (error) {
        console.error('Error saat aktivasi akun:', error);
        res.render('activation-status', {
            success: false,
            message: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.'
        });
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

// ======================= FUNGSI HALAMAN PROFIL DENGAN DETAIL ITEM =======================
exports.showProfilePage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // 1. Ambil data pesanan utama pengguna
        const [orders] = await db.query(
            `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );

        if (orders.length > 0) {
            // 2. Ambil semua item dari semua pesanan pengguna dalam satu query
            const orderIds = orders.map(o => o.id);
            const [allItems] = await db.query(
                `SELECT * FROM order_items WHERE order_id IN (?)`,
                [orderIds]
            );

            // 3. Gabungkan item ke dalam pesanan yang sesuai (lebih efisien)
            orders.forEach(order => {
                order.items = allItems.filter(item => item.order_id === order.id);
            });
        }

        res.render('profile', {
            // 'user' sudah tersedia secara global dari middleware di server.js
            orders: orders // Sekarang setiap 'order' punya properti 'items'
        });

    } catch (error) {
        console.error('Error saat mengambil data profil:', error);
        res.redirect('/');
    }
};
// =====================================================================================
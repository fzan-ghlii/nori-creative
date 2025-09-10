// This script is for one-time use to create the first admin user.
const bcrypt = require('bcryptjs');
const db = require('../config/database');
require('dotenv').config({ path: '../.env' });

// --- KONFIGURASI ADMIN ANDA DI SINI ---
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'norisama777'; // Ganti dengan password yang kuat
// -----------------------------------------

async function createAdmin() {
    console.log('Memulai proses pembuatan admin...');
    try {
        // Cek apakah admin sudah ada
        const [existingAdmins] = await db.query('SELECT * FROM admins WHERE username = ?', [ADMIN_USERNAME]);
        if (existingAdmins.length > 0) {
            console.log('⚠️  Admin dengan username ini sudah ada. Proses dibatalkan.');
            return;
        }

        // Hash password dengan bcrypt
        console.log('Melakukan hashing password...');
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12); // Angka 12 adalah salt rounds

        // Simpan admin baru ke database
        await db.query('INSERT INTO admins (username, password) VALUES (?, ?)', [ADMIN_USERNAME, hashedPassword]);

        console.log('✅ Admin berhasil dibuat!');
        console.log(`   Username: ${ADMIN_USERNAME}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
    } catch (error) {
        console.error('❌ Gagal membuat admin:', error);
    } finally {
        // Tutup koneksi database
        await db.end();
        console.log('Koneksi database ditutup.');
    }
}

createAdmin();

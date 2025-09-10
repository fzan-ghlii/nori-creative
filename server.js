// server.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');
const db = require('./config/database');
const { maintenanceCheck } = require('./middlewares/maintenanceMiddleware');
const cleanupScheduler = require('./services/cleanupScheduler'); // <-- 1. Impor penjadwal baru
const helmet = require('helmet');
const oneDay = 1000 * 60 * 60 * 24;

// Rute-rute
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const apiRoutes = require('./routes/apiRoutes'); // <-- 1. Impor rute API baru

// Middleware
const { trackVisit } = require('./middlewares/trackingMiddleware');

dotenv.config();
const app = express();

// Middleware untuk parsing body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(maintenanceCheck);
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                // Izinkan skrip dari sumber yang kita percaya
                'script-src': [
                    "'self'",
                    "'unsafe-inline'",
                    'https://cdn.tailwindcss.com',
                    'https://app.sandbox.midtrans.com',
                    'https://cdn.jsdelivr.net',
                    'https://cdnjs.cloudflare.com',
                ],
                // Izinkan koneksi ke Midtrans
                'connect-src': ["'self'", 'https://cdn.jsdelivr.net', 'https://app.sandbox.midtrans.com'],
                // Izinkan iframe Midtrans
                'frame-src': ["'self'", 'https://app.sandbox.midtrans.com'],
                // Izinkan gaya dari sumber yang kita percaya
                'style-src': [
                    "'self'",
                    'https://fonts.googleapis.com',
                    'https://cdnjs.cloudflare.com',
                    "'unsafe-inline'",
                ],
                'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
                'img-src': ["'self'", 'data:', 'https://placehold.co', 'http://localhost:3000'],

                // ======================= PERBAIKAN UTAMA DI SINI =======================
                // Secara eksplisit izinkan inline event handler seperti onclick="..."
                'script-src-attr': ["'self'", "'unsafe-inline'"],
                // =====================================================================
            },
        },
    })
);

// Konfigurasi session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Sajikan file statis dari folder public
app.use(express.static(path.join(__dirname, 'public'), { maxAge: oneDay }));

// ======================= 4. GANTI URL ADMIN & TERAPKAN PEMBATAS =======================
// URL baru yang tidak mudah ditebak. Anda bisa menggantinya sesuka hati.
const secretAdminPath = '/nori-secret-panel';
app.use(secretAdminPath, adminRoutes); // Terapkan pembatas HANYA untuk rute admin
// ====================================================================================

// Gunakan Rute (sesuai dengan yang Anda gunakan, misal '/payment')
app.use('/payment', paymentRoutes);
app.use('/api', apiRoutes); // <-- 2. Gunakan rute API dengan prefix /api

// Rute untuk Halaman Utama (Homepage)
app.get('/', trackVisit, async (req, res) => {
    try {
        const [notifications] = await db.query('SELECT * FROM notifications ORDER BY created_at DESC');
        const [products] = await db.query('SELECT * FROM products ORDER BY id ASC');
        const [testimonials] = await db.query('SELECT * FROM testimonials ORDER BY created_at DESC');

        // ======================= PERUBAHAN UTAMA DI SINI =======================
        // Definisikan peta ikon untuk dikirim ke template
        const iconMap = {
            update: { color: 'cyan', class: 'fas fa-rocket' },
            event: { color: 'green', class: 'fas fa-calendar-alt' },
            maintenance: { color: 'yellow', class: 'fas fa-exclamation-triangle' },
            promo: { color: 'pink', class: 'fas fa-tags' },
        };

        res.render('index', {
            notifications: notifications || [],
            products: products || [],
            testimonials: testimonials || [],
            iconMap: iconMap, // <-- Kirim iconMap ke template
        });
        // =====================================================================
    } catch (error) {
        console.error('Error saat memuat halaman utama:', error);
        res.render('index', { notifications: [], products: [], iconMap: {} }); // Kirim objek kosong jika error
    }
});

// Rute untuk halaman sukses dan gagal pembayaran
app.get('/payment-success', (req, res) => {
    res.send(
        '<h1>Pembayaran Berhasil!</h1><p>Terima kasih telah melakukan pembayaran.</p><a href="/">Kembali ke Home</a>'
    );
});

app.get('/payment-failure', (req, res) => {
    res.send('<h1>Pembayaran Gagal</h1><p>Silakan coba lagi atau hubungi support.</p><a href="/">Kembali ke Home</a>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    try {
        await db.query('SELECT 1');
        console.log('✅ Koneksi ke database berhasil!');
    } catch (error) {
        console.error('❌ Gagal terkoneksi ke database:', error.message);
        process.exit(1);
    }
    console.log(`🚀 Server berhasil berjalan di http://localhost:${PORT}`);
    console.log('Tekan Ctrl+C untuk menghentikan server.');
    cleanupScheduler.start();
});

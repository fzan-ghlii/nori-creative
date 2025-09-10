const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuth } = require('../middlewares/authMiddleware'); // Middleware untuk proteksi
const rateLimit = require('express-rate-limit');

// ======================= BUAT PEMBATAS DI SINI =======================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 10, // Batasi setiap IP hingga 10 percobaan login per jendela waktu
    message: 'Terlalu banyak percobaan login dari IP ini, silakan coba lagi setelah 15 menit.',
    standardHeaders: true,
    legacyHeaders: false,
});
// =====================================================================

// Rute untuk menampilkan halaman login
// URL: GET /admin/login
router.get('/login', adminController.getLoginPage);

// Rute untuk memproses data login
// URL: POST /admin/login
router.post('/login', loginLimiter, adminController.postLogin);

// Rute untuk halaman dashboard (DIPROTEKSI)
// Hanya bisa diakses jika sudah login
// URL: GET /admin/dashboard
router.get('/dashboard', isAuth, adminController.getDashboard);

// Rute untuk logout
// URL: GET /admin/logout
router.get('/logout', adminController.logout);

// --- RUTE BARU UNTUK NOTIFIKASI (DIPROTEKSI) ---

// Menampilkan halaman manajemen notifikasi
router.get('/notifications', isAuth, adminController.getNotificationsPage);

// Menambah notifikasi baru
router.post('/notifications/add', isAuth, adminController.addNotification);

// Menghapus notifikasi
router.post('/notifications/delete/:id', isAuth, adminController.deleteNotification);
router.get('/notifications/edit/:id', isAuth, adminController.showEditNotificationForm);
router.post('/notifications/edit/:id', isAuth, adminController.updateNotification);

// Menampilkan halaman manajemen produk
router.get('/products', isAuth, adminController.getProductsPage);

// Menambah produk baru
router.post('/products/add', isAuth, adminController.addProduct);

// Menghapus produk
router.post('/products/delete/:id', isAuth, adminController.deleteProduct);

router.get('/products/edit/:id', isAuth, adminController.showEditProductForm);
router.post('/products/edit/:id', isAuth, adminController.updateProduct);

router.get('/analytics', isAuth, adminController.getAnalytics);

// --- RUTE BARU UNTUK MANAJEMEN ULASAN ---
router.get('/testimonials', isAuth, adminController.showTestimonials);
router.post('/testimonials/add', isAuth, adminController.addTestimonial);
router.get('/testimonials/edit/:id', isAuth, adminController.showEditTestimonialForm);
router.post('/testimonials/edit/:id', isAuth, adminController.updateTestimonial);
router.post('/testimonials/delete/:id', isAuth, adminController.deleteTestimonial);

router.get('/orders', isAuth, adminController.showOrders);
router.get('/orders/:id', isAuth, adminController.showOrderDetail);
router.post('/orders/update-status/:id', isAuth, adminController.updateOrderStatus);

router.get('/maintenance', isAuth, adminController.showMaintenancePage);
router.post('/maintenance', isAuth, adminController.updateMaintenanceSettings);

router.get('/chart-data', isAuth, adminController.getChartData);

module.exports = router;

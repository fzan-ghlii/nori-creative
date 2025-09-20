// Middleware ini berfungsi sebagai "penjaga gerbang"

exports.isAuth = (req, res, next) => {
    // Cek apakah ada session adminId (tanda sudah login)
    if (req.session.adminId) {
        // Jika ada, izinkan lanjut ke halaman berikutnya
        next();
    } else {
        // Jika tidak ada, tendang kembali ke halaman login
        req.session.errorMessage = 'Anda harus login terlebih dahulu.';
        res.redirect('/nori-secret-panel/login');
    }
};

// --- MIDDLEWARE BARU UNTUK PENGGUNA BIASA ---
exports.isUserAuth = (req, res, next) => {
    if (req.session.isLoggedIn && req.session.user) {
        next(); // Jika sudah login, izinkan lanjut
    } else {
        res.redirect('/login'); // Jika belum, tendang ke halaman login
    }
};

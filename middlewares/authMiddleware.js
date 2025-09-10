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

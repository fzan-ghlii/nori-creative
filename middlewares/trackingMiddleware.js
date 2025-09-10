// middlewares/trackingMiddleware.js
const db = require('../config/database');

const trackVisit = async (req, res, next) => {
    try {
        const pageUrl = req.originalUrl;
        // Kondisi ini memastikan hanya kunjungan ke halaman utama yang dicatat
        if (pageUrl === '/') {
            const query = 'INSERT INTO visits (page_url) VALUES (?)';
            await db.query(query, [pageUrl]);
        }
    } catch (error) {
        // Jika ada error, jangan hentikan proses, cukup log di server
        console.error('[TRACKING] Gagal melacak kunjungan:', error);
    }
    // Lanjutkan ke request selanjutnya (yaitu merender halaman)
    next();
};

module.exports = { trackVisit };

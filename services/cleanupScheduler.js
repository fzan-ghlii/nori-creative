// services/cleanupScheduler.js
const cron = require('node-cron');
const db = require('../config/database');

// Fungsi untuk menghapus pesanan yang pending dan sudah lama
const cleanupPendingOrders = async () => {
    try {
        console.log(`[Scheduler] Menjalankan tugas pembersihan pesanan pending...`);

        // Query untuk menghapus pesanan yang statusnya PENDING dan dibuat lebih dari 5 menit yang lalu.
        // PENTING: Pastikan kolom 'created_at' di tabel 'orders' Anda adalah tipe TIMESTAMP atau DATETIME.
        const query = `
            DELETE FROM orders 
            WHERE status = 'PENDING' 
            AND created_at < NOW() - INTERVAL 5 MINUTE;
        `;

        const [result] = await db.query(query);

        if (result.affectedRows > 0) {
            console.log(`[Scheduler] Berhasil membersihkan ${result.affectedRows} pesanan yang terbengkalai.`);
        } else {
            console.log(`[Scheduler] Tidak ada pesanan terbengkalai yang perlu dibersihkan.`);
        }
    } catch (error) {
        console.error('[Scheduler] Terjadi error saat membersihkan pesanan:', error);
    }
};

// Fungsi untuk memulai penjadwal
const start = () => {
    // Jadwalkan tugas untuk berjalan setiap 5 menit.
    // Format: '(menit) (jam) (hari dalam sebulan) (bulan) (hari dalam seminggu)'
    // '*/5 * * * *' artinya "jalankan setiap 5 menit".
    cron.schedule('*/5 * * * *', cleanupPendingOrders);

    console.log('✅ Penjadwal pembersihan pesanan otomatis telah dimulai. Akan berjalan setiap 5 menit.');
};

module.exports = { start };

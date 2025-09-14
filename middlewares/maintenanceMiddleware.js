// middlewares/maintenanceMiddleware.js
const db = require('../config/database');
const path = require('path'); // Impor module 'path'

// ... (fungsi getSettings tetap sama) ...
let settingsCache = null;
let lastCacheTime = 0;

const getSettings = async () => {
    if (!settingsCache || Date.now() - lastCacheTime > 5000) {
        const [settingsRows] = await db.query('SELECT * FROM site_settings');
        settingsCache = settingsRows.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
        }, {});
        lastCacheTime = Date.now();
    }
    return settingsCache;
};

// URL rahasia admin, harus sama dengan yang ada di server.js
const secretAdminPath = '/nori-secret-panel';

const maintenanceCheck = async (req, res, next) => {
    try {
        // ======================= PERBAIKAN UTAMA DI SINI =======================
        // Selalu izinkan akses jika URL adalah untuk panel admin atau CSS-nya
        if (req.originalUrl.startsWith(secretAdminPath) || req.originalUrl.startsWith('/admin-style.css')) {
            return next(); // Langsung izinkan lewat, jangan periksa status maintenance
        }
        // =====================================================================

        const settings = await getSettings();
        let isMaintenance = false;

        // Cek mode manual
        if (settings.maintenance_mode === 'on') {
            isMaintenance = true;
        }

        // Cek mode terjadwal
        if (settings.maintenance_schedule_enabled === '1' && settings.maintenance_start_time && settings.maintenance_end_time) {
            const now = new Date();
            const startTime = new Date(settings.maintenance_start_time);
            const endTime = new Date(settings.maintenance_end_time);
            if (now >= startTime && now <= endTime) {
                isMaintenance = true;
            }
        }

        if (isMaintenance) {
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            return res.status(503).render('maintenance', { message: settings.maintenance_message });
        }

        return next();

    } catch (error) {
        console.error('Error di middleware maintenance:', error);
        // Fallback: balikin HTML, bukan text/plain
        return res
            .status(500)
            .send(
                '<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Terjadi Kesalahan Server</h1><p>Silakan coba lagi nanti.</p></body></html>'
            );
    }
};

module.exports = { maintenanceCheck };

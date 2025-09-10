const bcrypt = require('bcryptjs');
const db = require('../config/database');
const transporter = require('../config/mailer'); // Impor transporter email
const adminUrl = '/nori-secret-panel';

// Menampilkan halaman login
exports.getLoginPage = (req, res) => {
    // Mengirim pesan error jika ada (dari proses login gagal)
    const errorMessage = req.session.errorMessage;
    delete req.session.errorMessage; // Hapus pesan setelah ditampilkan
    res.render('admin/login', { errorMessage });
};

// Memproses data login
exports.postLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Cari admin berdasarkan username
        const [admins] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);

        // Jika admin tidak ditemukan
        if (admins.length === 0) {
            req.session.errorMessage = 'Username atau password salah!';
            return res.redirect(`${adminUrl}/login`);
        }

        const admin = admins[0];

        // 2. Bandingkan password yang diinput dengan yang ada di database
        const isMatch = await bcrypt.compare(password, admin.password);

        // Jika password cocok
        if (isMatch) {
            // Simpan ID admin ke dalam session
            req.session.adminId = admin.id;
            req.session.adminUsername = admin.username;
            // Arahkan ke dashboard
            return res.redirect(`${adminUrl}/dashboard`);
        } else {
            // Jika password salah
            req.session.errorMessage = 'Username atau password salah!';
            return res.redirect(`${adminUrl}/login`);
        }
    } catch (error) {
        console.error(error);
        req.session.errorMessage = 'Terjadi kesalahan pada server.';
        res.redirect(`${adminUrl}/login`);
    }
};

// Menampilkan halaman dashboard
exports.getDashboard = (req, res) => {
    res.render('admin/dashboard', {
        username: req.session.adminUsername,
        pageTitle: 'Dashboard',
        path: '/admin/dashboard',
    });
};

// Proses Logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect(`${adminUrl}/login`);
    });
};

// --- FUNGSI BARU UNTUK MANAJEMEN NOTIFIKASI ---

// Menampilkan halaman manajemen notifikasi
exports.getNotificationsPage = async (req, res) => {
    try {
        const [notifications] = await db.query('SELECT * FROM notifications ORDER BY created_at DESC');
        res.render('admin/notifications', {
            notifications: notifications,
            editingNotification: null,
            pageTitle: 'Manajemen Notifikasi',
            path: '/admin/notifications',
        });
    } catch (error) {
        console.error(error);
        // Handle error, mungkin render halaman error
        res.status(500).send('Terjadi kesalahan pada server');
    }
};

// Menambah notifikasi baru
exports.addNotification = async (req, res) => {
    try {
        const { title, content, type } = req.body;
        await db.query('INSERT INTO notifications (title, content, type) VALUES (?, ?, ?)', [title, content, type]);
        res.redirect(`${adminUrl}/notifications`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Gagal menambahkan notifikasi');
    }
};

// Menghapus notifikasi
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM notifications WHERE id = ?', [id]);
        res.redirect(`${adminUrl}/notifications`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Gagal menghapus notifikasi');
    }
};

exports.showEditNotificationForm = async (req, res) => {
    try {
        const { id } = req.params;
        const [notifications] = await db.query('SELECT * FROM notifications ORDER BY created_at DESC');
        const [editingData] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
        if (editingData.length > 0) {
            res.render('admin/notifications', { notifications, editingNotification: editingData[0] });
        } else {
            res.redirect(`${adminUrl}/notifications`);
        }
    } catch (error) {
        console.error(error);
        res.redirect(`${adminUrl}/notifications`);
    }
};
exports.updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, type } = req.body;
        await db.query('UPDATE notifications SET title = ?, content = ?, type = ? WHERE id = ?', [
            title,
            content,
            type,
            id,
        ]);
        res.redirect(`${adminUrl}/notifications`);
    } catch (error) {
        console.error(error);
        res.redirect(`${adminUrl}/notifications`);
    }
};

// --- FUNGSI BARU UNTUK MANAJEMEN PRODUK ---

// Menampilkan halaman manajemen produk
exports.getProductsPage = async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products ORDER BY id ASC');
        res.render('admin/products', {
            products: products,
            editingProduct: null,
            pageTitle: 'Manajemen Produk',
            path: '/admin/products',
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Terjadi kesalahan pada server');
    }
};

// --- FUNGSI MANAJEMEN PRODUK DIPERBARUI ---
exports.addProduct = async (req, res) => {
    try {
        const { name, description, price, discount_percent, icon_class } = req.body;
        const is_popular = req.body.is_popular ? 1 : 0;
        await db.query(
            'INSERT INTO products (name, description, price, discount_percent, icon_class, is_popular) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, price, discount_percent || 0, icon_class, is_popular]
        );
        res.redirect(`${adminUrl}/products`);
    } catch (error) {
        console.error(error);
        res.redirect(`${adminUrl}/products`);
    }
};

// Menghapus produk
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM products WHERE id = ?', [id]);
        res.redirect(`${adminUrl}/products`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Gagal menghapus produk');
    }
};

exports.showEditProductForm = async (req, res) => {
    try {
        const { id } = req.params;
        const [products] = await db.query('SELECT * FROM products ORDER BY id DESC');
        const [editingData] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        if (editingData.length > 0) {
            res.render('admin/products', { products, editingProduct: editingData[0] });
        } else {
            res.redirect(`${adminUrl}/products`);
        }
    } catch (error) {
        console.error(error);
        res.redirect(`${adminUrl}/products`);
    }
};
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, discount_percent, icon_class } = req.body;
        const is_popular = req.body.is_popular ? 1 : 0;
        await db.query(
            'UPDATE products SET name = ?, description = ?, price = ?, discount_percent = ?, icon_class = ?, is_popular = ? WHERE id = ?',
            [name, description, price, discount_percent || 0, icon_class, is_popular, id]
        );
        res.redirect(`${adminUrl}/products`);
    } catch (error) {
        console.error(error);
        res.redirect(`${adminUrl}/products`);
    }
};

// Fungsi BARU untuk mengambil data analitik
exports.getAnalytics = async (req, res) => {
    try {
        // 1. Ambil Total Pengunjung
        const [visitsResult] = await db.query('SELECT COUNT(*) AS totalVisits FROM visits');

        // 2. Ambil Total Pesanan
        const [ordersResult] = await db.query('SELECT COUNT(*) AS totalOrders FROM orders');

        // 3. Ambil Pesanan Sukses
        const [successfulOrdersResult] = await db.query(
            "SELECT COUNT(*) AS successfulOrders FROM orders WHERE status = 'SUCCESS'"
        );

        // 4. Ambil Total Pendapatan dari Pesanan Sukses
        const [revenueResult] = await db.query(
            "SELECT SUM(total_amount) AS totalRevenue FROM orders WHERE status = 'SUCCESS'"
        );

        const analytics = {
            totalVisits: visitsResult[0].totalVisits || 0,
            totalOrders: ordersResult[0].totalOrders || 0,
            successfulOrders: successfulOrdersResult[0].successfulOrders || 0,
            totalRevenue: revenueResult[0].totalRevenue || 0,
        };

        res.json(analytics);
    } catch (error) {
        console.error('Error saat mengambil data analitik:', error);
        res.status(500).json({ message: 'Gagal mengambil data analitik' });
    }
};

// --- FUNGSI BARU UNTUK MANAJEMEN ULASAN ---
exports.showTestimonials = async (req, res) => {
    try {
        const [testimonials] = await db.query('SELECT * FROM testimonials ORDER BY created_at DESC');
        res.render('admin/testimonials', { testimonials, editingTestimonial: null });
    } catch (error) {
        console.error(error);
        res.redirect(`${adminUrl}/dashboard`);
    }
};

exports.addTestimonial = async (req, res) => {
    try {
        const { customer_name, customer_job, review_text, rating } = req.body;
        await db.query(
            'INSERT INTO testimonials (customer_name, customer_job, review_text, rating) VALUES (?, ?, ?, ?)',
            [customer_name, customer_job, review_text, rating]
        );
        res.redirect(`${adminUrl}/testimonials`);
    } catch (error) {
        console.error(error);
        res.redirect(`${adminUrl}/testimonials`);
    }
};

exports.showEditTestimonialForm = async (req, res) => {
    try {
        const { id } = req.params;
        const [testimonials] = await db.query('SELECT * FROM testimonials ORDER BY created_at DESC');
        const [editingData] = await db.query('SELECT * FROM testimonials WHERE id = ?', [id]);
        if (editingData.length > 0) {
            res.render('admin/testimonials', { testimonials, editingTestimonial: editingData[0] });
        } else {
            res.redirect(`${adminUrl}/testimonials`);
        }
    } catch (error) {
        console.error(error);
        res.redirect(`${adminUrl}/testimonials`);
    }
};

exports.updateTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_name, customer_job, review_text, rating } = req.body;
        await db.query(
            'UPDATE testimonials SET customer_name = ?, customer_job = ?, review_text = ?, rating = ? WHERE id = ?',
            [customer_name, customer_job, review_text, rating, id]
        );
        res.redirect(`${adminUrl}/testimonials`);
    } catch (error) {
        console.error(error);
        res.redirect(`${adminUrl}/testimonials`);
    }
};

exports.deleteTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM testimonials WHERE id = ?', [id]);
        res.redirect(`${adminUrl}/testimonials`);
    } catch (error) {
        console.error(error);
        res.redirect(`${adminUrl}/testimonials`);
    }
};

// --- FUNGSI BARU UNTUK MANAJEMEN PESANAN ---
exports.showOrders = async (req, res) => {
    try {
        const [orders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.render('admin/orders', { orders });
    } catch (error) {
        console.error(error);
        res.redirect(`${adminUrl}/dashboard`);
    }
};

exports.showOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const [orderData] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
        if (orderData.length === 0) {
            return res.redirect(`${adminUrl}/orders`);
        }
        const [orderItems] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);

        res.render('admin/order-detail', { order: orderData[0], items: orderItems });
    } catch (error) {
        console.error(error);
        res.redirect(`${adminUrl}/orders`);
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { newStatus } = req.body;

        await db.query('UPDATE orders SET status = ? WHERE id = ?', [newStatus, id]);

        // Kirim email jika status diubah menjadi 'COMPLETED'
        if (newStatus === 'COMPLETED') {
            const [orderData] = await db.query(
                'SELECT customer_name, customer_email, ticket_number FROM orders WHERE id = ?',
                [id]
            );
            if (orderData.length > 0) {
                const customer = orderData[0];
                const mailOptions = {
                    from: `"NORI Digital" <${process.env.EMAIL_USER}>`,
                    to: customer.customer_email,
                    subject: `Pesanan Selesai: Tiket #${customer.ticket_number}`,
                    html: `
                        <h2>Halo, ${customer.customer_name}!</h2>
                        <p>Kabar baik! Pesanan Anda dengan nomor tiket <strong>#${customer.ticket_number}</strong> telah selesai kami kerjakan.</p>
                        <p>Kami akan segera menghubungi Anda untuk langkah selanjutnya.</p>
                        <br>
                        <p>Terima kasih telah mempercayai NORI.</p>
                    `,
                };
                await transporter.sendMail(mailOptions);
                console.log(`Email notifikasi penyelesaian terkirim ke ${customer.customer_email}`);
            }
        }

        res.redirect(`${adminUrl}/orders/${id}`);
    } catch (error) {
        console.error('Error saat update status pesanan:', error);
        res.redirect(`${adminUrl}/orders`);
    }
};

exports.showMaintenancePage = async (req, res) => {
    try {
        const [settingsRows] = await db.query('SELECT * FROM site_settings');
        const settings = settingsRows.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
        }, {});

        // ======================= PERBAIKAN UTAMA DI SINI =======================
        // Helper function untuk memformat DATETIME dari DB ke format input datetime-local
        const formatDateTimeForInput = (dbDate) => {
            if (!dbDate) return '';
            const date = new Date(dbDate);
            // Kurangi offset timezone agar waktu yang ditampilkan adalah waktu lokal, bukan UTC
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            // Ubah ke format YYYY-MM-DDTHH:mm
            return date.toISOString().slice(0, 16);
        };

        // Kirim waktu yang sudah diformat dengan benar ke template
        res.render('admin/maintenance', {
            settings,
            formattedStartTime: formatDateTimeForInput(settings.maintenance_start_time),
            formattedEndTime: formatDateTimeForInput(settings.maintenance_end_time),
        });
        // =====================================================================
    } catch (error) {
        console.error('Gagal memuat halaman maintenance:', error);
        res.redirect(`${adminUrl}/dashboard`);
    }
};

exports.updateMaintenanceSettings = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { mode, message, schedule_enabled, start_time, end_time } = req.body;

        await connection.query("UPDATE site_settings SET setting_value = ? WHERE setting_key = 'maintenance_mode'", [
            mode,
        ]);
        await connection.query("UPDATE site_settings SET setting_value = ? WHERE setting_key = 'maintenance_message'", [
            message,
        ]);
        await connection.query(
            "UPDATE site_settings SET setting_value = ? WHERE setting_key = 'maintenance_schedule_enabled'",
            [schedule_enabled ? '1' : '0']
        );

        // Hanya update waktu jika schedule diaktifkan dan waktunya valid
        if (schedule_enabled && start_time && end_time) {
            await connection.query(
                "UPDATE site_settings SET setting_value = ? WHERE setting_key = 'maintenance_start_time'",
                [start_time]
            );
            await connection.query(
                "UPDATE site_settings SET setting_value = ? WHERE setting_key = 'maintenance_end_time'",
                [end_time]
            );
        }

        await connection.commit();
        res.redirect(`${adminUrl}/maintenance`);
    } catch (error) {
        await connection.rollback();
        console.error('Gagal update pengaturan maintenance:', error);
        res.redirect(`${adminUrl}/maintenance`);
    } finally {
        connection.release();
    }
};

exports.getChartData = async (req, res) => {
    try {
        // 1. Query untuk data PENGUNJUNG dengan nama kolom yang benar
        const visitorQuery = `
            SELECT DATE(visit_time) as visit_date, COUNT(*) as visit_count
            FROM visits
            WHERE visit_time >= CURDATE() - INTERVAL 6 DAY
            GROUP BY visit_date ORDER BY visit_date ASC;
        `;
        const [visitorResults] = await db.query(visitorQuery);

        // 2. Query untuk data PENJUALAN (tetap menggunakan created_at)
        const salesQuery = `
            SELECT DATE(created_at) as sale_date, SUM(total_amount) as daily_revenue
            FROM orders
            WHERE status = 'SUCCESS' AND created_at >= CURDATE() - INTERVAL 6 DAY
            GROUP BY sale_date ORDER BY sale_date ASC;
        `;
        const [salesResults] = await db.query(salesQuery);

        // Siapkan struktur data untuk 7 hari terakhir
        const labels = [];
        const dataPoints = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            labels.push(d.toLocaleDateString('id-ID', { weekday: 'long' }));
            const dateString = d.toISOString().split('T')[0];
            dataPoints[dateString] = { visits: 0, revenue: 0 };
        }

        // Isi data pengunjung
        visitorResults.forEach((row) => {
            const dateString = new Date(row.visit_date).toISOString().split('T')[0];
            if (dataPoints[dateString] !== undefined) {
                dataPoints[dateString].visits = row.visit_count;
            }
        });

        // Isi data penjualan
        salesResults.forEach((row) => {
            const dateString = new Date(row.sale_date).toISOString().split('T')[0];
            if (dataPoints[dateString] !== undefined) {
                dataPoints[dateString].revenue = parseFloat(row.daily_revenue);
            }
        });

        const visitorData = Object.values(dataPoints).map((d) => d.visits);
        const revenueData = Object.values(dataPoints).map((d) => d.revenue);

        res.json({ labels, visitorData, revenueData });
    } catch (error) {
        console.error('Error saat mengambil data grafik:', error);
        res.status(500).json({ message: 'Gagal mengambil data grafik' });
    }
};

// controllers/paymentController.js
const db = require('../config/database');
const snap = require('../config/midtrans');
const transporter = require('../config/mailer');

// ... (fungsi createTransaction Anda tetap sama, tidak perlu diubah)
exports.createTransaction = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const loggedInUser = req.session.user;
        const { customerNotes, cartItems, ticketNumber } = req.body;
        const customerName = loggedInUser.name;
        const customerEmail = loggedInUser.email;

        const productIds = cartItems.map((item) => item.productId);

        if (productIds.length === 0) {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            return res.status(400).json({ message: 'Keranjang tidak boleh kosong.' });
        }

        const query = `SELECT id, price, discount_percent, name FROM products WHERE id IN (?)`;
        const [productsFromDB] = await connection.query(query, [productIds]);

        let serverTotalAmount = 0;
        const item_details = cartItems.map((item) => {
            const productData = productsFromDB.find((p) => p.id === item.productId);
            if (!productData) {
                throw new Error('Produk tidak valid ditemukan.');
            }

            let finalPrice = productData.price;
            if (productData.discount_percent > 0) {
                finalPrice = productData.price * (1 - productData.discount_percent / 100);
            }
            
            const roundedPrice = Math.round(finalPrice);
            serverTotalAmount += roundedPrice * item.quantity;
            
            return {
                id: item.productId,
                price: roundedPrice,
                quantity: item.quantity,
                name: productData.name.substring(0, 50),
            };
        });

        const parameter = {
            transaction_details: {
                order_id: ticketNumber,
                gross_amount: serverTotalAmount,
            },
            customer_details: {
                first_name: customerName,
                email: customerEmail,
            },
            item_details,
        };

        const transaction = await snap.createTransaction(parameter);
        const transactionToken = transaction.token;

         // ========== PERUBAHAN PENTING DI SINI: SIMPAN TOKEN KE DB ==========
        const orderQuery = `INSERT INTO orders (ticket_number, customer_name, customer_email, total_amount, status, payment_gateway_invoice_id, midtrans_token, customer_notes, user_id) 
                            VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)`;
        const [orderResult] = await connection.query(orderQuery, [
            ticketNumber, loggedInUser.name, loggedInUser.email, serverTotalAmount, ticketNumber, transactionToken, customerNotes, loggedInUser.id,
        ]);
        // ===================================================================

        const newOrderId = orderResult.insertId;

        const orderItemsQuery = `INSERT INTO order_items (order_id, product_name, quantity, price, customizations) VALUES ?`;
        const orderItemsValues = cartItems.map((item) => {
             const productData = productsFromDB.find((p) => p.id === item.productId);
             let finalPrice = productData.price;
             if (productData.discount_percent > 0) {
                finalPrice = productData.price * (1 - productData.discount_percent / 100);
            }
            return [
                newOrderId,
                productData.name,
                item.quantity,
                Math.round(finalPrice),
                JSON.stringify(item.customizations || {}),
            ];
        });
        if (orderItemsValues.length > 0) {
            await connection.query(orderItemsQuery, [orderItemsValues]);
        }

        await connection.commit();
        res.status(200).json({ transactionToken });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error saat membuat transaksi Midtrans:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    } finally {
        if (connection) connection.release();
    }
};


// ======================= FUNGSI EMAIL DENGAN DEBUGGING LEBIH BAIK =======================
async function sendInvoiceEmail(orderId) {
    console.log(`[Email Service] Memulai proses pengiriman invoice untuk pesanan #${orderId}`);
    try {
        const [orderData] = await db.query('SELECT * FROM orders WHERE ticket_number = ?', [orderId]);
        if (orderData.length === 0) throw new Error('Pesanan tidak ditemukan di database.');
        
        const order = orderData[0];
        const [orderItems] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

        let itemsHtml = orderItems.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.product_name} (x${item.quantity})</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price * item.quantity)}</td>
            </tr>
        `).join('');

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Terima Kasih Atas Pesanan Anda!</h2>
                <p>Halo, ${order.customer_name}. Pembayaran Anda untuk pesanan <strong>#${order.ticket_number}</strong> telah berhasil kami terima.</p>
                <h3>Detail Pesanan:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Produk</th>
                            <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                    <tfoot>
                        <tr>
                            <th style="padding: 8px; text-align: right;">Total:</th>
                            <th style="padding: 8px; text-align: right;">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total_amount)}</th>
                        </tr>
                    </tfoot>
                </table>
                <br>
                <p>Kami akan segera memproses pesanan Anda. Terima kasih telah mempercayai NORI.</p>
            </div>
        `;

        const mailOptions = {
            from: `"NORI Digital" <${process.env.EMAIL_USER}>`,
            to: order.customer_email,
            subject: `Invoice untuk Pesanan #${order.ticket_number}`,
            html: emailHtml
        };

        console.log(`[Email Service] Mencoba mengirim email ke: ${mailOptions.to}...`);
        
        // Kirim email dan tunggu hasilnya
        let info = await transporter.sendMail(mailOptions);

        console.log(`[Email Service] ✅ Email berhasil dikirim! Message ID: ${info.messageId}`);
        console.log(`[Email Service] Response dari SMTP Server: ${info.response}`);

    } catch (error) {
        // CCTV #4: Tangkap dan catat error Nodemailer dengan detail
        console.error('==================== ❌ EMAIL GAGAL DIKIRIM ❌ ====================');
        console.error(`Gagal mengirim invoice untuk pesanan #${orderId}.`);
        console.error('Error Code:', error.code);
        console.error('Error Command:', error.command);
        console.error('Full Error Message:', error.message);
        console.error('================================================================');
    }
}
// =====================================================================================

exports.handleMidtransNotification = async (req, res) => {
    try {
        const notificationJson = req.body;

        // ======================= CCTV PENTING DI SINI =======================
        console.log('--- [CCTV] Notifikasi Midtrans Diterima ---');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Body Notifikasi Mentah:', JSON.stringify(notificationJson, null, 2));
        console.log('-------------------------------------------');
        // =====================================================================

        const statusResponse = await snap.transaction.notification(notificationJson);
        
        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;
        const paymentType = statusResponse.payment_type;

        console.log(`[INFO] Verifikasi notifikasi untuk Order ID: ${orderId}`);
        console.log(`[INFO] Status Transaksi: '${transactionStatus}'`);
        console.log(`[INFO] Status Fraud: '${fraudStatus}'`);
        console.log(`[INFO] Tipe Pembayaran: '${paymentType}'`);

        if (transactionStatus == 'capture' || transactionStatus == 'settlement') {
            if (fraudStatus == 'accept') {
                const [currentOrderRows] = await db.query("SELECT status FROM orders WHERE ticket_number = ?", [orderId]);

                if (currentOrderRows.length > 0 && currentOrderRows[0].status !== 'SUCCESS') {
                    console.log(`[AKSI] Memproses pembayaran untuk ${orderId}. Status saat ini: ${currentOrderRows[0].status}.`);
                    await db.query("UPDATE orders SET status = 'SUCCESS' WHERE ticket_number = ?", [orderId]);
                    console.log(`[AKSI] ✅ Database untuk ${orderId} berhasil di-update ke SUCCESS.`);
                    await sendInvoiceEmail(orderId);
                } else {
                     console.log(`[INFO] Pesanan ${orderId} sudah berstatus SUCCESS atau tidak ditemukan. Aksi dihentikan.`);
                }
            } else {
                console.log(`[WARN] Transaksi ${orderId} diterima (${transactionStatus}) tetapi ditolak karena fraud status: ${fraudStatus}.`);
            }
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
            await db.query("UPDATE orders SET status = 'FAILED' WHERE ticket_number = ?", [orderId]);
            console.log(`[AKSI] ❌ Database untuk ${orderId} di-update ke FAILED.`);
        } else {
            console.log(`[INFO] Status untuk ${orderId} adalah '${transactionStatus}'. Belum ada aksi update database.`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('--- ❌ Error di Notifikasi Handler ❌ ---');
        console.error('Error:', error.message);
        console.error('-------------------------------------------');
        res.status(500).send('Internal Server Error');
    }
};

// ======================= FUNGSI RESUME TRANSACTION (DIROMBAK TOTAL) =======================
exports.resumeTransaction = async (req, res) => {
    try {
        const { orderId } = req.body; // Ini adalah ticket_number
        const userId = req.session.user.id;

        // 1. BUKAN MEMBUAT TRANSAKSI BARU, TAPI MENGAMBIL TOKEN YANG SUDAH ADA
        const [orders] = await db.query(
            'SELECT midtrans_token FROM orders WHERE ticket_number = ? AND user_id = ? AND status = "PENDING"',
            [orderId, userId]
        );

        if (orders.length === 0 || !orders[0].midtrans_token) {
            return res.status(404).json({ message: 'Pembayaran tidak ditemukan atau sudah diproses.' });
        }

        const transactionToken = orders[0].midtrans_token;

        // 2. LANGSUNG KIRIM TOKEN YANG ADA KEMBALI KE FRONTEND
        res.status(200).json({ transactionToken });

    } catch (error) {
        console.error('Error saat melanjutkan transaksi:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};
// ==========================================================================================


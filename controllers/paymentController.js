// controllers/paymentController.js
const db = require('../config/database');
const snap = require('../config/midtrans'); // Ganti ke Midtrans
const crypto = require('crypto');

exports.createTransaction = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const { customerName, customerEmail, customerNotes, cartItems, ticketNumber } = req.body;

        const productIds = cartItems.map((item) => item.productId);

        if (productIds.length === 0) {
            // Rollback dan release jika ada koneksi
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            return res.status(400).json({ message: 'Keranjang tidak boleh kosong.' });
        }

        const query = `SELECT id, price, discount_percent FROM products WHERE id IN (?)`;
        const [productsFromDB] = await connection.query(query, [productIds]);

        // Kalkulasi total
        let serverTotalAmount = 0;
        const item_details = cartItems.map((item) => {
            const productData = productsFromDB.find((p) => p.id === item.productId);
            if (!productData) {
                throw new Error('Produk tidak valid ditemukan.');
            }
            // Hitung harga final di server (SANGAT PENTING UNTUK KEAMANAN)
            let finalPrice = productData.price;
            if (productData.discount_percent > 0) {
                finalPrice = finalPrice * (1 - productData.discount_percent / 100);
            }
            serverTotalAmount += finalPrice * item.quantity;
            return {
                id: item.productId,
                price: finalPrice,
                quantity: item.quantity,
                name: item.name.substring(0, 50), // Midtrans punya batas 50 karakter
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

        // Buat transaksi di Midtrans
        const transaction = await snap.createTransaction(parameter);
        const transactionToken = transaction.token;

        // Simpan pesanan ke database
        const orderQuery = `INSERT INTO orders (ticket_number, customer_name, customer_email, total_amount, status, payment_gateway_invoice_id, customer_notes) 
                            VALUES (?, ?, ?, ?, 'PENDING', ?, ?)`;
        const [orderResult] = await connection.query(orderQuery, [
            ticketNumber,
            customerName,
            customerEmail,
            serverTotalAmount,
            ticketNumber,
            customerNotes,
        ]);

        const newOrderId = orderResult.insertId;

        const orderItemsQuery = `INSERT INTO order_items (order_id, product_name, quantity, price, customizations) VALUES ?`;
        const orderItemsValues = cartItems.map((item) => [
            newOrderId,
            item.name,
            item.quantity,
            item.price,
            JSON.stringify(item.customizations),
        ]);
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

exports.handleMidtransNotification = async (req, res) => {
    try {
        const notificationJson = req.body;

        // Verifikasi notifikasi menggunakan library Midtrans
        const statusResponse = await snap.transaction.notification(notificationJson);
        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        console.log(`Notifikasi diterima untuk pesanan ${orderId}: ${transactionStatus}`);

        if (transactionStatus == 'capture' || transactionStatus == 'settlement') {
            if (fraudStatus == 'accept') {
                // Update status pesanan di database menjadi 'SUCCESS'
                await db.query("UPDATE orders SET status = 'SUCCESS' WHERE ticket_number = ?", [orderId]);
                console.log(`✅ Pesanan ${orderId} berhasil dibayar.`);
            }
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
            // Update status pesanan menjadi 'FAILED'
            await db.query("UPDATE orders SET status = 'FAILED' WHERE ticket_number = ?", [orderId]);
            console.log(`❌ Pesanan ${orderId} gagal/dibatalkan.`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error menangani notifikasi Midtrans:', error);
        res.status(500).send('Internal Server Error');
    }
};

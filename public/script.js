// script.js
// NORI - Digital Portfolio Development
// Main JavaScript File

document.addEventListener('DOMContentLoaded', function () {
    // Initialize the application
    initApp();
});

/**
 * Initialize the application
 */
function initApp() {
     fetchProducts();

    // Initialize all components
    initPreloader();
    initThemeToggle();
    initMobileMenu();
    initScrollAnimations();
    initSmoothScrolling();
    initModalSystem();
    initNotificationModal();
    initFormValidation();
    initLoadingState();
    initTypingAnimation();
    initAuthModals();
    initUserInteractions(); 
   
    // Check for saved cart items in localStorage
    loadCartFromStorage();

    // Update cart UI on initial load
    updateCartUI();

    console.log('NORI Website initialized successfully');
}

function initThemeToggle() {
    const themeToggleButton = document.getElementById('theme-toggle');
    const docElement = document.documentElement;

    if (
        localStorage.theme === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
        docElement.classList.add('dark');
    } else {
        docElement.classList.remove('dark');
    }

    themeToggleButton.addEventListener('click', () => {
        docElement.classList.toggle('dark');
        localStorage.theme = docElement.classList.contains('dark') ? 'dark' : 'light';
    });
}

function initTypingAnimation() {
    const typingTextEl = document.getElementById('typing-text');
    if (!typingTextEl) return;

    const words = ['Desain Modern', 'Kode Bersih', 'Responsif Cepat', 'Harga Terjangkau'];
    let wordIndex = 0,
        charIndex = 0,
        isDeleting = false;
    const type = () => {
        const currentWord = words[wordIndex];
        let displayText = isDeleting ? currentWord.substring(0, charIndex--) : currentWord.substring(0, charIndex++);

        typingTextEl.textContent = displayText;

        let timeout = isDeleting ? 75 : 150;

        if (!isDeleting && charIndex === currentWord.length + 1) {
            timeout = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            timeout = 500;
        }
        setTimeout(type, timeout);
    };
    type();
}

/**
 * Preloader and Entry Animation Functionality
 */
function initPreloader() {
    const preloader = document.getElementById('preloader');
    const contentWrapper = document.getElementById('content-wrapper');
    const revealElements = document.querySelectorAll('.reveal-on-load');

    if (!preloader || !contentWrapper) return;

    // Hide preloader after 1.5 seconds
    setTimeout(() => {
        // Start fade-out transition for preloader
        preloader.classList.add('opacity-0');

        // Add event listener to detect end of transition
        preloader.addEventListener(
            'transitionend',
            (e) => {
                // Ensure the event is from the preloader itself
                if (e.target === preloader) {
                    // Hide preloader completely
                    preloader.style.display = 'none';

                    // Show main content with a fade-in effect
                    contentWrapper.classList.remove('opacity-0');

                    // Trigger entry animation for hero section elements
                    revealElements.forEach((el) => {
                        el.classList.add('revealed');
                    });
                }
            },
            { once: true }
        ); // 'once' option auto-removes the listener after execution
    }, 1500); // 1.5 second duration as requested
}

/**
 * Notification Modal Functionality
 */
function initNotificationModal() {
    const notificationButton = document.getElementById('notification-button');
    const notificationModal = document.getElementById('notification-modal');
    const closeNotificationButton = document.getElementById('close-notification-button');
    const notificationDot = document.getElementById('notification-dot');

    if (!notificationButton || !notificationModal || !closeNotificationButton || !notificationDot) return;

    // Function to open the notification modal
    notificationButton.addEventListener('click', () => {
        openModal(notificationModal);
        // Hide the red dot when notifications are opened (marks as read)
        notificationDot.classList.add('hidden');
    });

    // Function to close the modal with the 'X' button
    closeNotificationButton.addEventListener('click', () => {
        closeModal(notificationModal);
    });

    // Function to close the modal by clicking outside the content area
    notificationModal.addEventListener('click', (e) => {
        if (e.target === notificationModal) {
            closeModal(notificationModal);
        }
    });
}

/**
 * Mobile Menu Functionality
 */
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    // Pastikan kita hanya memilih link di dalam mobile menu
    const mobileNavLinks = document.querySelectorAll('#mobile-menu .mobile-nav-link');

    if (!mobileMenuButton || !mobileMenu || !mobileMenuOverlay) {
        console.warn('Elemen mobile menu tidak ditemukan.');
        return;
    }

    const closeMenu = () => {
        mobileMenu.classList.add('translate-x-full');
        mobileMenuOverlay.classList.add('opacity-0');
        setTimeout(() => {
            mobileMenuOverlay.classList.add('hidden');
        }, 300); // Sesuaikan dengan durasi transisi
        mobileMenuButton.classList.remove('hamburger-active');
        document.body.style.overflow = ''; // Kembalikan scroll body
    };

    const openMenu = () => {
        mobileMenu.classList.remove('translate-x-full');
        mobileMenuOverlay.classList.remove('hidden');
        setTimeout(() => {
            mobileMenuOverlay.classList.remove('opacity-0');
        }, 10);
        mobileMenuButton.classList.add('hamburger-active');
        document.body.style.overflow = 'hidden'; // Hentikan scroll body
    };

    mobileMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mobileMenu.classList.contains('translate-x-full')) {
            openMenu();
        } else {
            closeMenu();
        }
    });

    mobileMenuOverlay.addEventListener('click', closeMenu);

    mobileNavLinks.forEach((link) => {
        link.addEventListener('click', closeMenu);
    });
}

/**
 * Scroll Animations
 */
function initScrollAnimations() {
    const fadeSections = document.querySelectorAll('.fade-in-section');

    if (fadeSections.length > 0) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px',
            }
        );

        fadeSections.forEach((section) => {
            observer.observe(section);
        });
    }

    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

/**
 * Smooth Scrolling for Navigation Links
 */
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach((link) => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth',
                });
            }
        });
    });
}

/**
 * Cart System
 */
let cart = [];
let productsData = {}; // <-- GANTI DENGAN INI. Akan kita isi dengan data dari server.

// TAMBAHKAN FUNGSI BARU INI
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const productsFromServer = await response.json();

        // Mengubah array dari server menjadi objek yang bisa digunakan oleh cart
        products = productsFromServer.reduce((acc, product) => {
            acc[product.id] = {
                name: product.name,
                basePrice: product.price,
                // Simpan juga info diskon
                discountPercent: product.discount_percent,
            };
            return acc;
        }, {});
        console.log('Data produk berhasil dimuat dan diproses.');
    } catch (error) {
        console.error('Gagal memuat data produk:', error);
        showToast('Gagal memuat data produk.', 'error');
    }
}

// ======================= FUNGSI MODAL OTENTIKASI (DIPERBARUI) =======================
function initAuthModals() {
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    // 1. Ambil elemen modal notifikasi aktivasi yang baru
    const activationNoticeModal = document.getElementById('activation-notice-modal');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Tombol untuk berpindah antar modal
    const switchToRegisterBtn = document.getElementById('switch-to-register');
    const switchToLoginBtn = document.getElementById('switch-to-login');
    // 2. Ambil tombol tutup untuk modal baru
    const closeActivationNoticeBtn = document.getElementById('close-activation-notice-btn');

    if (!loginModal || !registerModal || !activationNoticeModal) return;

    // Logika berpindah dari Login ke Register
    if (switchToRegisterBtn) {
        switchToRegisterBtn.addEventListener('click', () => {
            closeModal(loginModal);
            openModal(registerModal);
        });
    }

    // Logika berpindah dari Register ke Login
    if (switchToLoginBtn) {
        switchToLoginBtn.addEventListener('click', () => {
            closeModal(registerModal);
            openModal(loginModal);
        });
    }

    // 3. Tambahkan event listener untuk tombol tutup modal notifikasi
    if (closeActivationNoticeBtn) {
        closeActivationNoticeBtn.addEventListener('click', () => {
            closeModal(activationNoticeModal);
        });
    }
    
    // Menangani klik di luar area modal untuk semua modal otentikasi
    [loginModal, registerModal, activationNoticeModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // Menangani submit form login (tidak ada perubahan)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                
                if (result.success) {
                    showToast('Login berhasil!', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    const errorMsg = document.getElementById('login-error-message');
                    errorMsg.textContent = result.error;
                    errorMsg.classList.remove('hidden');
                }
            } catch (err) {
                showToast('Terjadi kesalahan jaringan.', 'error');
            } finally {
                hideLoading();
            }
        });
    }

    // Menangani submit form register (logika sukses diubah)
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();

                if (result.success) {
                    // ========== PERUBAHAN UTAMA DI SINI ==========
                    registerForm.reset();
                    closeModal(registerModal);
                    // Buka modal notifikasi aktivasi, bukan modal login
                    openModal(activationNoticeModal);
                    // ===========================================
                } else {
                     const errorMsg = document.getElementById('register-error-message');
                    errorMsg.textContent = result.error;
                    errorMsg.classList.remove('hidden');
                }
            } catch (err) {
                 showToast('Terjadi kesalahan jaringan.', 'error');
            } finally {
                hideLoading();
            }
        });
    }
}

// FUNGSI BARU YANG MENGGABUNGKAN SEMUA LOGIKA INTERAKSI
function initUserInteractions() {
    // Cek status login pengguna dengan cara yang lebih andal
    const isLoggedIn = !document.getElementById('login-button'); 
    const loginButtonInHeader = document.getElementById('login-button'); 
    const loginModal = document.getElementById('login-modal');

    const productsContainer = document.getElementById('produk');
    const cartButton = document.getElementById('cart-button-trigger');
    const cartModal = document.getElementById('cart-modal');
    const closeCartButton = document.getElementById('close-cart-button');
    const checkoutButton = document.getElementById('checkout-button'); 

   const showLoginPrompt = () => {
        showToast('Anda harus login terlebih dahulu.', 'info');
        if (loginModal) {
            setTimeout(() => { openModal(loginModal); }, 1500);
        }
    };

    function populateCheckoutForm() {
    // Cek apakah variabel global loggedInUser ada
    if (typeof loggedInUser !== 'undefined' && loggedInUser) {
        const nameInput = document.getElementById('customer-name');
        const emailInput = document.getElementById('customer-email');

        if (nameInput) {
            nameInput.value = loggedInUser.name;
            nameInput.readOnly = true; // Buat input tidak bisa diubah
            nameInput.classList.add('bg-slate-200', 'dark:bg-slate-600', 'cursor-not-allowed');
        }
        if (emailInput) {
            emailInput.value = loggedInUser.email;
            emailInput.readOnly = true; // Buat input tidak bisa diubah
            emailInput.classList.add('bg-slate-200', 'dark:bg-slate-600', 'cursor-not-allowed');
        }
    }
}

    // 1. Logika untuk tombol "Tambah ke Keranjang"
    if (productsContainer) {
        productsContainer.addEventListener('click', (event) => {
            const button = event.target.closest('.add-to-cart-btn');
            if (button) {
                event.preventDefault();
                if (isLoggedIn) {
                    const productId = button.dataset.productId;
                    if (productId) addToCart(parseInt(productId, 10));
                } else {
                    showLoginPrompt();
                }
            }
        });
    }

    // 2. Logika untuk ikon Keranjang di header
    if (cartButton) {
        cartButton.addEventListener('click', (event) => {
            event.preventDefault();
            if (isLoggedIn) {
                if (cartModal) {
                    // ======================= PERUBAHAN DI SINI =======================
                    // Panggil fungsi baru untuk mengisi data sebelum membuka modal
                    populateCheckoutForm();
                    // ===============================================================
                    openModal(cartModal);
                }
            } else {
                showLoginPrompt();
            }
        });
    }

    if (loginButtonInHeader) {
        loginButtonInHeader.addEventListener('click', (event) => {
            event.preventDefault(); // Mencegah pindah ke halaman /login
            if (loginModal) {
                openModal(loginModal); // Buka modal login
            }
        });
    }

    // 3. Logika untuk tombol-tombol di dalam modal (tetap sama)
    if (closeCartButton) {
        closeCartButton.addEventListener('click', () => closeModal(cartModal));
    }
    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) closeModal(cartModal);
        });
    }

    // 4. LOGIKA BARU UNTUK MENGHUBUNGKAN TOMBOL CHECKOUT
    if (checkoutButton) {
        checkoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            processCheckout(); // Panggil fungsi checkout Anda
        });
    }
}



function addToCart(productId) {
    // Pastikan data produk sudah ada
    if (!products[productId]) {
        console.error('Product not found:', productId);
        showToast('Produk tidak ditemukan, coba muat ulang halaman.', 'error');
        return;
    }

    const productInfo = products[productId];

    // Hitung harga final dengan memperhitungkan diskon
    let finalPrice = productInfo.basePrice;
    if (productInfo.discountPercent > 0) {
        finalPrice = productInfo.basePrice * (1 - productInfo.discountPercent / 100);
    }

    // Buat item untuk keranjang
    // Logika kustomisasi yang rumit sudah dihapus
    const cartItem = {
        id: Date.now(), // ID unik untuk item di keranjang
        productId: productId,
        name: productInfo.name,
        price: finalPrice, // Gunakan harga yang sudah didiskon
        quantity: 1,
        customizations: {}, // Dikosongkan, bisa dikembangkan nanti
    };

    cart.push(cartItem);

    saveCartToStorage();
    updateCartUI();
    showToast('Produk berhasil ditambahkan ke keranjang', 'success');
}

function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        saveCartToStorage();
        updateCartUI();
        showToast('Produk dihapus dari keranjang', 'info');
    }
}

function updateQuantity(index, change) {
    if (index >= 0 && index < cart.length) {
        cart[index].quantity += change;

        if (cart[index].quantity < 1) {
            cart[index].quantity = 1;
        }

        saveCartToStorage();
        updateCartUI();
    }
}

function setQuantity(index, value) {
    const quantity = parseInt(value, 10);

    if (index >= 0 && index < cart.length && quantity > 0) {
        cart[index].quantity = quantity;
        saveCartToStorage();
        updateCartUI();
    }
}

function updateCartUI() {
    const cartContainer = document.getElementById('cart-items-container');
    const cartTotalEl = document.getElementById('cart-total');
    const cartCountEl = document.getElementById('cart-count');
    const emptyCartMsg = document.getElementById('empty-cart-message');
    const checkoutButton = document.getElementById('checkout-button');
    const customerForm = document.getElementById('customer-data-form');
    const ticketNumberEl = document.getElementById('ticket-number');

    if (!cartContainer) return;

    cartContainer.innerHTML = '';

    if (cart.length === 0) {
        if (emptyCartMsg) {
            emptyCartMsg.classList.remove('hidden');
            cartContainer.appendChild(emptyCartMsg);
        }
        if (customerForm) customerForm.classList.add('hidden');
        if (checkoutButton) checkoutButton.disabled = true;
    } else {
        if (emptyCartMsg) emptyCartMsg.classList.add('hidden');
        if (customerForm) customerForm.classList.remove('hidden');
        if (checkoutButton) checkoutButton.disabled = false;

        if (ticketNumberEl) {
            if (!ticketNumberEl.textContent) {
                ticketNumberEl.textContent = `NORI-${Date.now()}`;
            }
        }

        cart.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className =
                'cart-item-dynamic flex justify-between items-start mb-4 pb-4 border-b border-slate-200 dark:border-slate-700';

            let detailsHTML = `<h4 class="font-bold text-slate-800 dark:text-white">${item.name}</h4>`;

            if (Object.keys(item.customizations).length > 0) {
                detailsHTML += '<div class="text-xs text-slate-500 dark:text-slate-400 mt-1">';
                for (const key in item.customizations) {
                    detailsHTML += `<span><strong>${key}:</strong> ${item.customizations[key]}</span><br>`;
                }
                detailsHTML += '</div>';
            }

            itemEl.innerHTML = `
                <div class="flex-grow pr-4">
                    ${detailsHTML}
                    <p class="text-cyan-400 font-semibold mt-2">${formatRupiah(item.price)}</p>
                </div>
                <div class="text-right">
                    <div class="flex items-center border border-slate-300 dark:border-slate-600 rounded-md mb-2">
                        <button onclick="updateQuantity(${index}, -1)" class="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-l-md transition-colors">-</button>
                        <input type="number" value="${item.quantity}" onchange="setQuantity(${index}, this.value)" class="w-12 text-center bg-transparent border-none focus:outline-none">
                        <button onclick="updateQuantity(${index}, 1)" class="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-r-md transition-colors">+</button>
                    </div>
                    <button onclick="removeFromCart(${index})" class="text-red-500 hover:text-red-400 text-xs transition-colors">Hapus</button>
                </div>
            `;

            cartContainer.appendChild(itemEl);
        });
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (cartTotalEl) {
        cartTotalEl.textContent = formatRupiah(total);
    }

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountEl) {
        cartCountEl.textContent = totalItems;

        if (totalItems > 0) {
            cartCountEl.classList.remove('hidden', 'scale-0');
            cartCountEl.classList.add('flex', 'scale-100');
        } else {
            cartCountEl.classList.add('scale-0');
            cartCountEl.classList.remove('scale-100');
        }
    }
}

function processCheckout() {
    const customerNameEl = document.getElementById('customer-name');
    const customerEmailEl = document.getElementById('customer-email');
    const customerNotesEl = document.getElementById('customer-notes');
    const ticketNumberEl = document.getElementById('ticket-number');

    // 2. Lakukan validasi PADA ELEMEN, bukan nilainya
    if (!customerNameEl || !customerEmailEl || !customerNotesEl || !ticketNumberEl) {
        showToast('Terjadi kesalahan pada form checkout.', 'error');
        return;
    }

    // 3. Sekarang, ambil nilainya dengan aman
    const customerName = customerNameEl.value.trim();
    const customerEmail = customerEmailEl.value.trim();
    const customerNotes = customerNotesEl.value.trim();
    const ticketNumber = ticketNumberEl.textContent;

     // Validasi input (opsional karena sudah auto-fill, tapi bagus untuk keamanan)
    if (!customerName || !customerEmail) {
        showToast('Nama dan Email wajib diisi.', 'error');
        return;
    }

    const orderData = {
        customerName,
        customerEmail,
        customerNotes,
        cartItems: cart,
        ticketNumber
    };


    showLoading(); // Tampilkan spinner loading

    fetch('/payment/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
    })
        .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw new Error(err.message || 'Gagal membuat transaksi.') });
        }
        return res.json();
    })
        .then((data) => {
            hideLoading();
            if (data.transactionToken) {
                // ======================= PANGGIL MIDTRANS SNAP POP-UP =======================
                window.snap.pay(data.transactionToken, {
                    onSuccess: function (result) {
                        console.log('success', result);
                        window.location.href = '/payment-success';
                    },
                    onPending: function (result) {
                        console.log('pending', result);
                        // Anda bisa arahkan ke halaman tunggu atau biarkan di sini
                        showToast('Menunggu pembayaran Anda...', 'info');
                    },
                    onError: function (result) {
                        console.log('error', result);
                        window.location.href = '/payment-failure';
                    },
                    onClose: function () {
                        showToast('Anda menutup pop-up pembayaran.', 'info');
                    },
                });
                // ==========================================================================
            } else {
                throw new Error(data.message || 'Gagal mendapatkan token transaksi.');
            }
        })
        .catch((error) => {
            hideLoading();
            console.error('Error:', error);
            showToast(error.message, 'error');
        });
}

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
}

/**
 * Modal System
 */
function initModalSystem() {
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal:not(.hidden)');
            openModals.forEach((modal) => {
                closeModal(modal);
            });
        }
    });
}

function openModal(modal) {
    if (!modal) return;

    modal.classList.remove('hidden');

    void modal.offsetWidth;

    modal.classList.remove('opacity-0');
    const modalContent = modal.querySelector('.bg-slate-800');
    if (modalContent) {
        modalContent.classList.remove('scale-95');
    }

    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    if (!modal) return;

    modal.classList.add('opacity-0');
    const modalContent = modal.querySelector('.bg-slate-800');
    if (modalContent) {
        modalContent.classList.add('scale-95');
    }

    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
}

/**
 * Form Validation
 */
function initFormValidation() {
    const customerName = document.getElementById('customer-name');
    const customerEmail = document.getElementById('customer-email');

    if (customerName) {
        customerName.addEventListener('input', function () {
            validateField(this, /^[a-zA-Z\s]{3,}$/, 'Nama minimal 3 karakter dan hanya boleh berisi huruf');
        });
    }

    if (customerEmail) {
        customerEmail.addEventListener('input', function () {
            validateField(this, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format email tidak valid');
        });
    }
}

function validateField(field, regex, errorMessage) {
    if (!field) return;

    const isValid = regex.test(field.value.trim());

    if (field.value.trim() === '') {
        field.classList.remove('border-green-500', 'border-red-500');
    } else if (isValid) {
        field.classList.remove('border-red-500');
        field.classList.add('border-green-500');
    } else {
        field.classList.remove('border-green-500');
        field.classList.add('border-red-500');

        field.addEventListener('blur', function () {
            if (!regex.test(this.value.trim()) && this.value.trim() !== '') {
                showToast(errorMessage, 'error');
            }
        });
    }
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const toastIcon = toast.querySelector('i');
    const toastMessage = toast.querySelector('p');

    toast.classList.remove('bg-green-500', 'bg-red-500', 'bg-blue-500');

    if (type === 'error') {
        toast.classList.add('bg-red-500');
        toastIcon.className = 'fas fa-exclamation-circle';
    } else if (type === 'info') {
        toast.classList.add('bg-blue-500'); // Warna baru untuk info
        toastIcon.className = 'fas fa-info-circle';
    } else {
        toast.classList.add('bg-green-500');
        toastIcon.className = 'fas fa-check-circle';
    }

    toastMessage.textContent = message;
    toast.classList.remove('translate-x-[120%]');

    setTimeout(() => {
        toast.classList.add('translate-x-[120%]');
    }, 2000);
}

function initLoadingState() {
    // Future implementation for loading states
}

function showLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.classList.add('hidden');
    }
}

function saveCartToStorage() {
    localStorage.setItem('noriCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('noriCart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            console.error('Error parsing cart from localStorage:', e);
            cart = [];
        }
    }
}

// Make functions available globally for HTML onclick attributes
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.setQuantity = setQuantity;

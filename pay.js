// js/pay.js — Auto-check status tiap 5 detik

document.addEventListener('DOMContentLoaded', function () {
    // Ambil order_id dari pathname: /isisaldo/SALDO-xxx -> SALDO-xxx
    const pathParts = window.location.pathname.split('/');
    const orderId = pathParts[pathParts.length - 1];

    if (!orderId || orderId === 'isisaldo' || orderId === '') {
        window.location.href = '/isisaldo';
        return;
    }

    let transactionAmount = 0;
    let qrCanvas = null;
    let timerInterval = null;
    let autoCheckInterval = null;
    let loadingInterval = null;
    let isChecking = false;

    // DOM Elements
    const timerEl = document.getElementById('timer');
    const timerText = document.getElementById('timerText');
    const payAmountEl = document.getElementById('payAmount');
    const payOrderEl = document.getElementById('payOrder');
    const cekStatusBtn = document.getElementById('cekStatusBtn');
    const batalkanBtn = document.getElementById('batalkanBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const qrContainer = document.getElementById('qrcode');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const pendingModal = document.getElementById('pendingModal');
    const confirmModal = document.getElementById('confirmModal');

    // ===== Loading helpers =====
    function showLoading(text) {
        if (!loadingOverlay) return;
        loadingOverlay.classList.add('active');
        if (loadingText) loadingText.textContent = text;
        let dots = 0;
        loadingInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            if (loadingText) loadingText.textContent = text + '.'.repeat(dots);
        }, 500);
    }
    function hideLoading() {
        clearInterval(loadingInterval);
        if (loadingOverlay) loadingOverlay.classList.remove('active');
    }

    // ===== Load transaksi =====
    async function loadTransaction() {
        try {
            const res = await fetch(`/api/get-transaction?order_id=${orderId}`);
            const data = await res.json();

            if (!data || data.error) {
                alert('Transaksi tidak ditemukan');
                window.location.href = '/isisaldo';
                return;
            }

            transactionAmount = data.amount;

            // Tampilkan amount & order id
            if (payAmountEl) payAmountEl.textContent = 'Rp ' + Number(data.amount).toLocaleString('id-ID');
            if (payOrderEl) payOrderEl.textContent = 'Order ID: ' + data.order_id;

            // Cek jika sudah completed (refresh halaman)
            // Langsung redirect — coins sudah ditambah sebelumnya via check-status
            if (data.status === 'completed') {
                window.location.href = `/struk?order_id=${orderId}`;
                return;
            }

            // Timer countdown
            const expiredAt = data.expired_at || new Date(Date.now() + 30 * 60000).toISOString();
            startCountdown(expiredAt);

            // Generate QR
            if (data.qr_string) {
                generateQR(data.qr_string);
            } else {
                if (qrContainer) qrContainer.innerHTML = '<p style="color:rgba(255,255,255,0.4);font-size:13px;">QR tidak tersedia</p>';
            }

            // Mulai auto-check tiap 5 detik
            startAutoCheck();

        } catch (err) {
            console.error(err);
            alert('Gagal memuat transaksi: ' + err.message);
        }
    }

    // ===== Generate QR =====
    function generateQR(qrString) {
        if (!qrContainer) return;
        qrContainer.innerHTML = '';
        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, qrString, {
            width: 190, margin: 1,
            errorCorrectionLevel: 'H',
            color: { dark: '#000000', light: '#ffffff' }
        }, function (error) {
            if (error) {
                qrContainer.innerHTML = '<p style="color:#ff5555">Gagal generate QR</p>';
            } else {
                qrContainer.appendChild(canvas);
                qrCanvas = canvas;
            }
        });
    }

    // ===== Countdown timer =====
    function startCountdown(expiredAt) {
        const expiredTime = new Date(expiredAt).getTime();

        function update() {
            const now = Date.now();
            const distance = expiredTime - now;

            if (distance <= 0) {
                clearInterval(timerInterval);
                clearInterval(autoCheckInterval);
                if (timerEl) { timerEl.className = 'timer-container expired'; }
                if (timerText) timerText.textContent = 'EXPIRED';
                if (cekStatusBtn) cekStatusBtn.disabled = true;
                if (downloadBtn) { downloadBtn.disabled = true; downloadBtn.style.opacity = '0.4'; }
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            if (timerText) timerText.textContent = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
        }

        update();
        timerInterval = setInterval(update, 1000);
    }

    // ===== Auto-check status tiap 5 detik =====
    function startAutoCheck() {
        autoCheckInterval = setInterval(async () => {
            if (isChecking) return;
            await checkStatus(false); // silent = tidak tampilkan modal pending
        }, 5000);
    }

    // ===== Check status =====
    async function checkStatus(showModal = true) {
        if (isChecking) return;
        isChecking = true;

        try {
            const res = await fetch(`/api/check-status?order_id=${orderId}&amount=${transactionAmount}`);
            const data = await res.json();

            if (res.ok && data.status === 'completed') {
                clearInterval(autoCheckInterval);
                clearInterval(timerInterval);
                // Redirect ke struk
                window.location.href = `/struk?order_id=${orderId}`;
                return;
            }

            if (showModal && data.status === 'pending') {
                if (pendingModal) pendingModal.classList.add('show');
            }
        } catch (err) {
            console.error('[AutoCheck] Error:', err);
        } finally {
            isChecking = false;
        }
    }

    // ===== Tombol Cek Status (manual) =====
    if (cekStatusBtn) {
        cekStatusBtn.addEventListener('click', async function () {
            showLoading('Mengecek');
            await checkStatus(true);
            hideLoading();
        });
    }

    // ===== Download QR =====
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            if (qrCanvas) {
                const link = document.createElement('a');
                link.download = `qris-${orderId}.png`;
                link.href = qrCanvas.toDataURL('image/png');
                link.click();
            } else {
                alert('QR belum tersedia');
            }
        });
    }

    // ===== Batalkan =====
    if (batalkanBtn) {
        batalkanBtn.addEventListener('click', function () {
            if (confirmModal) confirmModal.classList.add('show');
        });
    }

    document.getElementById('confirmYa')?.addEventListener('click', async function () {
        if (confirmModal) confirmModal.classList.remove('show');
        clearInterval(autoCheckInterval);
        showLoading('Membatalkan');
        try {
            const res = await fetch('/api/cancel-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, amount: transactionAmount })
            });
            hideLoading();
            if (res.ok) {
                window.location.href = '/isisaldo';
            } else {
                const data = await res.json();
                alert('Gagal batalkan: ' + (data.error || ''));
                startAutoCheck();
            }
        } catch (err) {
            hideLoading();
            alert('Error: ' + err.message);
            startAutoCheck();
        }
    });

    document.getElementById('confirmTidak')?.addEventListener('click', function () {
        if (confirmModal) confirmModal.classList.remove('show');
    });

    document.getElementById('pendingOk')?.addEventListener('click', function () {
        if (pendingModal) pendingModal.classList.remove('show');
    });

    // Start
    loadTransaction();
});

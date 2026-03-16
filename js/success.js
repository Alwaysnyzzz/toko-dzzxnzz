// js/success.js

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');

    if (!orderId) {
        window.location.href = '/';
        return;
    }

    // Elemen DOM
    const loadingOverlay = document.getElementById('loadingOverlay');
    const successCard = document.getElementById('successCard');
    const loadingText = document.getElementById('loadingText');
    const orderIdEl = document.getElementById('order-id');
    const waktuEl = document.getElementById('waktu');
    const tanggalEl = document.getElementById('tanggal');
    const produkEl = document.getElementById('produk');
    const paymentEl = document.getElementById('payment');
    const layananEl = document.getElementById('layanan');
    const btnHome = document.getElementById('btnHome');
    const btnStruk = document.getElementById('btnStruk');

    let loadingInterval;

    // Fungsi loading dengan animasi titik
    function startLoading(text) {
        if (!loadingOverlay || !loadingText) return;
        loadingOverlay.classList.remove('hidden');
        loadingText.textContent = text + ' ...';
        let dots = 0;
        loadingInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            loadingText.textContent = text + ' ' + '.'.repeat(dots);
        }, 500);
    }

    function stopLoading() {
        if (!loadingOverlay) return;
        clearInterval(loadingInterval);
        loadingOverlay.classList.add('hidden');
    }

    // Mulai loading
    startLoading('Memuat struk');

    // Ambil data transaksi dari API
    fetch(`/api/get-transaction?order_id=${orderId}`)
        .then(res => res.json())
        .then(data => {
            if (data && !data.error) {
                orderIdEl.textContent = data.order_id;
                // Waktu dan tanggal dari created_at atau expired_at
                const timestamp = data.created_at || data.expired_at;
                if (timestamp) {
                    const date = new Date(timestamp);
                    const waktu = date.toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit',
                        hour12: false 
                    });
                    const tanggal = date.toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    });
                    waktuEl.textContent = waktu;
                    tanggalEl.textContent = tanggal;
                } else {
                    const now = new Date();
                    waktuEl.textContent = now.toLocaleTimeString('id-ID');
                    tanggalEl.textContent = now.toLocaleDateString('id-ID');
                }
            } else {
                const now = new Date();
                waktuEl.textContent = now.toLocaleTimeString('id-ID');
                tanggalEl.textContent = now.toLocaleDateString('id-ID');
            }
            
            // Sembunyikan loading dan tampilkan card
            stopLoading();
            if (successCard) successCard.style.display = 'block';
        })
        .catch(err => {
            console.error('Gagal ambil data transaksi:', err);
            const now = new Date();
            waktuEl.textContent = now.toLocaleTimeString('id-ID');
            tanggalEl.textContent = now.toLocaleDateString('id-ID');
            stopLoading();
            if (successCard) successCard.style.display = 'block';
        });

    // Tombol Kembali ke Home
    if (btnHome) {
        btnHome.addEventListener('click', function() {
            window.location.href = '/';
        });
    }

    // Tombol Lihat Struk (sementara alert, bisa dikembangkan untuk download PDF)
    if (btnStruk) {
        btnStruk.addEventListener('click', function() {
            alert('Fitur lihat struk akan segera tersedia (PDF)');
            // Nanti bisa redirect ke halaman invoice atau generate PDF
            // window.location.href = '/invoice?order_id=' + orderId;
        });
    }
});
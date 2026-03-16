// js/panelptero.js

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // Sidebar toggle (sudah ada di script.js, tapi kita pastikan untuk halaman ini)
        const menuBtn = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        if (menuBtn && sidebar && overlay) {
            menuBtn.onclick = () => { sidebar.classList.add('active'); overlay.classList.add('active'); };
            overlay.onclick = () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); };
        }

        // Toggle durasi
        const durasiButtons = document.querySelectorAll('.duration-btn');
        const cards20 = document.getElementById('cards20');
        const cards30 = document.getElementById('cards30');

        function setActiveDuration(durasi) {
            durasiButtons.forEach(btn => {
                if (btn.getAttribute('data-durasi') === durasi) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            if (durasi === '20') {
                cards20.style.display = 'flex';
                cards30.style.display = 'none';
            } else {
                cards20.style.display = 'none';
                cards30.style.display = 'flex';
            }
        }

        durasiButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const durasi = this.getAttribute('data-durasi');
                setActiveDuration(durasi);
            });
        });

        // Default 20 hari
        setActiveDuration('20');

        // Tombol pesan untuk 20 hari
        document.querySelectorAll('#cards20 .btn-pesan').forEach(btn => {
            btn.addEventListener('click', function() {
                const card = this.closest('.panel-card');
                const panel = card.getAttribute('data-panel');
                const price = card.querySelector('.price').getAttribute('data-harga');
                alert(`Anda memesan Panel ${panel}GB selama 20 hari dengan harga Rp ${price}`);
                // Nanti redirect ke halaman pembayaran
            });
        });

        // Tombol order untuk 30 hari
        document.querySelectorAll('#cards30 .btn-order').forEach(btn => {
            btn.addEventListener('click', function() {
                const card = this.closest('.vip-card');
                const title = card.querySelector('.card-title').textContent;
                const amount = card.querySelector('.amount').textContent;
                alert(`Anda memilih ${title} dengan harga Rp ${amount} untuk 30 hari`);
                // Nanti redirect ke halaman pembayaran
            });
        });
    });
})();
// Modal handling untuk halaman contact
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.modern-card[data-modal]');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    function closeAllModals() {
        modals.forEach(modal => modal.classList.remove('active'));
    }

    cards.forEach(card => {
        const btn = card.querySelector('.btn-detail');
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const modalId = card.getAttribute('data-modal');
                openModal(modalId);
            });
        }
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeAllModals();
        });
    });

    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeAllModals();
    });
});
// Smooth carousel arrows
const carousel = document.getElementById('drinkCarousel');
document.querySelector('.left-arrow').addEventListener('click', () => {
    carousel.scrollBy({ left: -350, behavior: 'smooth' });
});
document.querySelector('.right-arrow').addEventListener('click', () => {
    carousel.scrollBy({ left: 350, behavior: 'smooth' });
});

// Add to basket
document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const name = btn.closest('.drink-card').querySelector('.hover-title').textContent;
        alert(name + " added to your basket!");
    });
});
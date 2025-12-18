// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

// ==================== 1. SMOOTH SCROLL (LENIS) ====================
const lenis = new Lenis();

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Sync ScrollTrigger with Lenis
lenis.on('scroll', ScrollTrigger.update);

// ==================== 2. ENTRANCE ANIMATIONS ====================

// Hero Heading Character Animation
gsap.from('.heading-char', {
    opacity: 0,
    y: 50,
    rotate: 15,
    duration: 0.8,
    stagger: 0.05,
    ease: 'back.out(1.7)'
});

// Page Intro & Divider
gsap.from('.page-intro, .hero-divider', {
    opacity: 0,
    y: 20,
    duration: 1,
    delay: 0.5,
    stagger: 0.2,
    ease: 'power2.out'
});

// Donut Cards Staggered Reveal
gsap.from('.donut-card', {
    scrollTrigger: {
        trigger: '.donut-grid',
        start: 'top 85%',
    },
    opacity: 0,
    y: 50,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power3.out'
});

// ==================== 3. CARD INTERACTIONS ====================

const donutCards = document.querySelectorAll('.donut-card');

donutCards.forEach(card => {
    const img = card.querySelector('.donut-img');
    const shine = card.querySelector('.shine-effect');

    card.addEventListener('mouseenter', () => {
        gsap.to(card, { y: -10, duration: 0.3 });
        gsap.to(img, { scale: 1.1, rotation: -5, duration: 0.4 });
        if(shine) gsap.fromTo(shine, { left: '-100%' }, { left: '100%', duration: 0.8 });
    });

    card.addEventListener('mouseleave', () => {
        gsap.to(card, { y: 0, duration: 0.3 });
        gsap.to(img, { scale: 1, rotation: 0, duration: 0.4 });
    });
});

// ==================== 4. FILTERING SYSTEM ====================

const selectorBtns = document.querySelectorAll('.selector-btn');

selectorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Active Class
        selectorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const flavor = btn.getAttribute('data-flavor');

        donutCards.forEach(card => {
            const cardFlavor = card.getAttribute('data-flavor');
            if (flavor === 'all' || cardFlavor === flavor) {
                card.style.display = 'flex';
                gsap.fromTo(card, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 });
            } else {
                card.style.display = 'none';
            }
        });

        // Refresh ScrollTrigger to recalculate page height
        ScrollTrigger.refresh();
    });
});

// ==================== 5. CART & NOTIFICATION ====================

function showNotification(msg) {
    const note = document.createElement('div');
    note.className = 'notification-popup';
    note.innerText = msg;
    // Basic inline styling for the popup
    note.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; 
        background: #8A4B2F; color: white; padding: 15px 30px; 
        border-radius: 50px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000; font-family: 'DM Sans', sans-serif;
    `;
    document.body.appendChild(note);

    gsap.from(note, { x: 50, opacity: 0, duration: 0.4 });
    gsap.to(note, { x: 50, opacity: 0, delay: 2, onComplete: () => note.remove() });
}

document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const originalText = btn.innerText;
        btn.innerText = "✓ Added";
        btn.style.background = "#4CAF50";

        showNotification("Donut added to your box! 🍩");

        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "";
        }, 1500);
    });
});
// Load products on page load
document.addEventListener('DOMContentLoaded', async function() {
    const response = await apiCall('/api/products?category=donuts', 'GET');

    if (response.status === 'success') {
        const products = response.data.products;

        // Display products
        const productsContainer = document.getElementById('products-container');
        productsContainer.innerHTML = '';

        products.forEach(product => {
            const productHTML = `
                <div class="product-card">
                    <img src="${product.image_url || 'images/placeholder.jpg'}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="price">
                        <span class="original">$${product.price}</span>
                        <span class="discount">$${product.discount_price}</span>
                    </div>
                    <button onclick="addToCart(${product.id})">Add to Cart</button>
                </div>
            `;
            productsContainer.innerHTML += productHTML;
        });
    } else {
        alert('Failed to load products: ' + response.message);
    }
});

// Add to cart function
async function addToCart(productId) {
    const userId = localStorage.getItem('user_id');

    if (!userId) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }

    const response = await apiCall('/api/cart', 'POST', {
        product_id: productId,
        quantity: 1
    });


    if (response.status === 'success') {
        alert('Item added to cart!');
    } else {
        alert('Failed to add to cart: ' + response.message);
    }
}
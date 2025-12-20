// Register Free Plugins
gsap.registerPlugin(ScrollTrigger);

// ==================== 1. SMOOTH SCROLL (LENIS) ====================
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Connect ScrollTrigger to Lenis
lenis.on('scroll', ScrollTrigger.update);

// ==================== 2. TEXT ANIMATIONS (REPLACING SPLITTEXT) ====================
// Target your .heading-char spans directly
const headingChars = document.querySelectorAll('.heading-char');
if (headingChars.length > 0) {
    gsap.from(headingChars, {
        opacity: 0,
        y: 40,
        rotate: 15,
        duration: 0.8,
        stagger: 0.04,
        ease: 'back.out(1.7)',
        scrollTrigger: {
            trigger: '.hero-section',
            start: 'top 80%',
        }
    });
}

// ==================== 3. SCROLL REVEALS ====================

// Page Intro & Divider
gsap.from('.page-intro, .hero-divider', {
    scrollTrigger: {
        trigger: '.hero-section',
        start: 'top 75%',
    },
    opacity: 0,
    y: 30,
    duration: 1,
    stagger: 0.2,
    ease: 'power3.out'
});

// Cookie Cards Staggered Entrance
const cookieCards = document.querySelectorAll('.cookie-card, .donut-card');
gsap.from(cookieCards, {
    scrollTrigger: {
        trigger: '.donut-grid, .cookie-grid',
        start: 'top 80%',
    },
    opacity: 0,
    y: 50,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power3.out'
});

// Image Parallax Effect
gsap.utils.toArray('.cookie-img, .donut-img').forEach(image => {
    gsap.to(image, {
        y: -30,
        ease: "none",
        scrollTrigger: {
            trigger: image,
            scrub: true,
            start: "top bottom",
            end: "bottom top"
        }
    });
});

// ==================== 4. INTERACTIONS ====================

// Card Hover Lift
cookieCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        gsap.to(card, { y: -12, duration: 0.3, ease: 'power2.out' });
        const img = card.querySelector('.cookie-img, .donut-img');
        if (img) gsap.to(img, { scale: 1.1, rotation: -5, duration: 0.4 });
    });
    card.addEventListener('mouseleave', () => {
        gsap.to(card, { y: 0, duration: 0.3, ease: 'power2.out' });
        const img = card.querySelector('.cookie-img, .donut-img');
        if (img) gsap.to(img, { scale: 1, rotation: 0, duration: 0.4 });
    });
});

// Filter Functionality
const filterButtons = document.querySelectorAll('.filter-btn, .selector-btn');
filterButtons.forEach(button => {
    button.addEventListener('click', function () {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        const filterValue = this.getAttribute('data-filter') || this.getAttribute('data-flavor');

        cookieCards.forEach(card => {
            const cardValue = card.getAttribute('data-category') || card.getAttribute('data-flavor');
            if (filterValue === 'all' || cardValue === filterValue) {
                card.style.display = 'flex';
                gsap.fromTo(card, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 });
            } else {
                card.style.display = 'none';
            }
        });

        // Refresh ScrollTrigger as the page height has changed
        ScrollTrigger.refresh();
    });
});

// ==================== 5. CART & BACKEND INTEGRATION ====================

// Map HTML card titles to database product names
// Map HTML card titles to database product names
const cardToProductMap = {
    'Classic Chocolate': 'Double Chocolate',
    'Vanilla Twist': 'Sugar Cookie',
    'Nutty Crunch': 'Macadamia Nut',
    'Berry Burst': 'Oatmeal Raisin',
    'Creamy Dream': 'Sugar Cookie',
    'Oreo Bliss': 'Double Chocolate',
    'Pink Strawberry': 'Sugar Cookie',
    'Pumpkin Spice': 'Oatmeal Raisin',
    'Red Velvet': 'Double Chocolate',
    'Twix Crunch': 'Peanut Butter',
    'Vanilla Bean': 'Sugar Cookie',
    'Vanilla Chocolate Swirl': 'Chocolate Chip Cookie'
};

// Helper to match products
function findMatchingProduct(cardTitle, products) {
    // 1. Try exact map
    const mappedName = cardToProductMap[cardTitle];
    if (mappedName) {
        const match = products.find(p => p.name.toLowerCase().includes(mappedName.toLowerCase()));
        if (match) return match;
    }

    // 2. Try partial title match
    return products.find(p => p.name.toLowerCase().includes(cardTitle.toLowerCase()));
}

// Setup Buttons with Product IDs
async function setupProductButtons() {
    try {
        const response = await apiCall('/api/products?category=cookies', 'GET');

        if (response.status === 'success' && response.data && response.data.products) {
            const products = response.data.products;
            console.log('Loaded cookies:', products);

            document.querySelectorAll('.cookie-card').forEach(card => {
                const titleElement = card.querySelector('.cookie-title');
                if (titleElement) {
                    const cardTitle = titleElement.textContent.trim();
                    const matchedProduct = findMatchingProduct(cardTitle, products);

                    if (matchedProduct) {
                        const btn = card.querySelector('.add-to-cart');
                        if (btn) {
                            btn.setAttribute('data-product-id', matchedProduct.id);

                            // Remove old listeners by cloning
                            const newBtn = btn.cloneNode(true);
                            btn.parentNode.replaceChild(newBtn, btn);

                            newBtn.addEventListener('click', () => addToCart(matchedProduct.id, newBtn, cardTitle));
                        }
                    } else {
                        console.warn(`No product match for: ${cardTitle}`);
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error setting up cookies:', error);
    }
}

// Add to Cart Function
async function addToCart(productId, btn, productName) {
    if (!isLoggedIn()) {
        showNotification('Please login to add items', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    // Visual Feedback - Loading
    const originalText = btn.innerText;
    btn.innerText = '...';
    btn.disabled = true;

    try {
        // Fallback user_id if session fails
        const userId = localStorage.getItem('user_id');
        const cartData = { product_id: productId, quantity: 1 };
        if (userId) cartData.user_id = parseInt(userId);

        const response = await apiCall('/api/cart', 'POST', cartData);

        if (response.status === 'success') {
            showNotification(`${productName} added to cart! 🍪`);
            gsap.to(btn, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
        } else {
            showNotification(response.message || 'Failed to add', 'error');
        }
    } catch (error) {
        console.error('Cart error:', error);
        showNotification('Network error', 'error');
    } finally {
        // Restore Button
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Notification System
function showNotification(message, type = 'success') {
    const note = document.createElement('div');
    note.innerText = message;
    note.style.cssText = `
        position: fixed; bottom: 30px; right: 30px;
        background: ${type === 'error' ? '#d32f2f' : '#8A4B2F'}; 
        color: white; padding: 15px 25px;
        border-radius: 12px; font-weight: bold; z-index: 10000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(note);

    gsap.from(note, { x: 50, opacity: 0, duration: 0.4 });
    gsap.to(note, { x: 50, opacity: 0, delay: 2, onComplete: () => note.remove() });
}

// Initialize
document.addEventListener('DOMContentLoaded', setupProductButtons);

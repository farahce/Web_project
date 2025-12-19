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

// Map HTML card titles to database product names (exact matches)
const cardToProductMap = {
    'Lemon Glaze': 'Lemon Zest',
    'Blueberry Crunch': null, // No match in database
    'Chocolate Dream': 'Chocolate Frosted',
    'Strawberry Kiss': 'Strawberry Jam Filled',
    'Classic Sugar': 'Classic Glazed Donut', // Match "Classic" to "Classic Glazed Donut"
    'Vanilla Swirl': 'Boston Cream',
    'Maple Delight': 'Maple Bar',
    'Ube Fantasy': null, // No match in database
    'Cookies & Cream': 'Cookies & Cream'
};

// Helper function to find best matching product
function findMatchingProduct(cardTitle, products) {
    // First try exact mapping
    const mappedName = cardToProductMap[cardTitle];
    if (mappedName) {
        const exactMatch = products.find(p => 
            p.name.toLowerCase() === mappedName.toLowerCase()
        );
        if (exactMatch) {
            console.log(`Exact match: "${cardTitle}" → "${mappedName}" (ID: ${exactMatch.id})`);
            return exactMatch;
        }
    }
    
    // Try keyword matching
    const keywords = cardTitle.toLowerCase().split(' ');
    for (const keyword of keywords) {
        if (keyword.length < 3) continue; // Skip short words
        
        const match = products.find(p => {
            const productName = p.name.toLowerCase();
            return productName.includes(keyword) || keyword.includes(productName.split(' ')[0]);
        });
        
        if (match) {
            console.log(`Keyword match: "${cardTitle}" → "${match.name}" (ID: ${match.id})`);
            return match;
        }
    }
    
    console.warn(`No match found for: "${cardTitle}"`);
    return null;
}

// Load products and map them to static buttons
async function setupStaticButtons() {
    try {
        const response = await apiCall('/api/products?category=donuts', 'GET');
        
        if (response.status === 'success' && response.data && response.data.products) {
            const products = response.data.products;
            console.log('Loaded products for static buttons:', products);
            
            // Get all static donut cards
            const staticCards = document.querySelectorAll('.donut-card');
            console.log('Found static cards:', staticCards.length);
            
            // Match products to cards by title
            staticCards.forEach((card) => {
                const titleElement = card.querySelector('.donut-title');
                if (titleElement) {
                    const cardTitle = titleElement.textContent.trim();
                    const matchedProduct = findMatchingProduct(cardTitle, products);
                    
                    if (matchedProduct) {
                        const productId = matchedProduct.id;
                        
                        // Add product ID to card and button
                        card.setAttribute('data-product-id', productId);
                        const button = card.querySelector('.add-to-cart');
                        if (button) {
                            button.setAttribute('data-product-id', productId);
                            console.log(`✓ Matched "${cardTitle}" → Product ID ${productId} (${matchedProduct.name})`);
                        }
                    } else {
                        console.warn(`⚠ Could not find matching product for card: "${cardTitle}"`);
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading products for static buttons:', error);
    }
}

// Store original button text for static buttons and set up event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // First, load products and map them
    await setupStaticButtons();
    
    // Then set up event listeners
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        if (!btn.getAttribute('data-original')) {
            btn.setAttribute('data-original', btn.innerText);
        }
        
        // Only add event listener if button doesn't have onclick attribute
        if (!btn.getAttribute('onclick')) {
            btn.addEventListener('click', async (e) => {
                // Try to get product ID from data attribute or parent element
                const productId = btn.getAttribute('data-product-id') || 
                                btn.closest('.donut-card')?.getAttribute('data-product-id');
                
                if (productId) {
                    await addToCart(parseInt(productId));
                } else {
                    // Show error if product ID not found
                    showNotification('Product not found. Please try again.', 'error');
                    console.error('Product ID not found for button:', btn);
                }
            });
        }
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
                    <button onclick="addToCart(${product.id})" data-product-id="${product.id}">Add to Cart</button>
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
    if (!isLoggedIn()) {
        showNotification('Please login first to add items to cart', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Find the button that was clicked and update its state
    const buttons = document.querySelectorAll(`button[onclick*="addToCart(${productId})"]`);
    buttons.forEach(btn => {
        const originalText = btn.innerText;
        btn.setAttribute('data-original', originalText);
        btn.innerText = "Adding...";
        btn.disabled = true;
        btn.style.opacity = "0.6";
    });

    try {
        console.log('Adding to cart - Product ID:', productId);
        
        // First, get product details to pass to cart
        const productResponse = await apiCall(`/api/products?id=${productId}`, 'GET');
        let productName = 'Product';
        let productPrice = 0;
        let productImage = 'images/default.png';
        
        if (productResponse.status === 'success' && productResponse.data && productResponse.data.product) {
            const product = productResponse.data.product;
            productName = product.name;
            productPrice = parseFloat(product.price);
            productImage = product.image_url || 'images/default.png';
        }
        
        // Add to cart via API
        // Include user_id as fallback if session doesn't work
        const userId = localStorage.getItem('user_id');
        const cartData = {
            product_id: productId,
            quantity: 1
        };
        
        // Add user_id as fallback if available (for debugging session issues)
        if (userId) {
            cartData.user_id = parseInt(userId);
        }
        
        const response = await apiCall('/api/cart', 'POST', cartData);

        console.log('Cart API Response:', response);

        if (response.status === 'success') {
            showNotification('Item added to cart! 🍩', 'success');
            
            // Update button state
            buttons.forEach(btn => {
                const originalText = btn.getAttribute('data-original') || 'Add to Cart';
                btn.innerText = "✓ Added";
                btn.style.background = "#4CAF50";
                btn.style.opacity = "1";
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.background = "";
                    btn.disabled = false;
                }, 2000);
            });
            
            // Verify it was saved by checking the cart
            setTimeout(async () => {
                const cartCheck = await apiCall('/api/cart', 'GET');
                if (cartCheck.status === 'success') {
                    console.log('Cart verified - Items in cart:', cartCheck.data?.items?.length || 0);
                }
            }, 500);
        } else {
            console.error('Cart API Error:', response);
            const errorMsg = response.message || 'Unknown error';
            showNotification('Failed to add to cart: ' + errorMsg, 'error');
            
            // If not logged in, redirect to login
            if (errorMsg.includes('not logged in') || errorMsg.includes('login')) {
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
            
            buttons.forEach(btn => {
                btn.innerText = btn.getAttribute('data-original') || 'Add to Cart';
                btn.disabled = false;
                btn.style.opacity = "1";
            });
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Network error. Please try again.', 'error');
        buttons.forEach(btn => {
            btn.innerText = btn.getAttribute('data-original') || 'Add to Cart';
            btn.disabled = false;
            btn.style.opacity = "1";
        });
    }
}
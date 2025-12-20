// Cart Management System
class CartManager {
    constructor() {
        this.cart = this.loadCart();
        this.promoCodes = {
            'DAFAH10': 0.10,
            'SWEET15': 0.15,
            'WELCOME20': 0.20,
            'SUMMER25': 0.25
        };
        this.init();
    }

    init() {
        // Don't render cart immediately - wait for database load
        // Only render if not logged in or if we're not going to load from database
        if (!isLoggedIn()) {
            this.renderCart();
        }
        this.setupEventListeners();
    }

    loadCart() {
        const saved = localStorage.getItem('dafah_cart');
        return saved ? JSON.parse(saved) : [];
    }

    saveCart() {
        localStorage.setItem('dafah_cart', JSON.stringify(this.cart));
    }

    async addItem(item) {
        // If user is logged in, save to database
        if (isLoggedIn()) {
            try {
                const response = await apiCall('/api/cart', 'POST', {
                    product_id: item.id || item.product_id,
                    quantity: item.quantity || 1
                });

                if (response.status === 'success') {
                    // Reload cart from database
                    await this.loadCartFromDatabase();
                    this.showToast(`${item.name} added to cart!`, 'success');
                } else {
                    this.showToast(response.message || 'Failed to add to cart', 'error');
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                // Fallback to localStorage
                const existing = this.cart.find(i => i.id === item.id);
                if (existing) {
                    existing.quantity += item.quantity || 1;
                } else {
                    this.cart.push({ ...item, quantity: item.quantity || 1 });
                }
                this.saveCart();
                this.showToast(`${item.name} added to cart!`, 'success');
            }
        } else {
            // Not logged in - use localStorage
            const existing = this.cart.find(i => i.id === item.id);
            if (existing) {
                existing.quantity += item.quantity || 1;
            } else {
                this.cart.push({ ...item, quantity: item.quantity || 1 });
            }
            this.saveCart();
            this.showToast(`${item.name} added to cart!`, 'success');
        }
    }

    async removeItem(cartIdOrProductId, productId = null) {
        console.log('=== REMOVE ITEM START ===');
        console.log('cartIdOrProductId received:', cartIdOrProductId, 'Type:', typeof cartIdOrProductId);
        console.log('productId received:', productId, 'Type:', typeof productId);
        console.log('Current cart:', this.cart);

        // If two parameters, first is cart_id, second is product_id
        // If one parameter, it's product_id
        let searchId = productId || cartIdOrProductId;
        let cartId = productId ? cartIdOrProductId : null;

        // Convert to number if it's a string
        searchId = typeof searchId === 'string' ? parseInt(searchId) : searchId;
        if (cartId) {
            cartId = typeof cartId === 'string' ? parseInt(cartId) : cartId;
        }

        // If user is logged in, remove from database
        if (isLoggedIn()) {
            // If cart_id was passed directly, use it; otherwise find the item
            let item = null;
            let finalCartId = cartId;

            if (finalCartId) {
                // cart_id was passed directly
                item = this.cart.find(i => i.cart_id == finalCartId);
            } else {
                // Find the cart_id from the item - try multiple ways to match
                item = this.cart.find(i => {
                    const match1 = i.id == searchId;
                    const match2 = i.product_id == searchId;
                    const match3 = String(i.id) === String(searchId) || String(i.product_id) === String(searchId);
                    return match1 || match2 || match3;
                });
                if (item) {
                    finalCartId = item.cart_id;
                }
            }

            console.log('Found item to remove:', item);
            console.log('Final cart_id to delete:', finalCartId);

            if (item && finalCartId) {
                try {
                    console.log('Calling DELETE API with cart_id:', finalCartId);
                    // Include user_id as fallback if session doesn't work
                    const userId = localStorage.getItem('user_id');
                    const deleteData = {
                        cart_id: finalCartId
                    };
                    if (userId) {
                        deleteData.user_id = parseInt(userId);
                    }
                    console.log('Delete data:', deleteData);

                    const response = await apiCall('/api/cart', 'DELETE', deleteData);

                    console.log('Delete API response:', response);

                    if (response.status === 'success') {
                        // Reload cart from database to update the page
                        console.log('Delete successful, reloading cart...');
                        await this.loadCartFromDatabase();
                        this.showToast('Item removed from cart', 'warning');
                        return;
                    } else {
                        // If API fails, show error
                        console.error('Delete failed:', response);
                        this.showToast('Failed to remove from database: ' + (response.message || 'Unknown error'), 'error');
                    }
                } catch (error) {
                    console.error('Error removing from cart:', error);
                    this.showToast('Error removing item. Please try again.', 'error');
                }
            } else {
                console.warn('Item not found or missing cart_id');
                console.warn('Searched for itemId:', itemId, 'searchId:', searchId);
                console.warn('Available items:', this.cart.map(i => ({ id: i.id, product_id: i.product_id, cart_id: i.cart_id })));
                // If no cart_id, still remove from local display
                this.cart = this.cart.filter(i => {
                    const keep = !(i.id == searchId || i.product_id == searchId ||
                        String(i.id) === String(itemId) || String(i.product_id) === String(itemId));
                    return keep;
                });
                this.saveCart();
                this.renderCart();
                this.showToast('Item removed from cart (local only)', 'warning');
            }
        } else {
            // Not logged in - remove from localStorage only
            console.log('User not logged in, removing from localStorage only');
            this.cart = this.cart.filter(item => {
                return !(item.id == searchId || item.product_id == searchId ||
                    String(item.id) === String(itemId) || String(item.product_id) === String(itemId));
            });
            this.saveCart();
            this.renderCart();
            this.showToast('Item removed from cart', 'warning');
        }
        console.log('=== REMOVE ITEM END ===');
    }

    async updateQuantity(itemId, quantity) {
        if (quantity <= 0) {
            await this.removeItem(itemId);
            return;
        }

        const item = this.cart.find(i => i.id === itemId || i.product_id === itemId);
        if (!item) return;

        // If user is logged in, update in database
        if (isLoggedIn() && item.cart_id) {
            try {
                const response = await apiCall('/api/cart', 'PUT', {
                    cart_id: item.cart_id,
                    quantity: quantity
                });

                if (response.status === 'success') {
                    await this.loadCartFromDatabase();
                    return;
                }
            } catch (error) {
                console.error('Error updating cart:', error);
            }
        }

        // Fallback to localStorage
        item.quantity = quantity;
        this.saveCart();
        this.renderCart();
    }

    renderCart() {
        const cartItemsDiv = document.getElementById('cart-items');

        if (this.cart.length === 0) {
            cartItemsDiv.innerHTML = `
                <div class="empty-cart-message">
                    <i class="fas fa-shopping-bag"></i>
                    <p>Your cart is empty</p>
                    <a href="menu.html" class="btn radius">Continue Shopping</a>
                </div>
            `;
        } else {
            cartItemsDiv.innerHTML = this.cart.map((item, index) => {
                const itemId = item.id || item.product_id;
                // Ensure image path is correct - map product names to images
                const productImageMap = {
                    'Classic Glazed Donut': 'images/yellowdonut.png',
                    'Chocolate Frosted': 'images/choclate-dount.png',
                    'Strawberry Jam Filled': 'images/pink-dount.png',
                    'Boston Cream': 'images/dount-white.png',
                    'Maple Bar': 'images/yellowdonut.png',
                    'Cinnamon Sugar': 'images/sugar-dount.png',
                    'Lemon Zest': 'images/yellow-dount.png',
                    'Cookies & Cream': 'images/choclate-dount.png'
                };

                let imageSrc = item.image;
                if (!imageSrc || imageSrc === 'null' || imageSrc === '' || imageSrc === 'images/default.png') {
                    imageSrc = productImageMap[item.name] || 'images/default.png';
                }

                return `
                <div class="cart-item" style="animation-delay: ${index * 0.1}s">
                    <img src="${imageSrc}" alt="${item.name}" class="cart-item-image" onerror="this.src='images/default.png'" />
                    <div class="cart-item-details">
                        <h3 class="cart-item-name">${item.name}</h3>
                        <p class="cart-item-description">${item.description || 'Delicious treat'}</p>
                        <p class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                        <div class="cart-item-controls">
                            <div class="quantity-control">
                                <button class="quantity-btn" onclick="cartManager.updateQuantity('${itemId}', ${item.quantity - 1})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" class="quantity-input" value="${item.quantity}" 
                                       onchange="cartManager.updateQuantity('${itemId}', parseInt(this.value))" />
                                <button class="quantity-btn" onclick="cartManager.updateQuantity('${itemId}', ${item.quantity + 1})">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <button class="remove-btn" onclick="cartManager.removeItem(${item.cart_id ? item.cart_id : 'null'}, ${itemId})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
        }

        this.updateSummary();
    }

    updateSummary() {
        const subtotal = this.calculateSubtotal();
        const tax = subtotal * 0.10;
        const delivery = this.cart.length > 0 ? 5.00 : 0;
        let discount = 0;

        const promoCode = localStorage.getItem('dafah_promo');
        if (promoCode && this.promoCodes[promoCode]) {
            discount = subtotal * this.promoCodes[promoCode];
            document.getElementById('discount-item').style.display = 'flex';
            document.getElementById('discount').textContent = `-$${discount.toFixed(2)}`;
        } else {
            document.getElementById('discount-item').style.display = 'none';
        }

        const total = subtotal + tax + delivery - discount;

        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('delivery').textContent = `$${delivery.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    }

    calculateSubtotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    setupEventListeners() {
        document.getElementById('apply-promo').addEventListener('click', () => {
            const promoInput = document.getElementById('promo-input');
            const code = promoInput.value.toUpperCase();

            if (this.promoCodes[code]) {
                localStorage.setItem('dafah_promo', code);
                this.showToast(`Promo code "${code}" applied! ${Math.round(this.promoCodes[code] * 100)}% discount`, 'success');
                promoInput.value = '';
                this.updateSummary();
            } else {
                this.showToast('Invalid promo code', 'error');
            }
        });

        // Enter key for promo code
        document.getElementById('promo-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('apply-promo').click();
            }
        });
    }

    async loadCartFromDatabase() {
        if (!isLoggedIn()) {
            console.log('User not logged in, cannot load cart from database');
            return;
        }

        try {
            console.log('Loading cart from database...');
            // Add user_id as query parameter as fallback if session doesn't work
            const userId = localStorage.getItem('user_id');
            const endpoint = userId ? `/api/cart?user_id=${userId}` : '/api/cart';
            const response = await apiCall(endpoint, 'GET');
            console.log('Cart API GET Response:', response);

            if (response.status === 'success' && response.data) {
                const cartItems = response.data.items || [];

                // Map product names to image files
                const productImageMap = {
                    // Donuts
                    'Classic Glazed Donut': 'images/yellowdonut.png',
                    'Chocolate Frosted': 'images/choclate-dount.png',
                    'Strawberry Jam Filled': 'images/pink-dount.png',
                    'Boston Cream': 'images/dount-white.png',
                    'Maple Bar': 'images/yellowdonut.png',
                    'Cinnamon Sugar': 'images/sugar-dount.png',
                    'Lemon Zest': 'images/yellow-dount.png',
                    'Cookies & Cream': 'images/choclate-dount.png',

                    // Cookies
                    'Chocolate Chip Cookie': 'images/vanillacochocolatecookies.png',
                    'Oatmeal Raisin': 'images/cookie3.png',
                    'Peanut Butter': 'images/twixcookies.png',
                    'Sugar Cookie': 'images/cookie1.png',
                    'Double Chocolate': 'images/choclatecokies.png',
                    'Macadamia Nut': 'images/cookie2.png',

                    // Drinks (Verified filenames)
                    'Iced Coffee': 'images/icedlate.png',
                    'Cappuccino': 'images/capucino.png',
                    'Vanilla Latte': 'images/caramel.png',
                    'Iced Tea': 'images/mintjuice.png', // Placeholder
                    'Hot Chocolate': 'images/hotchoco.png',
                    'Espresso Shot': 'images/espresso.png',
                    'Smoothie - Strawberry': 'images/pink-dount.png', // Fallback
                    'Smoothie - Mango': 'images/yellow-dount.png' // Fallback
                };

                // Update CartManager with backend cart
                this.cart = cartItems.map(item => {
                    // Get image - first try database image_url, then map by name (trimmed), then default
                    let imageUrl = item.image_url;
                    if (!imageUrl || imageUrl === 'null' || imageUrl === '') {
                        const cleanName = item.name.trim();
                        imageUrl = productImageMap[cleanName] || 'images/default.png';
                        // Debug log if fallback used
                        if (!productImageMap[cleanName]) console.warn('Missing image for:', cleanName);
                    }

                    return {
                        id: item.product_id,
                        product_id: item.product_id,
                        cart_id: item.id, // Store cart_id for updates/deletes
                        name: item.name,
                        price: parseFloat(item.price),
                        quantity: item.quantity,
                        image: imageUrl,
                        description: item.name
                    };
                });

                console.log('Cart loaded from database:', this.cart.length, 'items');
                this.saveCart();
                this.renderCart();
            } else if (response.status === 'error') {
                console.error('Error loading cart:', response.message);
                // If error is about not being logged in, show message
                if (response.message.includes('not logged in')) {
                    showNotification('Please login to view your cart', 'error');
                }
                // Still render empty cart
                this.cart = [];
                this.renderCart();
            } else {
                // No items in cart
                this.cart = [];
                this.renderCart();
            }
        } catch (error) {
            console.error('Error loading cart from database:', error);
            // On error, show empty cart
            this.cart = [];
            this.renderCart();
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize cart manager
let cartManager;

// Remove the old DOMContentLoaded - we have a new one below

// Floating Action Button
function toggleFab() {
    const fabMenu = document.querySelector('.fab-menu');
    fabMenu.classList.toggle('active');
}

// Close FAB menu when clicking outside
document.addEventListener('click', (e) => {
    const fabContainer = document.querySelector('.fab-container');
    if (!fabContainer.contains(e.target)) {
        document.querySelector('.fab-menu').classList.remove('active');
    }
});

// Checkout function
function goToCheckout() {
    if (cartManager.cart.length === 0) {
        cartManager.showToast('Your cart is empty!', 'warning');
        return;
    }

    // Check if user is logged in before checkout
    if (!isLoggedIn()) {
        cartManager.showToast('Please login to proceed to checkout', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    window.location.href = 'checkout.html';
}

// Add to cart from other pages
window.addToCart = async function (item) {
    if (!cartManager) {
        cartManager = new CartManager();
    }
    await cartManager.addItem(item);
};
// Load cart items on page load
document.addEventListener('DOMContentLoaded', async function () {
    console.log('Cart page loaded');

    // Wait for cartManager to be initialized
    if (!cartManager) {
        cartManager = new CartManager();
    }

    // Check if user is logged in
    const loggedIn = isLoggedIn();
    console.log('User logged in:', loggedIn);

    if (!loggedIn) {
        // Show empty cart message but don't redirect immediately
        // Allow user to browse, but show message that login is needed to save cart
        if (cartManager.cart.length === 0) {
            // Cart is empty, just show empty cart message
            cartManager.renderCart();
        } else {
            // Has items in localStorage cart, show them but notify about login
            cartManager.renderCart();
            showNotification('Please login to sync your cart with your account', 'info');
        }
        return;
    }

    // User is logged in - load cart from backend
    console.log('Loading cart from database for logged in user');
    await cartManager.loadCartFromDatabase();

    // Force a re-render after loading to ensure items are displayed
    if (cartManager.cart.length > 0) {
        console.log('Cart has items, rendering...', cartManager.cart);
        cartManager.renderCart();
    } else {
        console.log('Cart is empty after loading from database');
        cartManager.renderCart();
    }
});

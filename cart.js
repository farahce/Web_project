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
        this.renderCart();
        this.setupEventListeners();
    }

    loadCart() {
        const saved = localStorage.getItem('dafah_cart');
        return saved ? JSON.parse(saved) : [];
    }

    saveCart() {
        localStorage.setItem('dafah_cart', JSON.stringify(this.cart));
    }

    addItem(item) {
        const existing = this.cart.find(i => i.id === item.id);
        if (existing) {
            existing.quantity += item.quantity || 1;
        } else {
            this.cart.push({ ...item, quantity: item.quantity || 1 });
        }
        this.saveCart();
        this.showToast(`${item.name} added to cart!`, 'success');
    }

    removeItem(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        this.renderCart();
        this.showToast('Item removed from cart', 'warning');
    }

    updateQuantity(itemId, quantity) {
        const item = this.cart.find(i => i.id === itemId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(itemId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.renderCart();
            }
        }
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
            cartItemsDiv.innerHTML = this.cart.map((item, index) => `
                <div class="cart-item" style="animation-delay: ${index * 0.1}s">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image" />
                    <div class="cart-item-details">
                        <h3 class="cart-item-name">${item.name}</h3>
                        <p class="cart-item-description">${item.description || 'Delicious treat'}</p>
                        <p class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                        <div class="cart-item-controls">
                            <div class="quantity-control">
                                <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" class="quantity-input" value="${item.quantity}" 
                                       onchange="cartManager.updateQuantity('${item.id}', parseInt(this.value))" />
                                <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <button class="remove-btn" onclick="cartManager.removeItem('${item.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
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

document.addEventListener('DOMContentLoaded', () => {
    cartManager = new CartManager();

    // Add sample items if cart is empty (for demo)
    if (cartManager.cart.length === 0) {
        // Uncomment to add demo items
        /*
        cartManager.addItem({
            id: 'donut-1',
            name: 'Glazed Donut',
            description: 'Classic glazed donut',
            price: 3.99,
            image: 'images/yellowdonut.png',
            quantity: 1
        });
        */
    }
});

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
    window.location.href = 'checkout.html';
}

// Add to cart from other pages
window.addToCart = function(item) {
    if (!cartManager) {
        cartManager = new CartManager();
    }
    cartManager.addItem(item);
};
// Load cart items on page load
document.addEventListener('DOMContentLoaded', async function() {
    const userId = localStorage.getItem('user_id');

    if (!userId) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }

    const response = await apiCall('/api/cart', 'GET');

    if (response.status === 'success') {
        const cartItems = response.data.items;

        // Display cart items
        const cartContainer = document.getElementById('cart-container');
        cartContainer.innerHTML = '';

        let total = 0;
        cartItems.forEach(item => {
            const itemHTML = `
                <div class="cart-item">
                    <h4>${item.product_name}</h4>
                    <p>Quantity: ${item.quantity}</p>
                    <p>Price: $${item.unit_price}</p>
                    <p>Total: $${item.total_price}</p>
                </div>
            `;
            cartContainer.innerHTML += itemHTML;
            total += item.total_price;
        });

        document.getElementById('cart-total').textContent = `Total: $${total.toFixed(2)}`;
    }
});

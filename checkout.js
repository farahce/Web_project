// Checkout State
let checkoutState = {
    currentStep: 1,
    shipping: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zip: '',
        method: 'standard'
    },
    payment: {
        method: 'card',
        cardName: '',
        cardNumber: '',
        cardExpiry: '',
        cardCVV: ''
    },
    cart: []
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    if (!isLoggedIn()) {
        showToast('Please login to continue checkout', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    await loadCart();
    updateOrderSummary();
    setupEventListeners();
    setupCardFormatting();
    loadUserData();
});

// Load Cart from backend API
async function loadCart() {
    try {
        const response = await apiCall('/api/cart', 'GET');
        
        if (response.status === 'success' && response.data && response.data.items) {
            // Convert backend cart items to checkout format
            checkoutState.cart = response.data.items.map(item => ({
                id: item.product_id,
                name: item.name,
                price: parseFloat(item.price),
                quantity: item.quantity,
                image: item.image_url || 'images/default.png'
            }));

            if (checkoutState.cart.length === 0) {
                showToast('Your cart is empty!', 'warning');
                setTimeout(() => {
                    window.location.href = 'cart.html';
                }, 2000);
            }
        } else {
            showToast('Failed to load cart', 'error');
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        showToast('Error loading cart. Please try again.', 'error');
    }
}

// Load user data to pre-fill shipping form
function loadUserData() {
    const user = getCurrentUser();
    if (user) {
        // Pre-fill email if available
        const emailInput = document.getElementById('shipping-email');
        if (emailInput && user.email) {
            emailInput.value = user.email;
            checkoutState.shipping.email = user.email;
        }
    }
}

// Update Order Summary
function updateOrderSummary() {
    const summaryItems = document.getElementById('summary-items');
    const subtotal = checkoutState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    summaryItems.innerHTML = checkoutState.cart.map(item => `
        <div class="summary-item">
            <span class="summary-item-name">${item.name} x${item.quantity}</span>
            <span class="summary-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    const shippingCost = getShippingCost();
    const tax = subtotal * 0.10;
    const total = subtotal + shippingCost + tax;

    document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('summary-shipping').textContent = `$${shippingCost.toFixed(2)}`;
    document.getElementById('summary-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `$${total.toFixed(2)}`;
}

// Get Shipping Cost
function getShippingCost() {
    const method = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';
    const costs = {
        'standard': 5.00,
        'express': 15.00,
        'overnight': 25.00
    };
    return costs[method] || 5.00;
}

// Setup Event Listeners
function setupEventListeners() {
    // Shipping method change
    document.querySelectorAll('input[name="shipping"]').forEach(radio => {
        radio.addEventListener('change', () => {
            checkoutState.shipping.method = radio.value;
            updateOrderSummary();
        });
    });

    // Payment method change
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            checkoutState.payment.method = e.target.value;
            updatePaymentDisplay();
            updatePaymentMethods();
        });
    });

    // Shipping form inputs
    document.querySelectorAll('#shipping-form input').forEach(input => {
        input.addEventListener('change', (e) => {
            checkoutState.shipping[e.target.name] = e.target.value;
        });
    });

    // Payment form inputs
    document.querySelectorAll('#payment-form input').forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.name === 'card-name') checkoutState.payment.cardName = e.target.value;
            if (e.target.name === 'card-number') checkoutState.payment.cardNumber = e.target.value;
            if (e.target.name === 'card-expiry') checkoutState.payment.cardExpiry = e.target.value;
            if (e.target.name === 'card-cvv') checkoutState.payment.cardCVV = e.target.value;
        });
    });
}

// Setup Card Formatting
function setupCardFormatting() {
    const cardNumber = document.getElementById('card-number');
    const cardExpiry = document.getElementById('card-expiry');
    const cardCVV = document.getElementById('card-cvv');

    if (cardNumber) {
        cardNumber.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '');
            let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formatted;
        });
    }

    if (cardExpiry) {
        cardExpiry.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });
    }

    if (cardCVV) {
        cardCVV.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
        });
    }
}

// Update Payment Display
function updatePaymentDisplay() {
    const cardPayment = document.getElementById('card-payment');
    if (cardPayment) {
        if (checkoutState.payment.method === 'card') {
            cardPayment.style.display = 'block';
        } else {
            cardPayment.style.display = 'none';
        }
    }
}

// Update Payment Methods UI
function updatePaymentMethods() {
    document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('active');
    });

    const activeMethod = document.querySelector(`input[value="${checkoutState.payment.method}"]`)?.closest('.payment-method');
    if (activeMethod) {
        activeMethod.classList.add('active');
    }
}

// Go to Step
function goToStep(step) {
    if (step === 2 && !validateStep(1)) {
        showToast('Please fill in all shipping information', 'error');
        return;
    }

    if (step === 3 && !validateStep(2)) {
        showToast('Please fill in all payment information', 'error');
        return;
    }

    // Hide all steps
    document.querySelectorAll('.checkout-step').forEach(s => {
        s.classList.remove('active');
    });

    document.querySelectorAll('.step').forEach(s => {
        s.classList.remove('active');
    });

    // Show current step
    document.getElementById(`checkout-step-${step}`).classList.add('active');
    document.getElementById(`step-${step}-indicator`).classList.add('active');

    checkoutState.currentStep = step;

    // Update review if going to step 3
    if (step === 3) {
        updateReview();
    }

    // Scroll to top
    document.querySelector('.checkout-forms').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Validate Step
function validateStep(step) {
    if (step === 1) {
        const form = document.getElementById('shipping-form');
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');

        for (let input of inputs) {
            if (!input.value.trim()) {
                return false;
            }
        }
        return true;
    }

    if (step === 2) {
        if (checkoutState.payment.method === 'card') {
            const cardName = document.getElementById('card-name');
            const cardNumber = document.getElementById('card-number');
            const cardExpiry = document.getElementById('card-expiry');
            const cardCVV = document.getElementById('card-cvv');

            if (!cardName.value || !cardNumber.value || !cardExpiry.value || !cardCVV.value) {
                return false;
            }

            // Validate card number (basic)
            if (cardNumber.value.replace(/\s/g, '').length !== 16) {
                return false;
            }
        }
        return true;
    }

    return true;
}

// Update Review
function updateReview() {
    // Shipping review
    const reviewShipping = document.getElementById('review-shipping');
    reviewShipping.innerHTML = `
        <p><strong>${checkoutState.shipping.firstName} ${checkoutState.shipping.lastName}</strong></p>
        <p>${checkoutState.shipping.address}</p>
        <p>${checkoutState.shipping.city}, ${checkoutState.shipping.zip}</p>
        <p>Phone: ${checkoutState.shipping.phone}</p>
        <p>Email: ${checkoutState.shipping.email}</p>
        <p style="margin-top: 10px; color: var(--primary-color); font-weight: 600;">
            ${getShippingMethodName(checkoutState.shipping.method)}
        </p>
    `;

    // Payment review
    const reviewPayment = document.getElementById('review-payment');
    if (checkoutState.payment.method === 'card') {
        const lastFour = checkoutState.payment.cardNumber.slice(-4);
        reviewPayment.innerHTML = `
            <p><strong>Credit Card</strong></p>
            <p>Card ending in ${lastFour}</p>
            <p>Cardholder: ${checkoutState.payment.cardName}</p>
        `;
    } else {
        reviewPayment.innerHTML = `<p><strong>${checkoutState.payment.method.toUpperCase()}</strong></p>`;
    }

    // Items review
    const reviewItems = document.getElementById('review-items');
    reviewItems.innerHTML = checkoutState.cart.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid var(--accent-color);">
            <span>${item.name} x${item.quantity}</span>
            <span style="font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
}

// Get Shipping Method Name
function getShippingMethodName(method) {
    const names = {
        'standard': 'Standard Delivery (3-5 business days) - $5.00',
        'express': 'Express Delivery (1-2 business days) - $15.00',
        'overnight': 'Overnight Delivery - $25.00'
    };
    return names[method] || 'Standard Delivery';
}

// Place Order
async function placeOrder() {
    if (!validateStep(2)) {
        showToast('Please complete all required fields', 'error');
        return;
    }

    if (!isLoggedIn()) {
        showToast('Please login to place an order', 'error');
        window.location.href = 'login.html';
        return;
    }

    // Disable place order button
    const placeOrderBtn = document.querySelector('.place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = 'Processing...';
    }

    try {
        // Prepare order data for backend
        const orderData = {
            shipping_address: checkoutState.shipping.address,
            shipping_city: checkoutState.shipping.city,
            shipping_country: checkoutState.shipping.country || 'USA',
            shipping_postal_code: checkoutState.shipping.zip,
            payment_method: checkoutState.payment.method,
            notes: `Shipping: ${getShippingMethodName(checkoutState.shipping.method)}`
        };

        // Create order via API
        const response = await apiCall('/api/orders', 'POST', orderData);

        if (response.status === 'success' && response.data) {
            const order = {
                id: response.data.order_number,
                order_id: response.data.order_id,
                date: new Date().toISOString(),
                shipping: checkoutState.shipping,
                payment: checkoutState.payment,
                items: checkoutState.cart,
                total: parseFloat(response.data.final_amount)
            };

            // 📱 SEND SMS NOTIFICATION (if available)
            if (checkoutState.shipping.phone && typeof smsNotifications !== 'undefined') {
                smsNotifications.sendOrderConfirmationSMS(checkoutState.shipping.phone, order.id);
            }

            // Show success modal
            showSuccessModal(order);
        } else {
            showToast(response.message || 'Failed to place order. Please try again.', 'error');
            if (placeOrderBtn) {
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = 'Place Order';
            }
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showToast('An error occurred. Please try again.', 'error');
        if (placeOrderBtn) {
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Place Order';
        }
    }
}

// Generate Order Number
function generateOrderNumber() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Calculate Total
function calculateTotal() {
    const subtotal = checkoutState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = getShippingCost();
    const tax = subtotal * 0.10;
    return subtotal + shipping + tax;
}

// Show Success Modal
function showSuccessModal(order) {
    document.getElementById('order-number').textContent = order.id;
    document.getElementById('order-email').textContent = order.shipping.email;

    const modal = document.getElementById('success-modal');
    modal.classList.add('show');

    // Scroll to modal
    setTimeout(() => {
        modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize payment methods UI
document.addEventListener('DOMContentLoaded', () => {
    updatePaymentMethods();
    updatePaymentDisplay();
});
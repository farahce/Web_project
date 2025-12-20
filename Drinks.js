// Drink Builder State
let drinkState = {
    base: 'espresso',
    milk: 'whole',
    flavor: 'none',
    temp: 'hot',
    extras: [],
    prices: {
        base: 4.50,
        milk: 0,
        flavor: 0,
        extras: 0
    }
};

// Color mapping for different bases
const baseColors = {
    espresso: { dark: '#6F4E37', light: '#5A3D2A' },
    americano: { dark: '#8B6F47', light: '#7A5F3A' },
    latte: { dark: '#A0826D', light: '#8B7355' }
};

// Milk colors
const milkColors = {
    whole: '#D4A574',
    oat: '#E8C9A0',
    almond: '#DEB887',
    coconut: '#F0E68C'
};

// Flavor names
const flavorNames = {
    none: '',
    vanilla: 'Vanilla',
    caramel: 'Caramel',
    hazelnut: 'Hazelnut',
    chocolate: 'Chocolate'
};

// Flavor colors
const flavorColors = {
    none: '',
    vanilla: '#F5DEB3',
    caramel: '#CD853F',
    hazelnut: '#8B4513',
    chocolate: '#3B2F2F'
};

// Extra names
const extraNames = {
    whipped: 'Whipped Cream',
    cinnamon: 'Cinnamon Dust',
    honey: 'Honey Drizzle'
};

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function () {
    setupBaseButtons();
    setupMilkButtons();
    setupFlavorButtons();
    setupTempButtons();
    setupExtraCheckboxes();
    setupPresetCards();
    setupAddToBasketButton();
    updateCup();
});

// Base Selection
function setupBaseButtons() {
    document.querySelectorAll('[data-base]').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('[data-base]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            drinkState.base = this.dataset.base;
            updateCup();
        });
    });
}

// Milk Selection
function setupMilkButtons() {
    document.querySelectorAll('[data-milk]').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('[data-milk]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            drinkState.milk = this.dataset.milk;
            drinkState.prices.milk = parseFloat(this.dataset.price);
            updateCup();
            updatePrice();
        });
    });
}

// Flavor Selection
function setupFlavorButtons() {
    document.querySelectorAll('[data-flavor]').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('[data-flavor]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            drinkState.flavor = this.dataset.flavor;
            drinkState.prices.flavor = parseFloat(this.dataset.price);
            updateCup();
            updatePrice();
        });
    });
}

// Temperature Selection
function setupTempButtons() {
    document.querySelectorAll('[data-temp]').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('[data-temp]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            drinkState.temp = this.dataset.temp;
            updateCup();
        });
    });
}

// Extras (Checkboxes)
function setupExtraCheckboxes() {
    document.querySelectorAll('.extra-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                drinkState.extras.push(this.dataset.extra);
                drinkState.prices.extras += parseFloat(this.dataset.price);
            } else {
                drinkState.extras = drinkState.extras.filter(e => e !== this.dataset.extra);
                drinkState.prices.extras -= parseFloat(this.dataset.price);
            }
            updateCup();
            updatePrice();
        });
    });
}

// Update Cup Visualization with Layers
function updateCup() {
    const cupLayers = document.getElementById('cupLayers');
    const layerBase = document.getElementById('layerBase');
    const layerMilk = document.getElementById('layerMilk');
    const layerFlavor = document.getElementById('layerFlavor');

    const baseDetail = document.getElementById('baseDetail');
    const milkDetail = document.getElementById('milkDetail');
    const flavorDetail = document.getElementById('flavorDetail');
    const tempDetail = document.getElementById('tempDetail');
    const extrasDetail = document.getElementById('extrasDetail');
    const steam = document.getElementById('steam');

    // Update base layer color
    const baseColor = baseColors[drinkState.base];
    layerBase.style.background = `linear-gradient(135deg, ${baseColor.dark}, ${baseColor.light})`;
    layerBase.style.height = '40%';

    // Update milk layer
    let milkHeight = 0;
    if (drinkState.milk !== 'none') {
        milkHeight = 35;
    }
    layerMilk.style.height = milkHeight + '%';
    if (milkHeight > 0) {
        const milkColor = milkColors[drinkState.milk];
        layerMilk.style.background = `linear-gradient(135deg, ${milkColor}, ${adjustBrightness(milkColor, -15)})`;
    }

    // Update flavor layer
    let flavorHeight = 0;
    if (drinkState.flavor !== 'none') {
        flavorHeight = 15;
    }
    layerFlavor.style.height = flavorHeight + '%';
    if (flavorHeight > 0) {
        const flavorColor = flavorColors[drinkState.flavor];
        layerFlavor.style.background = `linear-gradient(135deg, ${flavorColor}, ${adjustBrightness(flavorColor, -20)})`;
    }

    // Handle whipped cream
    if (drinkState.extras.includes('whipped')) {
        cupLayers.classList.add('with-whipped');
    } else {
        cupLayers.classList.remove('with-whipped');
    }

    // Handle iced drinks
    if (drinkState.temp === 'iced') {
        layerBase.style.opacity = '0.8';
        layerMilk.style.opacity = '0.7';
        steam.classList.remove('active');
    } else {
        layerBase.style.opacity = '1';
        layerMilk.style.opacity = '0.9';
        steam.classList.add('active');
    }

    // Update details text
    baseDetail.textContent = drinkState.base.charAt(0).toUpperCase() + drinkState.base.slice(1);
    milkDetail.textContent = drinkState.milk.charAt(0).toUpperCase() + drinkState.milk.slice(1) + ' Milk';

    if (drinkState.flavor !== 'none') {
        flavorDetail.textContent = flavorNames[drinkState.flavor];
        flavorDetail.style.display = 'block';
    } else {
        flavorDetail.style.display = 'none';
    }

    tempDetail.textContent = drinkState.temp === 'hot' ? 'Hot ☕' : 'Iced 🧊';

    if (drinkState.extras.length > 0) {
        const extrasList = drinkState.extras.map(e => extraNames[e]).join(', ');
        extrasDetail.textContent = '+ ' + extrasList;
        extrasDetail.style.display = 'block';
    } else {
        extrasDetail.style.display = 'none';
    }

    // Trigger animation
    animateCupUpdate();
}

// Animate cup update
function animateCupUpdate() {
    const layerBase = document.getElementById('layerBase');
    layerBase.style.animation = 'none';
    setTimeout(() => {
        layerBase.style.animation = 'cupAppear 0.6s ease-out';
    }, 10);
}

// Update Price
function updatePrice() {
    const total = drinkState.prices.base +
        drinkState.prices.milk +
        drinkState.prices.flavor +
        drinkState.prices.extras;
    document.getElementById('totalPrice').textContent = '$' + total.toFixed(2);
}

// Adjust brightness helper
function adjustBrightness(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// Preset Cards
// Map presets to Database Products (closest match)
const presetToProduct = {
    'iced-latte': 'Iced Coffee',
    'caramel-macchiato': 'Vanilla Latte',
    'mocha': 'Hot Chocolate', // Fallback
    'cappuccino': 'Cappuccino',
    'americano': 'Espresso Shot',
    'hot-chocolate': 'Hot Chocolate'
};

function setupPresetCards() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();

            // Check login first
            if (!isLoggedIn()) {
                alert('Please login to add items');
                window.location.href = 'login.html';
                return;
            }

            const card = this.closest('.preset-card');
            const preset = card.dataset.preset;

            // Visual feedback
            const originalText = this.textContent;
            this.textContent = 'Adding...';
            this.disabled = true;

            try {
                // 1. Get Product ID
                const response = await apiCall('/api/products?category=drinks', 'GET');
                let productId = null;

                if (response.status === 'success' && response.data.products) {
                    const targetName = presetToProduct[preset];
                    if (targetName) {
                        const match = response.data.products.find(p => p.name.includes(targetName));
                        if (match) productId = match.id;
                    }
                }

                if (!productId) {
                    alert('Product currently unavailable');
                    this.textContent = originalText;
                    this.disabled = false;
                    return;
                }

                // 2. Add to Cart
                const userId = localStorage.getItem('user_id');
                const cartData = { product_id: productId, quantity: 1 };
                if (userId) cartData.user_id = parseInt(userId);

                const cartRes = await apiCall('/api/cart', 'POST', cartData);

                if (cartRes.status === 'success') {
                    this.textContent = '✓ Added!';
                    this.style.background = '#4CAF50';

                    // Also update the visual builder
                    applyPreset(preset);

                    setTimeout(() => {
                        this.textContent = originalText;
                        this.style.background = '';
                        this.disabled = false;
                    }, 2000);
                } else {
                    alert(cartRes.message || 'Failed to add');
                    this.textContent = originalText;
                    this.disabled = false;
                }

            } catch (err) {
                console.error('Quick Add Error:', err);
                alert('Connection error');
                this.textContent = originalText;
                this.disabled = false;
            }
        });
    });
}

// Apply Preset
function applyPreset(preset) {
    const presets = {
        'iced-latte': {
            base: 'latte',
            milk: 'whole',
            flavor: 'none',
            temp: 'iced',
            extras: []
        },
        'caramel-macchiato': {
            base: 'latte',
            milk: 'whole',
            flavor: 'caramel',
            temp: 'iced',
            extras: []
        },
        'mocha': {
            base: 'espresso',
            milk: 'whole',
            flavor: 'chocolate',
            temp: 'iced',
            extras: []
        },
        'cappuccino': {
            base: 'latte',
            milk: 'whole',
            flavor: 'none',
            temp: 'hot',
            extras: ['whipped']
        },
        'americano': {
            base: 'americano',
            milk: 'whole',
            flavor: 'none',
            temp: 'hot',
            extras: []
        },
        'hot-chocolate': {
            base: 'espresso',
            milk: 'whole',
            flavor: 'chocolate',
            temp: 'hot',
            extras: ['whipped']
        }
    };

    const config = presets[preset];
    if (!config) return;

    // Reset all selections
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.extra-checkbox').forEach(cb => {
        cb.checked = false;
    });

    // Apply preset
    drinkState.base = config.base;
    drinkState.milk = config.milk;
    drinkState.flavor = config.flavor;
    drinkState.temp = config.temp;
    drinkState.extras = config.extras;

    // Update buttons
    document.querySelector(`[data-base="${config.base}"]`).classList.add('active');
    document.querySelector(`[data-milk="${config.milk}"]`).classList.add('active');
    document.querySelector(`[data-flavor="${config.flavor}"]`).classList.add('active');
    document.querySelector(`[data-temp="${config.temp}"]`).classList.add('active');

    config.extras.forEach(extra => {
        document.querySelector(`[data-extra="${extra}"]`).checked = true;
    });

    // Recalculate prices
    drinkState.prices.milk = 0;
    drinkState.prices.flavor = 0;
    drinkState.prices.extras = 0;

    // Update cup and price
    updateCup();
    updatePrice();

    // Scroll to customizer
    document.querySelector('.mixologist-container').scrollIntoView({ behavior: 'smooth' });
}

// Add to Basket
// Product Mapping for Drinks
const drinkBaseToProductMap = {
    'espresso': 'Espresso',
    'americano': 'Americano',
    'latte': 'Latte',
    'cappuccino': 'Cappuccino',
    'mocha': 'Mocha',
    'hot-chocolate': 'Hot Chocolate'
};

// Add to Basket with Backend Integration
function setupAddToBasketButton() {
    const btn = document.querySelector('.add-to-basket-btn');

    btn.addEventListener('click', async function () {
        if (!isLoggedIn()) {
            // Show custom notification style from Drinks.js isn't defined globally, 
            // so we'll use a simple alert or reuse the existing showNotification if available?
            // Drinks.js actually doesn't have showNotification defined in the file.
            // But we can check if it exists or use alert.
            alert('Please login to add items to cart');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        const originalText = btn.textContent;
        btn.textContent = 'Adding...';
        btn.style.opacity = '0.7';
        btn.disabled = true;

        try {
            // 1. Identify Product ID based on Base
            // We need to fetch products first or finding them on the fly
            const response = await apiCall('/api/products?category=drinks', 'GET');
            let productId = null;

            if (response.status === 'success' && response.data.products) {
                const products = response.data.products;
                const targetName = drinkBaseToProductMap[drinkState.base] || 'Coffee'; // Default fallback

                const match = products.find(p => p.name.toLowerCase().includes(targetName.toLowerCase()));
                if (match) {
                    productId = match.id;
                }
            }

            if (!productId) {
                console.error('Product not found for base:', drinkState.base);
                alert('Error: Product unavailable');
                return;
            }

            // 2. Prepare Cart Data
            // Note: Current backend cart only supports product_id and quantity.
            // Customizations (milk, flavor) are visual-only for now as per plan.
            const userId = localStorage.getItem('user_id');
            const cartData = {
                product_id: productId,
                quantity: 1
            };
            if (userId) cartData.user_id = parseInt(userId);

            // 3. Call API
            const cartResponse = await apiCall('/api/cart', 'POST', cartData);

            if (cartResponse.status === 'success') {
                // Success Animation
                btn.textContent = '✓ Added to Basket!';
                btn.style.background = '#4CAF50';
                btn.style.opacity = '1';

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 2000);

                console.log(`Added to basket: ${drinkState.base} (ID: ${productId})`);
            } else {
                alert(cartResponse.message || 'Failed to add to basket');
                btn.textContent = originalText;
                btn.style.opacity = '1';
                btn.disabled = false;
            }

        } catch (error) {
            console.error('Error adding drink to cart:', error);
            alert('Network error. Please try again.');
            btn.textContent = originalText;
            btn.style.opacity = '1';
            btn.disabled = false;
        }
    });
}

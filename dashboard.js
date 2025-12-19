// Dashboard State
let dashboardState = {
    currentTab: 'overview',
    user: null,
    orders: [],
    rewards: 0,
    filterType: 'all'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load user data first
    loadUserData();

    // Initialize auth UI
    initializeAuth();

    // Setup logout button
    setupLogoutButton('.logout-btn');

    // Setup profile button
    setupProfileButton();

    loadOrders();
    calculateRewards();
    updateDashboard();
    setupEventListeners();
});

// Load User Data
function loadUserData() {
    // Try to get user from localStorage (from login system)
    let userData = localStorage.getItem('user');

    // If not found, try the old key (for backward compatibility)
    if (!userData) {
        userData = localStorage.getItem('dafah_user');
    }

    if (userData) {
        dashboardState.user = JSON.parse(userData);

        // Display user info
        const displayName = dashboardState.user.username || dashboardState.user.firstName + ' ' + dashboardState.user.lastName || 'User';
        document.getElementById('user-name').textContent = displayName;
        document.getElementById('user-email').textContent = dashboardState.user.email;

        // Populate profile form
        document.getElementById('profile-first-name').value = dashboardState.user.firstName || '';
        document.getElementById('profile-last-name').value = dashboardState.user.lastName || '';
        document.getElementById('profile-email').value = dashboardState.user.email || '';
        document.getElementById('profile-phone').value = dashboardState.user.phone || '';
        document.getElementById('profile-address').value = dashboardState.user.address || '';
        document.getElementById('profile-city').value = dashboardState.user.city || '';
        document.getElementById('profile-zip').value = dashboardState.user.zip || '';
    } else {
        // No user data found - redirect to login
        window.location.href = 'login.html';
    }
}

// Load Orders
function loadOrders() {
    const orders = localStorage.getItem('dafah_orders');
    dashboardState.orders = orders ? JSON.parse(orders) : [];
}

// Calculate Rewards
function calculateRewards() {
    let totalSpent = 0;
    dashboardState.orders.forEach(order => {
        totalSpent += order.total;
    });

    // 1 point per $1 spent
    dashboardState.rewards = Math.floor(totalSpent);

    document.getElementById('reward-points').textContent = dashboardState.rewards;
    document.getElementById('rewards-points').textContent = dashboardState.rewards;

    // Update progress bar
    const progress = (dashboardState.rewards % 100) / 100 * 100;
    document.querySelector('.progress-bar').style.width = progress + '%';
    document.getElementById('progress-text').textContent = `${dashboardState.rewards % 100} / 100 points to next reward`;
}

// Update Dashboard
function updateDashboard() {
    // Calculate stats
    const totalOrders = dashboardState.orders.length;
    const totalSpent = dashboardState.orders.reduce((sum, order) => sum + order.total, 0);
    const deliveredOrders = dashboardState.orders.filter(o => o.status === 'delivered').length;

    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-spent').textContent = `$${totalSpent.toFixed(2)}`;
    document.getElementById('total-deliveries').textContent = deliveredOrders;

    // Recent orders
    const recentOrdersList = document.getElementById('recent-orders-list');
    const recentOrders = dashboardState.orders.slice(-3).reverse();

    if (recentOrders.length === 0) {
        recentOrdersList.innerHTML = '<p style="text-align: center; color: #999;">No orders yet</p>';
    } else {
        recentOrdersList.innerHTML = recentOrders.map(order => `
            <div class="order-item">
                <div class="order-info">
                    <h3>${order.id}</h3>
                    <p>${new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div class="order-status ${getStatusClass(order.status || 'pending')}">
                    ${order.status || 'Pending'}
                </div>
                <div style="text-align: right;">
                    <p style="font-weight: 600; color: var(--primary-color);">$${order.total.toFixed(2)}</p>
                </div>
            </div>
        `).join('');
    }

    // All orders
    displayOrders(dashboardState.filterType);
}

// Display Orders
function displayOrders(filter) {
    const ordersContainer = document.getElementById('orders-container');
    let filteredOrders = dashboardState.orders;

    if (filter !== 'all') {
        filteredOrders = dashboardState.orders.filter(o => (o.status || 'pending') === filter);
    }

    if (filteredOrders.length === 0) {
        ordersContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No orders found</p>';
        return;
    }

    ordersContainer.innerHTML = filteredOrders.reverse().map((order, index) => `
        <div class="order-card" style="animation-delay: ${index * 0.1}s">
            <div class="order-header">
                <div>
                    <div class="order-number">${order.id}</div>
                    <div class="order-date">${new Date(order.date).toLocaleDateString()}</div>
                </div>
                <div class="order-status ${getStatusClass(order.status || 'pending')}">
                    ${order.status || 'Pending'}
                </div>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item-detail">
                        <span>${item.name} x${item.quantity}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-footer">
                <div>
                    <p style="font-size: 12px; color: #999; margin-bottom: 5px;">Shipping to:</p>
                    <p style="font-size: 13px; color: var(--secondary-color);">${order.shipping.address}, ${order.shipping.city}</p>
                </div>
                <div class="order-total">$${order.total.toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

// Get Status Class
function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return classes[status] || 'status-pending';
}

// Setup Event Listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.getAttribute('onclick').match(/'([^']+)'/)[1];
            switchTab(tab);
        });
    });
}

// Switch Tab
function switchTab(tab) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(t => {
        t.classList.remove('active');
    });

    // Remove active from nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tab).classList.add('active');

    // Add active to nav item
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');

    dashboardState.currentTab = tab;
}

// Filter Orders
function filterOrders(filter) {
    dashboardState.filterType = filter;

    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    displayOrders(filter);
}

// Save Profile
function saveProfile() {
    const userData = {
        ...dashboardState.user,
        firstName: document.getElementById('profile-first-name').value,
        lastName: document.getElementById('profile-last-name').value,
        email: document.getElementById('profile-email').value,
        phone: document.getElementById('profile-phone').value,
        address: document.getElementById('profile-address').value,
        city: document.getElementById('profile-city').value,
        zip: document.getElementById('profile-zip').value
    };

    localStorage.setItem('dafah_user', JSON.stringify(userData));
    dashboardState.user = userData;

    showToast('Profile updated successfully!', 'success');
}

// Redeem Reward
function redeemReward(points, rewardName) {
    if (dashboardState.rewards < points) {
        showToast('Not enough points to redeem this reward', 'warning');
        return;
    }

    dashboardState.rewards -= points;
    localStorage.setItem('dafah_rewards', dashboardState.rewards.toString());

    document.getElementById('reward-points').textContent = dashboardState.rewards;
    document.getElementById('rewards-points').textContent = dashboardState.rewards;

    // Update progress bar
    const progress = (dashboardState.rewards % 100) / 100 * 100;
    document.querySelector('.progress-bar').style.width = progress + '%';
    document.getElementById('progress-text').textContent = `${dashboardState.rewards % 100} / 100 points to next reward`;

    showToast(`${rewardName} redeemed! Check your email for details.`, 'success');
}

// Change Password
function changePassword() {
    const newPassword = prompt('Enter your new password:');
    if (newPassword && newPassword.length >= 8) {
        dashboardState.user.password = newPassword;
        localStorage.setItem('dafah_user', JSON.stringify(dashboardState.user));
        showToast('Password changed successfully!', 'success');
    } else if (newPassword) {
        showToast('Password must be at least 8 characters', 'error');
    }
}

// Delete Account
function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        localStorage.removeItem('dafah_user');
        localStorage.removeItem('dafah_cart');
        localStorage.removeItem('dafah_orders');
        localStorage.removeItem('dafah_rewards');

        showToast('Account deleted. Redirecting...', 'warning');
        setTimeout(() => {
            window.location.href = 'Home_page.html';
        }, 2000);
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('dafah_user');
        window.location.href = 'Home_page.html';
    }
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

// Initialize on load
window.addEventListener('load', () => {
    updateDashboard();
});

// ============================================
// PROFILE BUTTON SETUP
// ============================================
function setupProfileButton() {
    // Find profile button/link in dashboard page
    const profileBtn = document.querySelector('[data-profile-btn]') ||
        document.querySelector('.profile-btn') ||
        document.querySelector('.user-profile') ||
        document.querySelector('.dashboard-profile');

    if (profileBtn) {
        profileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Navigate to profile section
            switchTab('profile');
        });
    }
}

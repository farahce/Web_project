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
    // Check login first
    if (!localStorage.getItem('user_id')) {
        window.location.href = 'login.html';
        return;
    }

    // Load data from Backend
    loadDashboardData();

    // Setup UI
    initializeAuth();
    setupLogoutButton('.logout-btn');
    setupProfileButton();
    setupEventListeners();
});

// Load Dashboard Data (User + Orders)
async function loadDashboardData() {
    try {
        const response = await apiCall('/api/dashboard', 'GET');

        if (response.status === 'success') {
            const data = response.data;
            dashboardState.user = data.user;
            dashboardState.orders = data.orders;
            dashboardState.rewards = parseInt(data.stats.points) || 0;

            // Update UI
            updateUserInfo();
            updateStats(data.stats);
            updateDashboard(); // Recent orders logic
            calculateRewards(); // Progress bar logic
        } else {
            console.error('Failed to load dashboard:', response.message);
            // Optionally redirect to login if unauthorized
            if (response.message.includes('Unauthorized')) {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('Network error loading dashboard:', error);
    }
}

function updateUserInfo() {
    if (!dashboardState.user) return;

    // Display user info
    const displayName = dashboardState.user.username || 'User';
    document.getElementById('user-name').textContent = displayName;
    document.getElementById('user-email').textContent = dashboardState.user.email;

    // Populate profile form
    document.getElementById('profile-first-name').value = dashboardState.user.username || ''; // Map username to firstname for now
    document.getElementById('profile-email').value = dashboardState.user.email || '';
    document.getElementById('profile-phone').value = dashboardState.user.phone || '';
    document.getElementById('profile-address').value = dashboardState.user.address || '';
    document.getElementById('profile-city').value = dashboardState.user.city || '';
    document.getElementById('profile-zip').value = dashboardState.user.zip || '';
}

function updateStats(stats) {
    document.getElementById('total-orders').textContent = stats.total_orders;
    document.getElementById('total-spent').textContent = `$${parseFloat(stats.total_spent).toFixed(2)}`;
    // Calculate delivered manually or from backend if provided. 
    // Backend stats didn't explicitly return delivered count in 'stats' array (only in orders list).
    // So we can calculate it from dashboardState.orders
    const deliveredOrders = dashboardState.orders.filter(o => o.status === 'delivered').length;
    document.getElementById('total-deliveries').textContent = deliveredOrders;
}

// Update Dashboard (Visuals)
function updateDashboard() {
    // Recent orders
    const recentOrdersList = document.getElementById('recent-orders-list');
    const recentOrders = dashboardState.orders.slice(0, 3); // Already sorted DESC from backend

    if (recentOrders.length === 0) {
        recentOrdersList.innerHTML = '<p style="text-align: center; color: #999;">No orders yet</p>';
    } else {
        recentOrdersList.innerHTML = recentOrders.map(order => `
            <div class="order-item">
                <div class="order-info">
                    <h3>${order.order_number || order.id}</h3>
                    <p>${new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div class="order-status ${getStatusClass(order.status || 'pending')}">
                    ${order.status || 'Pending'}
                </div>
                <div style="text-align: right;">
                    <p style="font-weight: 600; color: var(--primary-color);">$${parseFloat(order.total).toFixed(2)}</p>
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

    ordersContainer.innerHTML = filteredOrders.map((order, index) => `
        <div class="order-card" style="animation-delay: ${index * 0.1}s">
            <div class="order-header">
                <div>
                    <div class="order-number">${order.order_number || order.id}</div>
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
                        <span>$${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-footer">
                <div>
                    <p style="font-size: 12px; color: #999; margin-bottom: 5px;">Shipping to:</p>
                    <p style="font-size: 13px; color: var(--secondary-color);">${order.shipping.address || 'N/A'}, ${order.shipping.city || ''}</p>
                </div>
                <div class="order-total">$${parseFloat(order.total).toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

// Calculate Rewards / Progress Bar
function calculateRewards() {
    // Points are now coming from DB, not calculated from total spent locally
    // If you want to show "Points Earned" vs "Current Balance", that would be different.
    // Here we show Current Point Balance.

    document.getElementById('reward-points').textContent = dashboardState.rewards;
    document.getElementById('rewards-points').textContent = dashboardState.rewards;

    // Update progress bar (assuming 100 points is the milestone)
    const progress = (dashboardState.rewards % 100) / 100 * 100;
    document.querySelector('.progress-bar').style.width = progress + '%';
    document.getElementById('progress-text').textContent = `${dashboardState.rewards % 100} / 100 points to next reward`;
}

// Get Status Class
function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled',
        'shipped': 'status-delivered', // reusing style
        'processing': 'status-pending'
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
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const targetTab = document.getElementById(tab);
    if (targetTab) targetTab.classList.add('active');

    const navItem = document.querySelector(`[onclick="switchTab('${tab}')"]`);
    if (navItem) navItem.classList.add('active');

    dashboardState.currentTab = tab;
}

// Filter Orders
function filterOrders(filter) {
    dashboardState.filterType = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    displayOrders(filter);
}

// Save Profile
async function saveProfile() {
    const profileData = {
        action: 'update_profile',
        phone: document.getElementById('profile-phone').value,
        address: document.getElementById('profile-address').value,
        city: document.getElementById('profile-city').value,
        zip: document.getElementById('profile-zip').value
    };

    try {
        const response = await apiCall('/api/dashboard', 'POST', profileData);
        if (response.status === 'success') {
            showToast('Profile updated successfully!', 'success');
            // Update local state
            dashboardState.user = { ...dashboardState.user, ...profileData };
        } else {
            showToast(response.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    }
}

// Redeem Reward
async function redeemReward(points, rewardName) {
    if (dashboardState.rewards < points) {
        showToast('Not enough points to redeem this reward', 'warning');
        return;
    }

    if (!confirm(`Redeem ${rewardName} for ${points} points?`)) return;

    try {
        const response = await apiCall('/api/dashboard', 'POST', {
            action: 'redeem',
            points: points
        });

        if (response.status === 'success') {
            const newBalance = response.data.new_balance;
            dashboardState.rewards = newBalance;
            calculateRewards();
            showToast(`${rewardName} redeemed! Check your email for details.`, 'success');
        } else {
            showToast(response.message || 'Redemption failed', 'error');
        }
    } catch (error) {
        showToast('Network error processing redemption', 'error');
    }
}

// Change Password - Placeholder as backend support for this wasn't explicitly requested/checked
function changePassword() {
    alert("Password change functionality coming soon!");
}

// Delete Account - Placeholder
function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        alert("Please contact support to delete your account.");
    }
}

// Logout
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        await apiCall('/api/logout', 'POST');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        localStorage.removeItem('dafah_user'); // legacy
        window.location.href = 'login.html';
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
// End of file

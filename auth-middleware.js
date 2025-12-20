/**
 * Authentication & Authorization Middleware
 * Provides role-based access control for protected pages
 */

/**
 * Check if user is logged in
 * @returns {boolean} True if user is logged in
 */
function isUserLoggedIn() {
    const user = localStorage.getItem('user');
    const userId = localStorage.getItem('user_id');
    return user !== null && userId !== null;
}

/**
 * Get current user data
 * @returns {Object|null} User object or null if not logged in
 */
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

/**
 * Get current user role
 * @returns {string|null} User role ('admin' or 'user') or null if not logged in
 */
function getUserRole() {
    return localStorage.getItem('user_role');
}

/**
 * Check if user is admin
 * @returns {boolean} True if user is admin
 */
function isAdmin() {
    return getUserRole() === 'admin';
}

/**
 * Check if user is regular user
 * @returns {boolean} True if user is regular user
 */
function isRegularUser() {
    return getUserRole() === 'user';
}

/**
 * Require login - redirect to login page if not logged in
 * @param {string} redirectUrl - URL to redirect to after login (optional)
 */
function requireLogin(redirectUrl = null) {
    if (!isUserLoggedIn()) {
        // Store the redirect URL if provided
        if (redirectUrl) {
            sessionStorage.setItem('redirectAfterLogin', redirectUrl);
        }
        window.location.href = 'login.html';
    }
}

/**
 * Require admin role - redirect to home if not admin
 */
function requireAdmin() {
    if (!isUserLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    if (!isAdmin()) {  // ← Checks if user_role === 'admin'
        showNotification('Access denied. Admin privileges required.', 'error');
        window.location.href = 'Home_page.html';
    }
}

/**
 * Require user role - redirect to login if not user
 */
function requireUser() {
    if (!isUserLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    if (!isRegularUser()) {
        showNotification('Access denied. User privileges required.', 'error');
        window.location.href = 'Home_page.html';
    }
}

/**
 * Logout user and clear session
 */
function logoutUser() {
    // Clear localStorage
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user');
    localStorage.removeItem('dafah_user');
    localStorage.removeItem('dafah_orders');

    // Clear sessionStorage
    sessionStorage.clear();

    // Redirect to login
    window.location.href = 'login.html';
}

/**
 * Update user profile button based on role
 * Shows appropriate dashboard link based on user role
 */
function updateProfileButton() {
    const user = getCurrentUser();
    const role = getUserRole();

    if (!user) return;

    // Find profile button/link
    const profileBtn = document.querySelector('[data-profile-btn]') ||
        document.querySelector('.profile-btn') ||
        document.querySelector('.user-profile');

    if (profileBtn) {
        // Add click handler for profile button
        profileBtn.addEventListener('click', function(e) {
            e.preventDefault();

            if (role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }
}

/**
 * Initialize authentication on page load
 * Call this in DOMContentLoaded event
 */
function initializeAuth() {
    const user = getCurrentUser();
    const role = getUserRole();

    if (user) {
        // Update UI with user info
        const userNameElements = document.querySelectorAll('[data-user-name]');
        userNameElements.forEach(el => {
            el.textContent = user.username;
        });

        const userEmailElements = document.querySelectorAll('[data-user-email]');
        userEmailElements.forEach(el => {
            el.textContent = user.email;
        });

        const userRoleElements = document.querySelectorAll('[data-user-role]');
        userRoleElements.forEach(el => {
            el.textContent = role === 'admin' ? 'Administrator' : 'User';
        });

        // Update profile button
        updateProfileButton();
    }
}

/**
 * Setup logout button
 * Call this to attach logout functionality to a button
 * @param {string} selector - CSS selector for logout button
 */
function setupLogoutButton(selector = '.logout-btn') {
    const logoutBtn = document.querySelector(selector);
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logoutUser();
            }
        });
    }
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

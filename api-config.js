/**
 * API Configuration and Helper Functions
 * This file contains the API base URL and helper functions for making API calls
 */

// API Base URL - Change this if your backend is on a different server
const API_BASE_URL = 'http://localhost/Webproj/backend/public/index.php';

/**
 * Make an API call to the backend
 * @param {string} endpoint - The API endpoint (e.g., '/api/login')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} data - Data to send in the request body (for POST/PUT)
 * @returns {Promise<object>} - The API response
 */
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    // Add request body if data is provided
    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        return {
            status: 'error',
            message: 'Network error. Please try again.'
        };
    }
}

/**
 * Check if user is logged in
 * @returns {boolean} - True if user is logged in
 */
function isLoggedIn() {
    return localStorage.getItem('user_id') !== null;
}

/**
 * Get current logged-in user
 * @returns {object} - User object or null
 */
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    window.location.href = 'login.html';
}

/**
 * Redirect to login if not logged in
 */
function requireLogin() {
    if (!isLoggedIn()) {
        alert('Please login first');
        window.location.href = 'login.html';
    }
}

/**
 * Format price to currency
 * @param {number} price - Price to format
 * @returns {string} - Formatted price
 */
function formatPrice(price) {
    return '$' + parseFloat(price).toFixed(2);
}

/**
 * Show notification message
 * @param {string} message - Message to show
 * @param {string} type - Type of notification (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 4px;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Add animation styles
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('API Config loaded. API Base URL:', API_BASE_URL);
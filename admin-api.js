/**
 * Admin API Functions
 * Handles all admin-specific API calls
 */

// ============================================
// ADMIN PRODUCTS API
// ============================================

/**
 * Get all products (admin view)
 */
async function adminGetProducts(category = null, search = null, limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    params.append('limit', limit);
    params.append('offset', offset);

    return await apiCall(`/api/admin/products?${params.toString()}`, 'GET');
}

/**
 * Get specific product (admin view)
 */
async function adminGetProduct(productId) {
    return await apiCall(`/api/admin/products?id=${productId}`, 'GET');
}

/**
 * Create new product
 */
async function adminCreateProduct(productData) {
    // Convert numeric fields
    const data = {
        ...productData,
        price: parseFloat(productData.price),
        stock_quantity: parseInt(productData.stock_quantity),
        is_available: parseInt(productData.is_available || 1)
    };
    return await apiCall('/api/admin/products', 'POST', data);
}

/**
 * Update product
 */
async function adminUpdateProduct(productId, productData) {
    // Convert numeric fields
    const data = {
        id: productId,
        ...productData,
        price: parseFloat(productData.price),
        stock_quantity: parseInt(productData.stock_quantity),
        is_available: parseInt(productData.is_available || 1)
    };
    return await apiCall('/api/admin/products', 'PUT', data);
}

/**
 * Delete product
 */
async function adminDeleteProduct(productId) {
    return await apiCall('/api/admin/products', 'DELETE', { id: productId });
}

// ============================================
// ADMIN ORDERS API
// ============================================

/**
 * Get all orders (admin view)
 */
async function adminGetOrders(status = null, limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit);
    params.append('offset', offset);

    return await apiCall(`/api/admin/orders?${params.toString()}`, 'GET');
}

/**
 * Get specific order (admin view)
 */
async function adminGetOrder(orderId) {
    return await apiCall(`/api/admin/orders?id=${orderId}`, 'GET');
}

/**
 * Update order status
 */
async function adminUpdateOrderStatus(orderId, status) {
    return await apiCall('/api/admin/orders', 'PUT', {
        id: orderId,
        status: status
    });
}

// ============================================
// ADMIN CUSTOMERS API
// ============================================

/**
 * Get all customers (admin view)
 */
async function adminGetCustomers(search = null, limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit);
    params.append('offset', offset);

    return await apiCall(`/api/admin/customers?${params.toString()}`, 'GET');
}

/**
 * Get specific customer (admin view)
 */
async function adminGetCustomer(customerId) {
    return await apiCall(`/api/admin/customers?id=${customerId}`, 'GET');
}

// ============================================
// ADMIN DASHBOARD API
// ============================================

/**
 * Get dashboard statistics
 */
async function adminGetDashboard() {
    return await apiCall('/api/admin/dashboard', 'GET');
}

// ============================================
// ADMIN ANALYTICS API
// ============================================

/**
 * Get analytics data
 */
async function adminGetAnalytics(period = 'month') {
    return await apiCall(`/api/admin/analytics?period=${period}`, 'GET');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format currency
 */
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Format short date
 */
function formatShortDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

/**
 * Get status badge color
 */
function getStatusBadgeColor(status) {
    const colors = {
        'pending': '#FFA500',
        'confirmed': '#4CAF50',
        'processing': '#2196F3',
        'shipped': '#9C27B0',
        'delivered': '#4CAF50',
        'cancelled': '#f44336'
    };
    return colors[status] || '#999';
}

/**
 * Get status badge text
 */
function getStatusBadgeText(status) {
    const texts = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return texts[status] || status;
}

/**
 * Create table row for products
 */
function createProductTableRow(product) {
    return `
        <tr data-product-id="${product.id}">
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock_quantity}</td>
            <td>
                <span class="badge ${product.is_available ? 'badge-success' : 'badge-danger'}">
                    ${product.is_available ? 'Available' : 'Unavailable'}
                </span>
            </td>
            <td>
                <button class="btn-icon edit-product" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-product" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

/**
 * Create table row for orders
 */
function createOrderTableRow(order) {
    const statusColor = getStatusBadgeColor(order.status);
    const statusText = getStatusBadgeText(order.status);

    return `
        <tr data-order-id="${order.id}">
            <td>${order.order_number}</td>
            <td>${order.username}</td>
            <td>${formatCurrency(order.final_amount)}</td>
            <td>
                <span class="badge" style="background-color: ${statusColor}; color: white;">
                    ${statusText}
                </span>
            </td>
            <td>${formatShortDate(order.created_at)}</td>
            <td>
                <button class="btn-icon view-order" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon edit-order" title="Update Status">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `;
}

/**
 * Create table row for customers
 */
function createCustomerTableRow(customer) {
    return `
        <tr data-customer-id="${customer.id}">
            <td>${customer.id}</td>
            <td>${customer.username}</td>
            <td>${customer.email}</td>
            <td>${customer.phone || 'N/A'}</td>
            <td>${customer.total_orders}</td>
            <td>${formatCurrency(customer.total_spent)}</td>
            <td>${formatShortDate(customer.created_at)}</td>
            <td>
                <button class="btn-icon view-customer" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `;
}

/**
 * Show loading spinner
 */
function showLoadingSpinner(container) {
    container.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading...</p>
        </div>
    `;
}

/**
 * Show error message
 */
function showErrorMessage(container, message) {
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Show empty state
 */
function showEmptyState(container, message = 'No data available') {
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>${message}</p>
        </div>
    `;
}
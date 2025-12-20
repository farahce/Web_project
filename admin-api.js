/**
 * Admin API Functions
 * Handles all admin-specific API calls
 * Compatible with backend at: C:\xampp\htdocs\Webproj\backend\admin
 */

// ============================================
// ADMIN DASHBOARD API
// ============================================

/**
 * Get dashboard data
 */
async function adminGetDashboard() {
    try {
        const response = await apiCall('/api/admin/dashboard', 'GET');

        // If dashboard endpoint doesn't exist, return mock data
        if (response.status === 'error' && response.message.includes('404')) {
            return {
                status: 'success',
                data: {
                    stats: {
                        total_orders: 0,
                        total_revenue: 0,
                        total_customers: 0,
                        total_products: 0
                    },
                    recent_orders: [],
                    top_products: []
                }
            };
        }

        return response;
    } catch (error) {
        console.error('Dashboard API Error:', error);
        return {
            status: 'error',
            message: 'Failed to load dashboard'
        };
    }
}

// ============================================
// ADMIN PRODUCTS API
// ============================================

/**
 * Get all products (admin view)
 */
async function adminGetProducts(category = null, search = null, limit = 50, offset = 0) {
    try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (search) params.append('search', search);
        params.append('limit', limit);
        params.append('offset', offset);

        const response = await apiCall(`/api/admin/products?${params.toString()}`, 'GET');

        // Fallback if endpoint doesn't exist
        if (response.status === 'error') {
            return {
                status: 'success',
                data: {
                    products: [],
                    total: 0
                }
            };
        }

        return response;
    } catch (error) {
        console.error('Get Products Error:', error);
        return {
            status: 'error',
            message: 'Failed to load products'
        };
    }
}

/**
 * Get specific product (admin view)
 */
async function adminGetProduct(productId) {
    try {
        const response = await apiCall(`/api/admin/products?id=${productId}`, 'GET');
        return response;
    } catch (error) {
        console.error('Get Product Error:', error);
        return {
            status: 'error',
            message: 'Failed to load product'
        };
    }
}

/**
 * Create new product
 */
async function adminCreateProduct(productData) {
    try {
        // Convert numeric fields
        const data = {
            ...productData,
            price: parseFloat(productData.price),
            stock_quantity: parseInt(productData.stock_quantity),
            is_available: parseInt(productData.is_available || 1)
        };

        const response = await apiCall('/api/admin/products', 'POST', data);
        return response;
    } catch (error) {
        console.error('Create Product Error:', error);
        return {
            status: 'error',
            message: 'Failed to create product'
        };
    }
}

/**
 * Update product
 */
/**
 * Update product
 */
async function adminUpdateProduct(productId, productData) {
    try {
        // Convert numeric fields
        const data = {
            id: productId,
            ...productData,
            price: parseFloat(productData.price),
            stock_quantity: parseInt(productData.stock_quantity),
            is_available: parseInt(productData.is_available || 1)
        };

        const response = await apiCall(`/api/admin/products/${productId}`, 'PUT', data);
        return response;
    } catch (error) {
        console.error('Update Product Error:', error);
        return {
            status: 'error',
            message: 'Failed to update product'
        };
    }
}

/**
 * Update customer
 */
async function adminUpdateCustomer(customerId, customerData) {
    try {
        const data = {
            id: customerId,
            ...customerData
        };
        const response = await apiCall(`/api/admin/customers`, 'PUT', data);
        return response;
    } catch (error) {
        console.error('Update Customer Error:', error);
        return {
            status: 'error',
            message: 'Failed to update customer'
        };
    }
}

/**
 * Delete customer
 */
async function adminDeleteCustomer(customerId) {
    try {
        const response = await apiCall(`/api/admin/customers`, 'DELETE', {
            id: customerId
        });
        return response;
    } catch (error) {
        console.error('Delete Customer Error:', error);
        return {
            status: 'error',
            message: 'Failed to delete customer'
        };
    }
}

/**
 * Delete product
 */
async function adminDeleteProduct(productId) {
    try {
        const response = await apiCall(`/api/admin/products`, 'DELETE', {
            id: productId
        });
        return response;
    } catch (error) {
        console.error('Delete Product Error:', error);
        return {
            status: 'error',
            message: 'Failed to delete product'
        };
    }
}

// ============================================
// ADMIN ORDERS API
// ============================================

/**
 * Get all orders (admin view)
 */
async function adminGetOrders(status = null, limit = 50, offset = 0) {
    try {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        params.append('limit', limit);
        params.append('offset', offset);

        const response = await apiCall(`/api/admin/orders?${params.toString()}`, 'GET');

        // Fallback if endpoint doesn't exist
        if (response.status === 'error') {
            return {
                status: 'success',
                data: {
                    orders: [],
                    total: 0
                }
            };
        }

        return response;
    } catch (error) {
        console.error('Get Orders Error:', error);
        return {
            status: 'error',
            message: 'Failed to load orders'
        };
    }
}

/**
 * Get specific order (admin view)
 */
async function adminGetOrder(orderId) {
    try {
        const response = await apiCall(`/api/admin/orders?id=${orderId}`, 'GET');
        return response;
    } catch (error) {
        console.error('Get Order Error:', error);
        return {
            status: 'error',
            message: 'Failed to load order'
        };
    }
}

/**
 * Update order status
 */
async function adminUpdateOrderStatus(orderId, status) {
    try {
        const response = await apiCall(`/api/admin/orders`, 'PUT', {
            id: orderId,
            status: status
        });
        return response;
    } catch (error) {
        console.error('Update Order Status Error:', error);
        return {
            status: 'error',
            message: 'Failed to update order status'
        };
    }
}

// ============================================
// ADMIN CUSTOMERS API
// ============================================

/**
 * Get all customers (admin view)
 */
async function adminGetCustomers(search = null, limit = 50, offset = 0) {
    try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('limit', limit);
        params.append('offset', offset);

        const response = await apiCall(`/api/admin/customers?${params.toString()}`, 'GET');

        // Fallback if endpoint doesn't exist
        if (response.status === 'error') {
            return {
                status: 'success',
                data: {
                    customers: [],
                    total: 0
                }
            };
        }

        return response;
    } catch (error) {
        console.error('Get Customers Error:', error);
        return {
            status: 'error',
            message: 'Failed to load customers'
        };
    }
}

/**
 * Get specific customer (admin view)
 */
async function adminGetCustomer(customerId) {
    try {
        const response = await apiCall(`/api/admin/customers?id=${customerId}`, 'GET');
        return response;
    } catch (error) {
        console.error('Get Customer Error:', error);
        return {
            status: 'error',
            message: 'Failed to load customer'
        };
    }
}

// ============================================
// ADMIN ANALYTICS API
// ============================================

/**
 * Get analytics data
 */
async function adminDeleteOrder(orderId) {
    try {
        const response = await apiCall(`/api/admin/orders`, 'DELETE', {
            id: orderId
        });
        return response;
    } catch (error) {
        console.error('Delete Order Error:', error);
        return {
            status: 'error',
            message: 'Failed to delete order'
        };
    }
}

async function adminGetAnalytics(period = 'month') {
    try {
        const response = await apiCall(`/api/admin/analytics?period=${period}`, 'GET');

        // Fallback if endpoint doesn't exist
        if (response.status === 'error') {
            return {
                status: 'success',
                data: {
                    sales_trend: [],
                    product_performance: [],
                    category_performance: []
                }
            };
        }

        return response;
    } catch (error) {
        console.error('Get Analytics Error:', error);
        return {
            status: 'error',
            message: 'Failed to load analytics'
        };
    }
}

// ============================================
// ADMIN MESSAGES API
// ============================================

/**
 * Get all messages
 */
async function adminGetMessages() {
    try {
        const response = await apiCall('/api/messages', 'GET');
        return response;
    } catch (error) {
        console.error('Get Messages Error:', error);
        return {
            status: 'error',
            message: 'Failed to load messages'
        };
    }
}

// ============================================
/**
 * Delete a message
 */
async function adminDeleteMessage(messageId) {
    try {
        const response = await apiCall('/api/messages', 'DELETE', {
            id: messageId
        });
        return response;
    } catch (error) {
        console.error('Delete Message Error:', error);
        return {
            status: 'error',
            message: 'Failed to delete message'
        };
    }
}
// ============================================

/**
 * Format currency
 */
function formatCurrency(amount) {
    if (!amount && amount !== 0) return '$0.00';
    return '$' + parseFloat(amount).toFixed(2);
}

/**
 * Format date with time
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

/**
 * Format short date (without time)
 */
function formatShortDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

/**
 * Get status badge color
 */
function getStatusBadgeColor(status) {
    const colors = {
        'pending': '#FF9800',
        'confirmed': '#2196F3',
        'processing': '#9C27B0',
        'shipped': '#00BCD4',
        'delivered': '#4CAF50',
        'cancelled': '#f44336',
        'completed': '#4CAF50',
        'active': '#4CAF50',
        'inactive': '#999'
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
        'cancelled': 'Cancelled',
        'completed': 'Completed',
        'active': 'Active',
        'inactive': 'Inactive'
    };
    return texts[status] || status;
}

/**
 * Create table row for products
 */
function createProductTableRow(product) {
    const statusBadge = product.is_available ?
        '<span class="badge badge-success">Active</span>' :
        '<span class="badge badge-danger">Inactive</span>';

    return `
        <tr data-product-id="${product.id}">
            <td>${product.name || 'N/A'}</td>
            <td>${product.category || 'N/A'}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock_quantity || 0}</td>
            <td>${statusBadge}</td>
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
    const itemCount = order.items ? order.items.length : 0;

    return `
        <tr data-order-id="${order.id}">
            <td>${order.order_number || 'N/A'}</td>
            <td>${order.username || 'N/A'}</td>
            <td>${itemCount} items</td>
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
                <button class="btn-icon delete-order" title="Delete Order">
                    <i class="fas fa-trash"></i>
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
            <td>${customer.id || 'N/A'}</td>
            <td>${customer.username || 'N/A'}</td>
            <td>${customer.email || 'N/A'}</td>
            <td>${customer.phone || 'N/A'}</td>
            <td>${customer.total_orders || 0}</td>
            <td>${formatCurrency(customer.total_spent || 0)}</td>
            <td>${formatShortDate(customer.created_at)}</td>
            <td>
                <button class="btn-icon view-customer" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon edit-customer" title="Edit Customer">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-customer" title="Delete Customer">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

/**
 * Show loading spinner
 */
function showLoadingSpinner(container) {
    if (!container) return;
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
    if (!container) return;
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
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>${message}</p>
        </div>
    `;
}

console.log('Admin API functions loaded successfully!');

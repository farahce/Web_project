/**
 * Admin Dashboard - Main JavaScript
 * Handles all admin functionality with real database integration
 */

// ============================================
// GLOBAL VARIABLES
// ============================================
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const pageTitle = document.querySelector('.page-title');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');
const sidebarNav = document.querySelector('.sidebar-nav');

// Current page state
let currentPage = {
    section: 'dashboard',
    limit: 50,
    offset: 0
};

// Section titles
const sectionTitles = {
    dashboard: 'Dashboard',
    products: 'Products Management',
    orders: 'Orders Management',
    customers: 'Customers Management',
    messages: 'Messages (Contact Us)',
    analytics: 'Analytics',
    settings: 'Settings'
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    // Require admin role
    requireAdmin();

    // Initialize auth UI
    initializeAuth();

    // Setup logout button
    setupLogoutButton('.logout-btn');

    // Setup profile button
    setupProfileButton();

    // Load initial dashboard data
    loadDashboard();

    // Setup navigation
    setupNavigation();

    // Setup event listeners
    setupEventListeners();
});

// ============================================
// NAVIGATION SETUP
// ============================================
function setupNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Allow real links to work (e.g. admin_notifications.html)
            if (item.getAttribute('href') !== '#' && !item.getAttribute('href').startsWith('javascript')) {
                return;
            }

            e.preventDefault();

            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));

            // Add active class to clicked item
            item.classList.add('active');

            // Get section ID
            const sectionId = item.dataset.section;

            // Hide all sections
            sections.forEach(section => section.classList.remove('active'));

            // Show selected section
            const selectedSection = document.getElementById(sectionId);
            if (selectedSection) {
                selectedSection.classList.add('active');
                pageTitle.textContent = sectionTitles[sectionId];

                // Load section data
                loadSectionData(sectionId);
            }

            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                sidebarNav.classList.remove('active');
            }
        });
    });
}

// ============================================
// LOAD SECTION DATA
// ============================================
async function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'products':
            await loadProducts();
            break;
        case 'orders':
            await loadOrders();
            break;
        case 'customers':
            await loadCustomers();
            break;
        case 'messages':
            await loadMessages();
            break;
        case 'analytics':
            await loadAnalytics();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
    try {
        console.log('Loading dashboard...');
        // Show loading state visually to prove JS is working is NOT stuck on "old version"
        document.querySelectorAll('.stat-value').forEach(el => el.textContent = 'Loading...');

        const response = await adminGetDashboard();
        console.log('Dashboard Response:', response);

        if (response.status !== 'success') {
            const errorMsg = response.message || 'Unknown error';
            console.error('Dashboard Error:', errorMsg);
            alert('Dashboard Error: ' + errorMsg); // Alert user so they see it!
            showNotification('Failed to load dashboard: ' + errorMsg, 'error');
            return;
        }

        const data = response.data;

        // Update stat cards
        updateStatCard(0, data.stats.total_orders, '+12% from last month');
        updateStatCard(1, formatCurrency(data.stats.total_revenue), '+8% from last month');
        updateStatCard(2, data.stats.total_customers, '+5% from last month');
        updateStatCard(3, data.stats.total_products, 'Available');

        // Update recent orders table
        updateRecentOrdersTable(data.recent_orders);

        // Update top products
        updateTopProductsTable(data.top_products);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Critical Error loading dashboard: ' + error.message);
        showNotification('Error loading dashboard data', 'error');
    }
}

function updateStatCard(index, value, subtitle) {
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards[index]) {
        const statValue = statCards[index].querySelector('.stat-value');
        const statChange = statCards[index].querySelector('.stat-change');

        if (statValue) statValue.textContent = value;
        if (statChange) statChange.textContent = subtitle;
    }
}

function updateRecentOrdersTable(orders) {
    const tableBody = document.querySelector('#dashboard .data-table tbody');
    if (!tableBody) return;

    if (!orders || orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No recent orders</td></tr>';
        return;
    }

    tableBody.innerHTML = orders.map(order => `
        <tr data-order-id="${order.id}">
            <td>${order.order_number}</td>
            <td>${order.username}</td>
            <td>${formatCurrency(order.final_amount)}</td>
            <td>
                <span class="badge" style="background-color: ${getStatusBadgeColor(order.status)}; color: white;">
                    ${getStatusBadgeText(order.status)}
                </span>
            </td>
            <td>${formatShortDate(order.created_at)}</td>
            <td>
                <button class="btn-icon view-order" title="View"><i class="fas fa-eye"></i></button>
                <button class="btn-icon delete-order" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    // Re-attach event listeners for these new buttons
    tableBody.querySelectorAll('.view-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = btn.closest('tr').dataset.orderId;
            viewOrderDetails(orderId);
        });
    });

    tableBody.querySelectorAll('.delete-order').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('Are you sure you want to delete this order?')) return;
            const orderId = btn.closest('tr').dataset.orderId;
            const response = await adminDeleteOrder(orderId);
            if (response.status === 'success') {
                showNotification('Order deleted', 'success');
                loadDashboard(); // Reload dashboard
            } else {
                showNotification(response.message || 'Failed to delete', 'error');
            }
        });
    });
}

function updateTopProductsTable(products) {
    const productList = document.querySelector('.product-list');
    if (!productList) return;

    if (!products || products.length === 0) {
        productList.innerHTML = '<div class="product-item"><p>No products sold yet</p></div>';
        return;
    }

    const maxSold = Math.max(...products.map(p => p.total_sold || 0));

    productList.innerHTML = products.slice(0, 4).map(product => {
        const percentage = maxSold > 0 ? (product.total_sold / maxSold) * 100 : 0;
        return `
            <div class="product-item">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p>${product.total_sold || 0} sold</p>
                </div>
                <div class="product-bar">
                    <div class="bar-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// PRODUCTS MANAGEMENT
// ============================================
async function loadProducts() {
    try {
        const container = document.querySelector('#products .section-content');
        showLoadingSpinner(container);

        const response = await adminGetProducts(null, null, currentPage.limit, currentPage.offset);

        if (response.status !== 'success') {
            showErrorMessage(container, 'Failed to load products');
            return;
        }

        displayProductsTable(response.data.products);
        setupProductsPagination(response.data.total);

    } catch (error) {
        console.error('Error loading products:', error);
        const container = document.querySelector('#products .section-content');
        showErrorMessage(container, 'Error loading products');
    }
}

function displayProductsTable(products) {
    const tableBody = document.querySelector('#products .data-table tbody');
    if (!tableBody) return;

    if (!products || products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
        return;
    }

    tableBody.innerHTML = products.map(product => createProductTableRow(product)).join('');

    // Add event listeners
    tableBody.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = btn.closest('tr').dataset.productId;
            editProduct(productId);
        });
    });

    tableBody.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = btn.closest('tr').dataset.productId;
            deleteProduct(productId);
        });
    });
}

function setupProductsPagination(total) {
    // Pagination logic here
}

async function editProduct(productId) {
    try {
        const response = await adminGetProduct(productId);

        if (response.status !== 'success') {
            showNotification('Failed to load product', 'error');
            return;
        }

        const product = response.data.product;
        showProductModal(product);

    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Error loading product', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const response = await adminDeleteProduct(productId);

        if (response.status === 'success') {
            showNotification('Product deleted successfully', 'success');
            await loadProducts();
        } else {
            showNotification(response.message || 'Failed to delete product', 'error');
        }

    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product', 'error');
    }
}

function showProductModal(product = null) {
    // Create modal HTML
    const isEdit = product !== null;
    const title = isEdit ? 'Edit Product' : 'Add New Product';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="productForm">
                    <div class="form-group">
                        <label>Product Name *</label>
                        <input type="text" name="name" class="form-input" value="${product?.name || ''}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Category *</label>
                            <input type="text" name="category" class="form-input" value="${product?.category || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Price *</label>
                            <input type="number" name="price" class="form-input" step="0.01" value="${product?.price || ''}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Stock Quantity *</label>
                            <input type="number" name="stock_quantity" class="form-input" value="${product?.stock_quantity || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Available</label>
                            <select name="is_available" class="form-input">
                                <option value="1" ${product?.is_available === 1 ? 'selected' : ''}>Yes</option>
                                <option value="0" ${product?.is_available === 0 ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" class="form-input" rows="4">${product?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Image URL</label>
                        <input type="url" name="image_url" class="form-input" value="${product?.image_url || ''}">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close-btn">Cancel</button>
                <button class="btn btn-primary" id="saveProductBtn">${isEdit ? 'Update' : 'Create'} Product</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());

    modal.querySelector('#saveProductBtn').addEventListener('click', async () => {
        const form = modal.querySelector('#productForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            let response;
            if (isEdit) {
                data.id = product.id;
                response = await adminUpdateProduct(product.id, data);
            } else {
                response = await adminCreateProduct(data);
            }

            if (response.status === 'success') {
                showNotification(`Product ${isEdit ? 'updated' : 'created'} successfully`, 'success');
                modal.remove();
                await loadProducts();
            } else {
                showNotification(response.message || 'Failed to save product', 'error');
            }

        } catch (error) {
            console.error('Error saving product:', error);
            showNotification('Error saving product', 'error');
        }
    });
}

// ============================================
// ORDERS MANAGEMENT
// ============================================
async function loadOrders() {
    try {
        const container = document.querySelector('#orders .section-content');
        showLoadingSpinner(container);

        const response = await adminGetOrders(null, currentPage.limit, currentPage.offset);

        if (response.status !== 'success') {
            showErrorMessage(container, 'Failed to load orders');
            return;
        }

        displayOrdersTable(response.data.orders);
        setupOrdersPagination(response.data.total);

    } catch (error) {
        console.error('Error loading orders:', error);
        const container = document.querySelector('#orders .section-content');
        showErrorMessage(container, 'Error loading orders');
    }
}

function displayOrdersTable(orders) {
    const tableBody = document.querySelector('#orders .data-table tbody');
    if (!tableBody) return;

    if (!orders || orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No orders found</td></tr>';
        return;
    }

    tableBody.innerHTML = orders.map(order => createOrderTableRow(order)).join('');

    // Add event listeners
    tableBody.querySelectorAll('.view-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = btn.closest('tr').dataset.orderId;
            viewOrderDetails(orderId);
        });
    });

    tableBody.querySelectorAll('.edit-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = btn.closest('tr').dataset.orderId;
            editOrderStatus(orderId);
        });
    });

    tableBody.querySelectorAll('.delete-order').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('Are you sure you want to delete this order? This cannot be undone.')) return;

            const orderId = btn.closest('tr').dataset.orderId;
            const response = await adminDeleteOrder(orderId);

            if (response.status === 'success') {
                showNotification('Order deleted successfully', 'success');
                loadOrders();
            } else {
                showNotification(response.message || 'Failed to delete order', 'error');
            }
        });
    });
}

function setupOrdersPagination(total) {
    // Pagination logic here
}

async function viewOrderDetails(orderId) {
    try {
        const response = await adminGetOrder(orderId);

        if (response.status !== 'success') {
            showNotification('Failed to load order details', 'error');
            return;
        }

        const order = response.data.order;
        showOrderDetailsModal(order);

    } catch (error) {
        console.error('Error loading order:', error);
        showNotification('Error loading order details', 'error');
    }
}

function showOrderDetailsModal(order) {
    const modal = document.createElement('div');
    modal.className = 'modal';

    let itemsHtml = '';
    if (order.items && order.items.length > 0) {
        itemsHtml = order.items.map(item => `
            <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unit_price)}</td>
                <td>${formatCurrency(item.total_price)}</td>
            </tr>
        `).join('');
    }

    modal.innerHTML = `
        <div class="modal-content modal-lg">
            <div class="modal-header">
                <h2>Order Details - ${order.order_number}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="order-details-grid">
                    <div class="detail-section">
                        <h3>Order Information</h3>
                        <p><strong>Order Number:</strong> ${order.order_number}</p>
                        <p><strong>Status:</strong> <span class="badge" style="background-color: ${getStatusBadgeColor(order.status)}; color: white;">${getStatusBadgeText(order.status)}</span></p>
                        <p><strong>Date:</strong> ${formatDate(order.created_at)}</p>
                        <p><strong>Payment Method:</strong> ${order.payment_method || 'N/A'}</p>
                    </div>
                    <div class="detail-section">
                        <h3>Customer Information</h3>
                        <p><strong>Name:</strong> ${order.username}</p>
                        <p><strong>Email:</strong> ${order.email}</p>
                        <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
                    </div>
                    <div class="detail-section">
                        <h3>Shipping Address</h3>
                        <p>${order.shipping_address || 'N/A'}</p>
                        <p>${order.shipping_city || ''}, ${order.shipping_country || ''} ${order.shipping_postal_code || ''}</p>
                    </div>
                </div>
                
                <h3>Order Items</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml || '<tr><td colspan="4" class="text-center">No items</td></tr>'}
                    </tbody>
                </table>

                <div class="order-totals">
                    <p><strong>Subtotal:</strong> ${formatCurrency(order.total_amount)}</p>
                    <p><strong>Discount:</strong> ${formatCurrency(order.discount_amount)}</p>
                    <p><strong>Final Amount:</strong> ${formatCurrency(order.final_amount)}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close-btn">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
}

async function editOrderStatus(orderId) {
    try {
        const response = await adminGetOrder(orderId);

        if (response.status !== 'success') {
            showNotification('Failed to load order', 'error');
            return;
        }

        const order = response.data.order;
        showOrderStatusModal(order);

    } catch (error) {
        console.error('Error loading order:', error);
        showNotification('Error loading order', 'error');
    }
}

function showOrderStatusModal(order) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Update Order Status</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>Order:</strong> ${order.order_number}</p>
                <p><strong>Current Status:</strong> <span class="badge" style="background-color: ${getStatusBadgeColor(order.status)}; color: white;">${getStatusBadgeText(order.status)}</span></p>
                
                <div class="form-group">
                    <label>New Status *</label>
                    <select id="newStatus" class="form-input">
                        <option value="">Select Status</option>
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close-btn">Cancel</button>
                <button class="btn btn-primary" id="updateStatusBtn">Update Status</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());

    modal.querySelector('#updateStatusBtn').addEventListener('click', async () => {
        const newStatus = modal.querySelector('#newStatus').value;

        if (!newStatus) {
            showNotification('Please select a status', 'error');
            return;
        }

        try {
            const response = await adminUpdateOrderStatus(order.id, newStatus);

            if (response.status === 'success') {
                showNotification('Order status updated successfully', 'success');
                modal.remove();
                await loadOrders();
            } else {
                showNotification(response.message || 'Failed to update order status', 'error');
            }

        } catch (error) {
            console.error('Error updating order status:', error);
            showNotification('Error updating order status', 'error');
        }
    });
}

// ============================================
// CUSTOMERS MANAGEMENT
// ============================================
async function loadCustomers() {
    try {
        const container = document.querySelector('#customers .section-content');
        showLoadingSpinner(container);

        const response = await adminGetCustomers(null, currentPage.limit, currentPage.offset);

        if (response.status !== 'success') {
            showErrorMessage(container, 'Failed to load customers');
            return;
        }

        displayCustomersTable(response.data.customers);
        setupCustomersPagination(response.data.total);

    } catch (error) {
        console.error('Error loading customers:', error);
        const container = document.querySelector('#customers .section-content');
        showErrorMessage(container, 'Error loading customers');
    }
}

function displayCustomersTable(customers) {
    const tableBody = document.querySelector('#customers .data-table tbody');
    if (!tableBody) return;

    if (!customers || customers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No customers found</td></tr>';
        return;
    }

    tableBody.innerHTML = customers.map(customer => createCustomerTableRow(customer)).join('');

    // Add event listeners
    tableBody.querySelectorAll('.view-customer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const customerId = btn.closest('tr').dataset.customerId;
            viewCustomerDetails(customerId);
        });
    });

    tableBody.querySelectorAll('.edit-customer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const customerId = btn.closest('tr').dataset.customerId;
            editCustomer(customerId); // We need to create this function
        });
    });

    tableBody.querySelectorAll('.delete-customer').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('Are you sure you want to delete this user?')) return;

            const customerId = btn.closest('tr').dataset.customerId;
            const response = await adminDeleteCustomer(customerId);

            if (response.status === 'success') {
                showNotification('Customer deleted successfully', 'success');
                loadCustomers();
            } else {
                showNotification(response.message || 'Failed to delete customer', 'error');
            }
        });
    });
}

function setupCustomersPagination(total) {
    // Pagination logic here
}

// ============================================
// MESSAGES MANAGEMENT
// ============================================
async function loadMessages() {
    try {
        const container = document.querySelector('#messages .card'); // Use card or specific container
        if (container.querySelector('.table-container')) {
            // It has the structure
        }

        const response = await adminGetMessages();

        if (response.status !== 'success') {
            showNotification(response.message || 'Failed to load messages', 'error');
            return;
        }

        displayMessagesTable(response.data);

    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function displayMessagesTable(messages) {
    const tableBody = document.querySelector('#messages .data-table tbody');
    if (!tableBody) return;

    if (!messages || messages.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No messages found</td></tr>';
        return;
    }

    tableBody.innerHTML = messages.map(msg => `
        <tr data-message-id="${msg.id}">
            <td>${formatShortDate(msg.created_at)}</td>
            <td>${msg.name}</td>
            <td><a href="mailto:${msg.email}">${msg.email}</a></td>
            <td>${msg.subject}</td>
            <td><span class="badge" style="background-color: ${msg.status === 'new' ? '#FF9800' : '#4CAF50'}; color: white;">${msg.status}</span></td>
            <td>
                <a href="mailto:${msg.email}?subject=Re: ${msg.subject}" class="btn-icon" title="Reply"><i class="fas fa-reply"></i></a>
                <button class="btn-icon delete-message" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    // Add event listeners for delete buttons
    tableBody.querySelectorAll('.delete-message').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('Are you sure you want to delete this message?')) return;

            const messageId = btn.closest('tr').dataset.messageId;
            const response = await adminDeleteMessage(messageId);

            if (response.status === 'success') {
                showNotification('Message deleted', 'success');
                loadMessages(); // Reload table
            } else {
                showNotification(response.message || 'Failed to delete', 'error');
            }
        });
    });
}

async function viewCustomerDetails(customerId) {
    try {
        const response = await adminGetCustomer(customerId);

        if (response.status !== 'success') {
            showNotification('Failed to load customer details', 'error');
            return;
        }

        const customer = response.data.customer;
        showCustomerDetailsModal(customer);

    } catch (error) {
        console.error('Error loading customer:', error);
        showNotification('Error loading customer details', 'error');
    }
}

function showCustomerDetailsModal(customer) {
    const modal = document.createElement('div');
    modal.className = 'modal';

    let ordersHtml = '';
    if (customer.orders && customer.orders.length > 0) {
        ordersHtml = customer.orders.map(order => `
            <tr>
                <td>${order.order_number}</td>
                <td>${formatCurrency(order.final_amount)}</td>
                <td><span class="badge" style="background-color: ${getStatusBadgeColor(order.status)}; color: white;">${getStatusBadgeText(order.status)}</span></td>
                <td>${formatShortDate(order.created_at)}</td>
            </tr>
        `).join('');
    } else {
        ordersHtml = '<tr><td colspan="4" class="text-center">No orders</td></tr>';
    }

    const stats = customer.statistics || {};

    modal.innerHTML = `
        <div class="modal-content modal-lg">
            <div class="modal-header">
                <h2>Customer Details</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="customer-details-grid">
                    <div class="detail-section">
                        <h3>Customer Information</h3>
                        <p><strong>Name:</strong> ${customer.username}</p>
                        <p><strong>Email:</strong> ${customer.email}</p>
                        <p><strong>Phone:</strong> ${customer.phone || 'N/A'}</p>
                        <p><strong>Member Since:</strong> ${formatShortDate(customer.created_at)}</p>
                    </div>
                    <div class="detail-section">
                        <h3>Customer Statistics</h3>
                        <p><strong>Total Orders:</strong> ${stats.total_orders || 0}</p>
                        <p><strong>Total Spent:</strong> ${formatCurrency(stats.total_spent || 0)}</p>
                        <p><strong>Average Order Value:</strong> ${formatCurrency(stats.avg_order_value || 0)}</p>
                    </div>
                </div>

                <h3>Order History</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Order Number</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ordersHtml}
                    </tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close-btn">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
}

async function editCustomer(customerId) {
    try {
        const response = await adminGetCustomer(customerId);
        if (response.status === 'success') {
            showCustomerEditModal(response.data.customer);
        } else {
            showNotification('Failed to load customer', 'error');
        }
    } catch (error) {
        showNotification('Error loading customer', 'error');
    }
}

function showCustomerEditModal(customer) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Customer</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="customerForm">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" name="username" class="form-input" value="${customer.username}" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" class="form-input" value="${customer.email}" required>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="text" name="phone" class="form-input" value="${customer.phone || ''}">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close-btn">Cancel</button>
                <button class="btn btn-primary" id="saveCustomerBtn">Save Changes</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());

    modal.querySelector('#saveCustomerBtn').addEventListener('click', async () => {
        const form = modal.querySelector('#customerForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        const response = await adminUpdateCustomer(customer.id, data);
        if (response.status === 'success') {
            showNotification('Customer updated', 'success');
            modal.remove();
            loadCustomers();
        } else {
            showNotification(response.message || 'Failed to update', 'error');
        }
    });
}

// ============================================
// ANALYTICS
// ============================================
async function loadAnalytics() {
    try {
        const container = document.querySelector('#analytics .section-content');
        showLoadingSpinner(container);

        const response = await adminGetAnalytics('month');

        if (response.status !== 'success') {
            showErrorMessage(container, 'Failed to load analytics');
            return;
        }

        displayAnalytics(response.data, container);

    } catch (error) {
        console.error('Error loading analytics:', error);
        const container = document.querySelector('#analytics .section-content');
        showErrorMessage(container, 'Error loading analytics');
    }
}

function displayAnalytics(data, container) {
    if (!container) return;

    let html = '<div class="analytics-container">';

    // Sales Trend
    html += '<div class="analytics-section"><h3>Sales Trend</h3>';
    if (data.sales_trend && data.sales_trend.length > 0) {
        html += '<table class="data-table"><thead><tr><th>Period</th><th>Orders</th><th>Revenue</th><th>Avg Order Value</th></tr></thead><tbody>';
        data.sales_trend.forEach(item => {
            html += `<tr><td>${item.period}</td><td>${item.orders}</td><td>${formatCurrency(item.revenue)}</td><td>${formatCurrency(item.avg_order_value)}</td></tr>`;
        });
        html += '</tbody></table>';
    } else {
        html += '<p>No sales data available</p>';
    }
    html += '</div>';

    // Top Products
    html += '<div class="analytics-section"><h3>Top Products</h3>';
    if (data.product_performance && data.product_performance.length > 0) {
        html += '<table class="data-table"><thead><tr><th>Product</th><th>Category</th><th>Times Sold</th><th>Revenue</th></tr></thead><tbody>';
        data.product_performance.slice(0, 10).forEach(item => {
            html += `<tr><td>${item.name}</td><td>${item.category}</td><td>${item.total_quantity}</td><td>${formatCurrency(item.total_revenue)}</td></tr>`;
        });
        html += '</tbody></table>';
    } else {
        html += '<p>No product data available</p>';
    }
    html += '</div>';

    // Category Performance
    html += '<div class="analytics-section"><h3>Category Performance</h3>';
    if (data.category_performance && data.category_performance.length > 0) {
        html += '<table class="data-table"><thead><tr><th>Category</th><th>Total Sold</th><th>Revenue</th><th>Customers</th></tr></thead><tbody>';
        data.category_performance.forEach(item => {
            html += `<tr><td>${item.category}</td><td>${item.total_quantity}</td><td>${formatCurrency(item.total_revenue)}</td><td>${item.unique_customers}</td></tr>`;
        });
        html += '</tbody></table>';
    } else {
        html += '<p>No category data available</p>';
    }
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// SETTINGS
// ============================================
function loadSettings() {
    const container = document.querySelector('#settings .section-content');
    if (!container) return;

    const user = getCurrentUser();

    container.innerHTML = `
        <div class="settings-container">
            <div class="settings-section">
                <h3>Admin Profile</h3>
                <p><strong>Username:</strong> ${user?.username || 'N/A'}</p>
                <p><strong>Email:</strong> ${user?.email || 'N/A'}</p>
                <p><strong>Role:</strong> Administrator</p>
            </div>
            
            <div class="settings-section">
                <h3>System Information</h3>
                <p><strong>API Version:</strong> 1.0.0</p>
                <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
    `;
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================
function setupEventListeners() {
    // Add Product Button
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            showProductModal();
        });
    }

    // Sidebar toggle for mobile
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.querySelector('.sidebar-nav').classList.toggle('active');
        });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const tableRows = document.querySelectorAll('.data-table tbody tr');

            tableRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // Responsive sidebar
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            document.querySelector('.sidebar-nav').classList.remove('active');
        }
    });
}

// ============================================
// PROFILE BUTTON SETUP
// ============================================
function setupProfileButton() {
    const profileBtn = document.querySelector('[data-profile-btn]') ||
        document.querySelector('.profile-btn') ||
        document.querySelector('.user-profile') ||
        document.querySelector('.admin-profile');

    if (profileBtn) {
        profileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const settingsSection = document.getElementById('settings');
            if (settingsSection) {
                settingsSection.scrollIntoView({ behavior: 'smooth' });
                document.querySelector('[data-section="settings"]').click();
            }
        });
    }
}

// ============================================
// ANIMATIONS
// ============================================
window.addEventListener('load', () => {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
});

console.log('Admin Dashboard loaded successfully!');


// ============================================
// HTML GENERATORS (Inserted locally to ensure updates)
// ============================================

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

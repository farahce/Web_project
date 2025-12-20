<?php
// CORS Headers + Force JSON response
if (!headers_sent()) {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json');  // ده اللي بيحل مشكلة تحليل JSON
}

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
require_once '../includes/functions.php';
/**
 * Admin Dashboard API
 * GET /api/admin/dashboard - Get dashboard statistics (admin only)
 */

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

// Require admin role
requireAdmin();

if ($method === 'GET') {
    // Get dashboard statistics

    // Total Orders
    $orders_sql = "SELECT COUNT(*) as total FROM orders";
    $orders_stmt = $conn->prepare($orders_sql);
    $orders_stmt->execute();
    $orders_result = $orders_stmt->get_result();
    $orders_data = $orders_result->fetch_assoc();
    $orders_stmt->close();

    // Total Revenue
    $revenue_sql = "SELECT COALESCE(SUM(final_amount), 0) as total FROM orders WHERE status != 'cancelled'";
    $revenue_stmt = $conn->prepare($revenue_sql);
    $revenue_stmt->execute();
    $revenue_result = $revenue_stmt->get_result();
    $revenue_data = $revenue_result->fetch_assoc();
    $revenue_stmt->close();

    // Total Customers
    $customers_sql = "SELECT COUNT(*) as total FROM users WHERE role = 'user'";
    $customers_stmt = $conn->prepare($customers_sql);
    $customers_stmt->execute();
    $customers_result = $customers_stmt->get_result();
    $customers_data = $customers_result->fetch_assoc();
    $customers_stmt->close();

    // Total Products
    $products_sql = "SELECT COUNT(*) as total FROM products WHERE is_available = 1";
    $products_stmt = $conn->prepare($products_sql);
    $products_stmt->execute();
    $products_result = $products_stmt->get_result();
    $products_data = $products_result->fetch_assoc();
    $products_stmt->close();

    // Orders by Status
    $status_sql = "SELECT status, COUNT(*) as count FROM orders GROUP BY status";
    $status_stmt = $conn->prepare($status_sql);
    $status_stmt->execute();
    $status_result = $status_stmt->get_result();

    $orders_by_status = [];
    while ($row = $status_result->fetch_assoc()) {
        $orders_by_status[] = $row;
    }
    $status_stmt->close();

    // Recent Orders
    $recent_sql = "SELECT o.id, o.order_number, o.final_amount, o.status, o.created_at, u.username 
                   FROM orders o 
                   JOIN users u ON o.user_id = u.id 
                   ORDER BY o.created_at DESC 
                   LIMIT 10";
    $recent_stmt = $conn->prepare($recent_sql);
    $recent_stmt->execute();
    $recent_result = $recent_stmt->get_result();

    $recent_orders = [];
    while ($row = $recent_result->fetch_assoc()) {
        $recent_orders[] = $row;
    }
    $recent_stmt->close();

    // Top Products
    $top_products_sql = "SELECT p.id, p.name, p.price, SUM(oi.quantity) as total_sold, SUM(oi.total_price) as revenue
                         FROM products p
                         JOIN order_items oi ON p.id = oi.product_id
                         GROUP BY p.id
                         ORDER BY total_sold DESC
                         LIMIT 5";
    $top_products_stmt = $conn->prepare($top_products_sql);
    $top_products_stmt->execute();
    $top_products_result = $top_products_stmt->get_result();

    $top_products = [];
    while ($row = $top_products_result->fetch_assoc()) {
        $top_products[] = $row;
    }
    $top_products_stmt->close();

    // Revenue by Month (last 12 months)
    $revenue_by_month_sql = "SELECT 
                             DATE_FORMAT(created_at, '%Y-%m') as month,
                             COUNT(*) as orders,
                             COALESCE(SUM(final_amount), 0) as revenue
                             FROM orders
                             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                             AND status != 'cancelled'
                             GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                             ORDER BY month ASC";
    $revenue_by_month_stmt = $conn->prepare($revenue_by_month_sql);
    $revenue_by_month_stmt->execute();
    $revenue_by_month_result = $revenue_by_month_stmt->get_result();

    $revenue_by_month = [];
    while ($row = $revenue_by_month_result->fetch_assoc()) {
        $revenue_by_month[] = $row;
    }
    $revenue_by_month_stmt->close();

    // Average Order Value
    $avg_order_sql = "SELECT COALESCE(AVG(final_amount), 0) as average FROM orders WHERE status != 'cancelled'";
    $avg_order_stmt = $conn->prepare($avg_order_sql);
    $avg_order_stmt->execute();
    $avg_order_result = $avg_order_stmt->get_result();
    $avg_order_data = $avg_order_result->fetch_assoc();
    $avg_order_stmt->close();

    // Pending Orders
    $pending_sql = "SELECT COUNT(*) as total FROM orders WHERE status = 'pending'";
    $pending_stmt = $conn->prepare($pending_sql);
    $pending_stmt->execute();
    $pending_result = $pending_stmt->get_result();
    $pending_data = $pending_result->fetch_assoc();
    $pending_stmt->close();

    sendResponse('success', 'Dashboard data retrieved successfully', [
        'stats' => [
            'total_orders' => (int)$orders_data['total'],
            'total_revenue' => (float)$revenue_data['total'],
            'total_customers' => (int)$customers_data['total'],
            'total_products' => (int)$products_data['total'],
            'average_order_value' => (float)$avg_order_data['average'],
            'pending_orders' => (int)$pending_data['total']
        ],
        'orders_by_status' => $orders_by_status,
        'recent_orders' => $recent_orders,
        'top_products' => $top_products,
        'revenue_by_month' => $revenue_by_month
    ]);

} else {
    sendResponse('error', 'Method not allowed');
}
?>
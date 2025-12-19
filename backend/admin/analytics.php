<?php
/**
 * Admin Analytics API
 * GET /api/admin/analytics - Get analytics data (admin only)
 */

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

// Require admin role
requireAdmin();

if ($method === 'GET') {
    // Get analytics data
    $period = isset($_GET['period']) ? trim($_GET['period']) : 'month'; // day, week, month, year

    // Determine date range
    $date_range = "DATE_SUB(NOW(), INTERVAL 1 MONTH)";
    $date_format = '%Y-%m-%d';

    switch ($period) {
        case 'day':
            $date_range = "DATE_SUB(NOW(), INTERVAL 1 DAY)";
            $date_format = '%H:00';
            break;
        case 'week':
            $date_range = "DATE_SUB(NOW(), INTERVAL 1 WEEK)";
            $date_format = '%Y-%m-%d';
            break;
        case 'year':
            $date_range = "DATE_SUB(NOW(), INTERVAL 1 YEAR)";
            $date_format = '%Y-%m';
            break;
        default:
            $date_range = "DATE_SUB(NOW(), INTERVAL 1 MONTH)";
            $date_format = '%Y-%m-%d';
    }

    // Sales Trend
    $sales_trend_sql = "SELECT 
                        DATE_FORMAT(created_at, '$date_format') as period,
                        COUNT(*) as orders,
                        COALESCE(SUM(final_amount), 0) as revenue,
                        COALESCE(AVG(final_amount), 0) as avg_order_value
                        FROM orders
                        WHERE created_at >= $date_range
                        AND status != 'cancelled'
                        GROUP BY DATE_FORMAT(created_at, '$date_format')
                        ORDER BY period ASC";

    $sales_trend_stmt = $conn->prepare($sales_trend_sql);
    $sales_trend_stmt->execute();
    $sales_trend_result = $sales_trend_stmt->get_result();

    $sales_trend = [];
    while ($row = $sales_trend_result->fetch_assoc()) {
        $sales_trend[] = $row;
    }
    $sales_trend_stmt->close();

    // Product Performance
    $product_performance_sql = "SELECT 
                                p.id,
                                p.name,
                                p.category,
                                p.price,
                                COUNT(oi.id) as times_sold,
                                SUM(oi.quantity) as total_quantity,
                                SUM(oi.total_price) as total_revenue,
                                COALESCE(AVG(oi.quantity), 0) as avg_quantity_per_order
                                FROM products p
                                LEFT JOIN order_items oi ON p.id = oi.product_id
                                LEFT JOIN orders o ON oi.order_id = o.id
                                WHERE o.created_at >= $date_range OR o.id IS NULL
                                GROUP BY p.id
                                ORDER BY total_revenue DESC
                                LIMIT 20";

    $product_performance_stmt = $conn->prepare($product_performance_sql);
    $product_performance_stmt->execute();
    $product_performance_result = $product_performance_stmt->get_result();

    $product_performance = [];
    while ($row = $product_performance_result->fetch_assoc()) {
        $product_performance[] = $row;
    }
    $product_performance_stmt->close();

    // Category Performance
    $category_performance_sql = "SELECT 
                                 p.category,
                                 COUNT(oi.id) as times_sold,
                                 SUM(oi.quantity) as total_quantity,
                                 SUM(oi.total_price) as total_revenue,
                                 COUNT(DISTINCT o.user_id) as unique_customers
                                 FROM products p
                                 LEFT JOIN order_items oi ON p.id = oi.product_id
                                 LEFT JOIN orders o ON oi.order_id = o.id
                                 WHERE o.created_at >= $date_range OR o.id IS NULL
                                 GROUP BY p.category
                                 ORDER BY total_revenue DESC";

    $category_performance_stmt = $conn->prepare($category_performance_sql);
    $category_performance_stmt->execute();
    $category_performance_result = $category_performance_stmt->get_result();

    $category_performance = [];
    while ($row = $category_performance_result->fetch_assoc()) {
        $category_performance[] = $row;
    }
    $category_performance_stmt->close();

    // Customer Metrics
    $customer_metrics_sql = "SELECT 
                             COUNT(DISTINCT u.id) as total_customers,
                             COUNT(DISTINCT CASE WHEN o.created_at >= $date_range THEN u.id END) as new_customers,
                             COUNT(DISTINCT CASE WHEN o.created_at >= $date_range THEN o.user_id END) as active_customers,
                             COALESCE(AVG(customer_orders.order_count), 0) as avg_orders_per_customer
                             FROM users u
                             LEFT JOIN orders o ON u.id = o.user_id
                             LEFT JOIN (
                                 SELECT user_id, COUNT(*) as order_count
                                 FROM orders
                                 GROUP BY user_id
                             ) customer_orders ON u.id = customer_orders.user_id
                             WHERE u.role = 'user'";

    $customer_metrics_stmt = $conn->prepare($customer_metrics_sql);
    $customer_metrics_stmt->execute();
    $customer_metrics_result = $customer_metrics_stmt->get_result();
    $customer_metrics = $customer_metrics_result->fetch_assoc();
    $customer_metrics_stmt->close();

    // Order Status Distribution
    $order_status_sql = "SELECT 
                         status,
                         COUNT(*) as count,
                         COALESCE(SUM(final_amount), 0) as revenue
                         FROM orders
                         WHERE created_at >= $date_range
                         GROUP BY status";

    $order_status_stmt = $conn->prepare($order_status_sql);
    $order_status_stmt->execute();
    $order_status_result = $order_status_stmt->get_result();

    $order_status_distribution = [];
    while ($row = $order_status_result->fetch_assoc()) {
        $order_status_distribution[] = $row;
    }
    $order_status_stmt->close();

    // Payment Method Distribution
    $payment_method_sql = "SELECT 
                           payment_method,
                           COUNT(*) as count,
                           COALESCE(SUM(final_amount), 0) as revenue
                           FROM orders
                           WHERE created_at >= $date_range
                           AND status != 'cancelled'
                           GROUP BY payment_method";

    $payment_method_stmt = $conn->prepare($payment_method_sql);
    $payment_method_stmt->execute();
    $payment_method_result = $payment_method_stmt->get_result();

    $payment_method_distribution = [];
    while ($row = $payment_method_result->fetch_assoc()) {
        $payment_method_distribution[] = $row;
    }
    $payment_method_stmt->close();

    sendResponse('success', 'Analytics data retrieved successfully', [
        'period' => $period,
        'sales_trend' => $sales_trend,
        'product_performance' => $product_performance,
        'category_performance' => $category_performance,
        'customer_metrics' => $customer_metrics,
        'order_status_distribution' => $order_status_distribution,
        'payment_method_distribution' => $payment_method_distribution
    ]);

} else {
    sendResponse('error', 'Method not allowed');
}
?>

<?php
/**
 * Admin Customers API
 * GET /api/admin/customers - Get all customers (admin only)
 * GET /api/admin/customers?id=1 - Get specific customer details (admin only)
 */

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

// Require admin role
requireAdmin();

if ($method === 'GET') {
    // Get all customers or specific customer
    $customer_id = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $search = isset($_GET['search']) ? trim($_GET['search']) : null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    // Validate limit and offset
    if ($limit < 1 || $limit > 1000) {
        $limit = 50;
    }
    if ($offset < 0) {
        $offset = 0;
    }

    if ($customer_id) {
        // Get specific customer with orders
        $sql = "SELECT id, username, email, phone, created_at FROM users WHERE id = ? AND role = 'user'";
        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            sendResponse('error', 'Database error: ' . $conn->error);
        }

        $stmt->bind_param("i", $customer_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt->close();
            sendResponse('error', 'Customer not found');
        }

        $customer = $result->fetch_assoc();
        $stmt->close();

        // Get customer orders
        $orders_sql = "SELECT id, order_number, total_amount, final_amount, status, created_at 
                       FROM orders 
                       WHERE user_id = ? 
                       ORDER BY created_at DESC";
        $orders_stmt = $conn->prepare($orders_sql);
        $orders_stmt->bind_param("i", $customer_id);
        $orders_stmt->execute();
        $orders_result = $orders_stmt->get_result();

        $orders = [];
        $total_spent = 0;
        while ($row = $orders_result->fetch_assoc()) {
            $orders[] = $row;
            $total_spent += (float)$row['final_amount'];
        }
        $orders_stmt->close();

        // Get customer statistics
        $stats_sql = "SELECT 
                      COUNT(*) as total_orders,
                      SUM(final_amount) as total_spent,
                      AVG(final_amount) as avg_order_value
                      FROM orders 
                      WHERE user_id = ?";
        $stats_stmt = $conn->prepare($stats_sql);
        $stats_stmt->bind_param("i", $customer_id);
        $stats_stmt->execute();
        $stats_result = $stats_stmt->get_result();
        $stats = $stats_result->fetch_assoc();
        $stats_stmt->close();

        $customer['orders'] = $orders;
        $customer['statistics'] = $stats;

        sendResponse('success', 'Customer retrieved successfully', [
            'customer' => $customer
        ]);
    } else {
        // Get all customers
        $where = "";
        $params = [];
        $param_types = "";

        if ($search) {
            $where = "WHERE (username LIKE ? OR email LIKE ?) AND role = 'user'";
            $search_term = "%$search%";
            $params[] = $search_term;
            $params[] = $search_term;
            $param_types = "ss";
        } else {
            $where = "WHERE role = 'user'";
        }

        // Get total count
        $count_sql = "SELECT COUNT(*) as total FROM users $where";
        $count_stmt = $conn->prepare($count_sql);

        if (count($params) > 0) {
            $count_stmt->bind_param($param_types, ...$params);
        }

        $count_stmt->execute();
        $count_result = $count_stmt->get_result();
        $count_row = $count_result->fetch_assoc();
        $count_stmt->close();

        // Get customers with order statistics
        $sql = "SELECT u.id, u.username, u.email, u.phone, u.created_at,
                COUNT(o.id) as total_orders,
                COALESCE(SUM(o.final_amount), 0) as total_spent
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id
                $where
                GROUP BY u.id
                ORDER BY u.created_at DESC 
                LIMIT ? OFFSET ?";

        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            sendResponse('error', 'Database error: ' . $conn->error);
        }

        $params[] = $limit;
        $params[] = $offset;
        $param_types .= "ii";

        if (count($params) > 2) {
            $stmt->bind_param($param_types, ...$params);
        } else {
            $stmt->bind_param("ii", $limit, $offset);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $customers = [];
        while ($row = $result->fetch_assoc()) {
            $customers[] = $row;
        }
        $stmt->close();

        sendResponse('success', 'Customers retrieved successfully', [
            'customers' => $customers,
            'total' => $count_row['total'],
            'limit' => $limit,
            'offset' => $offset
        ]);
    }

} else {
    sendResponse('error', 'Method not allowed');
}
?>

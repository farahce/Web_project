<?php
/**
 * Admin Orders API
 * GET /api/admin/orders - Get all orders (admin only)
 * GET /api/admin/orders?id=1 - Get specific order details (admin only)
 * PUT /api/admin/orders - Update order status (admin only)
 */

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

// Require admin role
requireAdmin();

if ($method === 'GET') {
    // Get all orders or specific order
    $order_id = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $status = isset($_GET['status']) ? trim($_GET['status']) : null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    // Validate limit and offset
    if ($limit < 1 || $limit > 1000) {
        $limit = 50;
    }
    if ($offset < 0) {
        $offset = 0;
    }

    if ($order_id) {
        // Get specific order with items and customer details
        $sql = "SELECT o.*, u.username, u.email, u.phone 
                FROM orders o 
                JOIN users u ON o.user_id = u.id 
                WHERE o.id = ?";
        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            sendResponse('error', 'Database error: ' . $conn->error);
        }

        $stmt->bind_param("i", $order_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt->close();
            sendResponse('error', 'Order not found');
        }

        $order = $result->fetch_assoc();
        $stmt->close();

        // Get order items
        $items_sql = "SELECT * FROM order_items WHERE order_id = ?";
        $items_stmt = $conn->prepare($items_sql);
        $items_stmt->bind_param("i", $order_id);
        $items_stmt->execute();
        $items_result = $items_stmt->get_result();

        $items = [];
        while ($row = $items_result->fetch_assoc()) {
            $items[] = $row;
        }
        $items_stmt->close();

        $order['items'] = $items;

        sendResponse('success', 'Order retrieved successfully', [
            'order' => $order
        ]);
    } else {
        // Get all orders with optional status filter
        $where = "";
        $params = [];
        $param_types = "";

        if ($status) {
            $where = "WHERE o.status = ?";
            $params[] = $status;
            $param_types = "s";
        }

        // Get total count
        $count_sql = "SELECT COUNT(*) as total FROM orders o $where";
        $count_stmt = $conn->prepare($count_sql);

        if (count($params) > 0) {
            $count_stmt->bind_param($param_types, ...$params);
        }

        $count_stmt->execute();
        $count_result = $count_stmt->get_result();
        $count_row = $count_result->fetch_assoc();
        $count_stmt->close();

        // Get orders
        $sql = "SELECT o.*, u.username, u.email, 
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
                FROM orders o 
                JOIN users u ON o.user_id = u.id 
                $where
                ORDER BY o.created_at DESC 
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

        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
        $stmt->close();

        sendResponse('success', 'Orders retrieved successfully', [
            'orders' => $orders,
            'total' => $count_row['total'],
            'limit' => $limit,
            'offset' => $offset
        ]);
    }

} elseif ($method === 'PUT') {
    // Update order status
    $data = getJsonInput();

    if (!isset($data['id']) || !isset($data['status'])) {
        sendResponse('error', 'Order ID and status are required');
    }

    $order_id = (int)$data['id'];
    $status = trim($data['status']);

    // Validate status
    $valid_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!in_array($status, $valid_statuses)) {
        sendResponse('error', 'Invalid status. Valid statuses: ' . implode(', ', $valid_statuses));
    }

    // Check if order exists
    $check_sql = "SELECT id, status FROM orders WHERE id = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("i", $order_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows === 0) {
        $check_stmt->close();
        sendResponse('error', 'Order not found');
    }

    $order = $check_result->fetch_assoc();
    $check_stmt->close();

    // Update order status
    $sql = "UPDATE orders SET status = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $status, $order_id);

    if ($stmt->execute()) {
        $stmt->close();

        // Log activity
        $user_id = getCurrentUserId();
        logActivity($conn, $user_id, 'UPDATE_ORDER_STATUS', "Updated order $order_id status from {$order['status']} to $status");

        sendResponse('success', 'Order status updated successfully', [
            'order_id' => $order_id,
            'new_status' => $status,
            'previous_status' => $order['status']
        ]);
    } else {
        $error = $stmt->error;
        $stmt->close();
        sendResponse('error', 'Failed to update order: ' . $error);
    }

} else {
    sendResponse('error', 'Method not allowed');
}
?>

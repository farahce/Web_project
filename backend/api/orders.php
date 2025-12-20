<?php
/**
 * Orders API
 * POST /api/orders - Create new order
 * GET /api/orders - Get user's orders
 * GET /api/orders?id=1 - Get specific order
 * PUT /api/orders - Update order status
 */

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Create new order
    $data = getJsonInput();

    $user_id = getCurrentUserId();
    if (!$user_id) {
        // Fallback: check body for user_id
        if (isset($data['user_id']) && !empty($data['user_id'])) {
            $user_id = (int)$data['user_id'];
             // Verify user exists
            $check_user = $conn->prepare("SELECT id FROM users WHERE id = ?");
            if ($check_user) {
                $check_user->bind_param("i", $user_id);
                $check_user->execute();
                $result = $check_user->get_result();
                if ($result->num_rows > 0) {
                     $_SESSION['user_id'] = $user_id;
                } else {
                     sendResponse('error', 'Invalid user ID');
                }
                $check_user->close();
            }
        } else {
            sendResponse('error', 'User not logged in');
        }
    }

    // Get shipping info
    $shipping_address = isset($data['shipping_address']) ? trim($data['shipping_address']) : '';
    $shipping_city = isset($data['shipping_city']) ? trim($data['shipping_city']) : '';
    $shipping_country = isset($data['shipping_country']) ? trim($data['shipping_country']) : '';
    $shipping_postal = isset($data['shipping_postal_code']) ? trim($data['shipping_postal_code']) : '';
    $payment_method = isset($data['payment_method']) ? trim($data['payment_method']) : 'credit_card';
    $notes = isset($data['notes']) ? trim($data['notes']) : '';

    // Get cart items
    $cart_sql = "SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.stock_quantity, p.is_available
                 FROM cart c 
                 JOIN products p ON c.product_id = p.id 
                 WHERE c.user_id = ?";
    $cart_stmt = $conn->prepare($cart_sql);
    $cart_stmt->bind_param("i", $user_id);
    $cart_stmt->execute();
    $cart_result = $cart_stmt->get_result();

    if ($cart_result->num_rows === 0) {
        $cart_stmt->close();
        sendResponse('error', 'Cart is empty');
    }

    $cart_items = [];
    $total_amount = 0;
    $discount_amount = 0;

    // Validate cart items and calculate total
    while ($row = $cart_result->fetch_assoc()) {
        if (!$row['is_available']) {
            $cart_stmt->close();
            sendResponse('error', 'Product "' . $row['name'] . '" is no longer available');
        }
        
        if ($row['stock_quantity'] < $row['quantity']) {
            $cart_stmt->close();
            sendResponse('error', 'Insufficient stock for "' . $row['name'] . '". Available: ' . $row['stock_quantity']);
        }
        
        $subtotal = $row['price'] * $row['quantity'];
        $total_amount += $subtotal;
        
        $cart_items[] = $row;
    }
    $cart_stmt->close();

    // Generate order number
    $order_number = 'ORD-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    
    // Check if order number exists (unlikely but check anyway)
    $check_sql = "SELECT id FROM orders WHERE order_number = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("s", $order_number);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        // Regenerate if exists
        $order_number = 'ORD-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }
    $check_stmt->close();

    $final_amount = $total_amount - $discount_amount;

    // Start transaction
    $conn->begin_transaction();

    try {
        // Create order
        $order_sql = "INSERT INTO orders (user_id, order_number, total_amount, discount_amount, final_amount, 
                      status, payment_method, payment_status, shipping_address, shipping_city, 
                      shipping_country, shipping_postal_code, notes) 
                      VALUES (?, ?, ?, ?, ?, 'pending', ?, 'pending', ?, ?, ?, ?, ?)";
        $order_stmt = $conn->prepare($order_sql);
        $order_stmt->bind_param("isddsssssss", $user_id, $order_number, $total_amount, $discount_amount, 
                                $final_amount, $payment_method, $shipping_address, $shipping_city, 
                                $shipping_country, $shipping_postal, $notes);
        
        if (!$order_stmt->execute()) {
            throw new Exception('Failed to create order: ' . $order_stmt->error);
        }
        
        $order_id = $conn->insert_id;
        $order_stmt->close();

        // Create order items and update stock
        foreach ($cart_items as $item) {
            $unit_price = $item['price'];
            $item_quantity = $item['quantity'];
            $total_price = $unit_price * $item_quantity;
            
            // Insert order item
            $item_sql = "INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) 
                         VALUES (?, ?, ?, ?, ?, ?)";
            $item_stmt = $conn->prepare($item_sql);
            $item_stmt->bind_param("iisidd", $order_id, $item['product_id'], $item['name'], 
                                   $item_quantity, $unit_price, $total_price);
            
            if (!$item_stmt->execute()) {
                throw new Exception('Failed to create order item: ' . $item_stmt->error);
            }
            $item_stmt->close();
            
            // Update product stock
            $update_stock_sql = "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?";
            $update_stmt = $conn->prepare($update_stock_sql);
            $update_stmt->bind_param("ii", $item_quantity, $item['product_id']);
            
            if (!$update_stmt->execute()) {
                throw new Exception('Failed to update stock: ' . $update_stmt->error);
            }
            $update_stmt->close();
        }

        // Clear cart
        $clear_cart_sql = "DELETE FROM cart WHERE user_id = ?";
        $clear_stmt = $conn->prepare($clear_cart_sql);
        $clear_stmt->bind_param("i", $user_id);
        
        if (!$clear_stmt->execute()) {
            throw new Exception('Failed to clear cart: ' . $clear_stmt->error);
        }
        $clear_stmt->close();

        // Commit transaction
        $conn->commit();

        sendResponse('success', 'Order created successfully', [
            'order_id' => $order_id,
            'order_number' => $order_number,
            'total_amount' => number_format($total_amount, 2, '.', ''),
            'final_amount' => number_format($final_amount, 2, '.', '')
        ]);

    } catch (Exception $e) {
        // Rollback on error
        $conn->rollback();
        sendResponse('error', $e->getMessage());
    }

} elseif ($method === 'GET') {
    // Get orders
    $user_id = getCurrentUserId();
    if (!$user_id) {
        sendResponse('error', 'User not logged in');
    }

    $order_id = isset($_GET['id']) ? (int)$_GET['id'] : null;

    if ($order_id) {
        // Get specific order with items
        $order_sql = "SELECT o.*, u.username, u.email 
                      FROM orders o 
                      JOIN users u ON o.user_id = u.id 
                      WHERE o.id = ? AND o.user_id = ?";
        $order_stmt = $conn->prepare($order_sql);
        $order_stmt->bind_param("ii", $order_id, $user_id);
        $order_stmt->execute();
        $order_result = $order_stmt->get_result();

        if ($order_result->num_rows === 0) {
            $order_stmt->close();
            sendResponse('error', 'Order not found');
        }

        $order = $order_result->fetch_assoc();
        $order_stmt->close();

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

        sendResponse('success', 'Order retrieved', ['order' => $order]);
    } else {
        // Get all user orders
        $orders_sql = "SELECT o.*, 
                       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
                       FROM orders o 
                       WHERE o.user_id = ? 
                       ORDER BY o.created_at DESC";
        $orders_stmt = $conn->prepare($orders_sql);
        $orders_stmt->bind_param("i", $user_id);
        $orders_stmt->execute();
        $orders_result = $orders_stmt->get_result();

        $orders = [];
        while ($row = $orders_result->fetch_assoc()) {
            $orders[] = $row;
        }
        $orders_stmt->close();

        sendResponse('success', 'Orders retrieved', [
            'orders' => $orders,
            'count' => count($orders)
        ]);
    }

} elseif ($method === 'PUT') {
    // Update order status (admin function, but can be used by user to cancel)
    $data = getJsonInput();

    $user_id = getCurrentUserId();
    if (!$user_id) {
        sendResponse('error', 'User not logged in');
    }

    if (!isset($data['order_id']) || !isset($data['status'])) {
        sendResponse('error', 'Order ID and status are required');
    }

    $order_id = (int)$data['order_id'];
    $status = trim($data['status']);

    // Validate status
    $valid_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!in_array($status, $valid_statuses)) {
        sendResponse('error', 'Invalid status');
    }

    // Check if order belongs to user
    $check_sql = "SELECT id, status FROM orders WHERE id = ? AND user_id = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("ii", $order_id, $user_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows === 0) {
        $check_stmt->close();
        sendResponse('error', 'Order not found');
    }

    $order = $check_result->fetch_assoc();
    
    // Users can only cancel pending orders
    if ($status === 'cancelled' && $order['status'] !== 'pending') {
        $check_stmt->close();
        sendResponse('error', 'Only pending orders can be cancelled');
    }
    
    $check_stmt->close();

    // Update order status
    $update_sql = "UPDATE orders SET status = ? WHERE id = ? AND user_id = ?";
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param("sii", $status, $order_id, $user_id);

    if ($update_stmt->execute()) {
        $update_stmt->close();
        sendResponse('success', 'Order status updated');
    } else {
        $error = $update_stmt->error;
        $update_stmt->close();
        sendResponse('error', 'Failed to update order: ' . $error);
    }
} else {
    sendResponse('error', 'Method not allowed');
}
?>

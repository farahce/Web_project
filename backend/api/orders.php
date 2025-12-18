<?php global $conn;
/**
 * Orders API
 * GET /api/orders - Get user orders
 * POST /api/orders - Create new order
 */

// Check if user is logged in
if (!isLoggedIn()) {
    sendResponse('error', 'User not logged in');
}

$user_id = getCurrentUserId();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get user orders
    $sql = "SELECT * FROM orders WHERE user_id = $user_id ORDER BY created_at DESC";

    $result = $conn->query($sql);

    if (!$result) {
        sendResponse('error', 'Query failed: ' . $conn->error);
    }

    $orders = [];
    while ($row = $result->fetch_assoc()) {
        // Get order items
        $items_sql = "SELECT oi.*, p.name FROM order_items oi
                      JOIN products p ON oi.product_id = p.id
                      WHERE oi.order_id = " . $row['id'];

        $items_result = $conn->query($items_sql);
        $items = [];

        while ($item = $items_result->fetch_assoc()) {
            $items[] = $item;
        }

        $row['items'] = $items;
        $orders[] = $row;
    }

    sendResponse('success', 'Orders retrieved successfully', [
        'orders' => $orders,
        'count' => count($orders)
    ]);

} elseif ($method === 'POST') {
    // Create new order
    $data = getJsonInput();

    if (!isset($data['items']) || empty($data['items'])) {
        sendResponse('error', 'Order items are required');
    }

    // Start transaction
    $conn->begin_transaction();

    try {
        // Calculate total
        $total = 0;
        foreach ($data['items'] as $item) {
            $product_id = (int)$item['product_id'];
            $quantity = (int)$item['quantity'];

            // Get product price
            $price_sql = "SELECT price FROM products WHERE id = $product_id";
            $price_result = $conn->query($price_sql);

            if ($price_result->num_rows === 0) {
                throw new Exception("Product $product_id not found");
            }

            $product = $price_result->fetch_assoc();
            $total += $product['price'] * $quantity;
        }

        // Create order
        $order_sql = "INSERT INTO orders (user_id, total_price, status) 
                      VALUES ($user_id, $total, 'pending')";

        if (!$conn->query($order_sql)) {
            throw new Exception("Failed to create order: " . $conn->error);
        }

        $order_id = $conn->insert_id;

        // Add order items
        foreach ($data['items'] as $item) {
            $product_id = (int)$item['product_id'];
            $quantity = (int)$item['quantity'];

            $price_sql = "SELECT price FROM products WHERE id = $product_id";
            $price_result = $conn->query($price_sql);
            $product = $price_result->fetch_assoc();
            $price = $product['price'];

            $item_sql = "INSERT INTO order_items (order_id, product_id, quantity, price) 
                         VALUES ($order_id, $product_id, $quantity, $price)";

            if (!$conn->query($item_sql)) {
                throw new Exception("Failed to add order item: " . $conn->error);
            }
        }

        // Clear cart
        $clear_sql = "DELETE FROM cart WHERE user_id = $user_id";
        $conn->query($clear_sql);

        // Commit transaction
        $conn->commit();

        sendResponse('success', 'Order created successfully', [
            'order_id' => $order_id,
            'total' => $total,
            'status' => 'pending'
        ]);

    } catch (Exception $e) {
        // Rollback transaction
        $conn->rollback();
        sendResponse('error', 'Order creation failed: ' . $e->getMessage());
    }

} else {
    sendResponse('error', 'Method not allowed');
}

?>

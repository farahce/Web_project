<?php global $conn;
/**
 * Shopping Cart API
 * GET /api/cart - Get cart items
 * POST /api/cart - Add to cart
 * DELETE /api/cart - Remove from cart
 */

// Check if user is logged in
if (!isLoggedIn()) {
    sendResponse('error', 'User not logged in');
}

$user_id = getCurrentUserId();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get cart items
    $sql = "SELECT c.id, c.product_id, c.quantity, p.name, p.price, 
            (c.quantity * p.price) as subtotal
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = $user_id";

    $result = $conn->query($sql);

    if (!$result) {
        sendResponse('error', 'Query failed: ' . $conn->error);
    }

    $cart_items = [];
    $total = 0;

    while ($row = $result->fetch_assoc()) {
        $cart_items[] = $row;
        $total += $row['subtotal'];
    }

    sendResponse('success', 'Cart retrieved successfully', [
        'items' => $cart_items,
        'total' => $total,
        'item_count' => count($cart_items)
    ]);

} elseif ($method === 'POST') {
    // Add to cart
    $data = getJsonInput();

    if (!isset($data['product_id']) || !isset($data['quantity'])) {
        sendResponse('error', 'product_id and quantity are required');
    }

    $product_id = (int)$data['product_id'];
    $quantity = (int)$data['quantity'];

    // Check if product exists
    $check_sql = "SELECT id FROM products WHERE id = $product_id";
    $check_result = $conn->query($check_sql);

    if ($check_result->num_rows === 0) {
        sendResponse('error', 'Product not found');
    }

    // Check if item already in cart
    $existing_sql = "SELECT id, quantity FROM cart 
                     WHERE user_id = $user_id AND product_id = $product_id";
    $existing_result = $conn->query($existing_sql);

    if ($existing_result->num_rows > 0) {
        // Update quantity
        $existing = $existing_result->fetch_assoc();
        $new_quantity = $existing['quantity'] + $quantity;
        $update_sql = "UPDATE cart SET quantity = $new_quantity 
                       WHERE id = " . $existing['id'];

        if ($conn->query($update_sql) === TRUE) {
            sendResponse('success', 'Cart updated successfully');
        } else {
            sendResponse('error', 'Failed to update cart: ' . $conn->error);
        }
    } else {
        // Insert new item
        $insert_sql = "INSERT INTO cart (user_id, product_id, quantity) 
                       VALUES ($user_id, $product_id, $quantity)";

        if ($conn->query($insert_sql) === TRUE) {
            sendResponse('success', 'Item added to cart successfully');
        } else {
            sendResponse('error', 'Failed to add to cart: ' . $conn->error);
        }
    }

} elseif ($method === 'DELETE') {
    // Remove from cart
    $data = getJsonInput();

    if (!isset($data['cart_id'])) {
        sendResponse('error', 'cart_id is required');
    }

    $cart_id = (int)$data['cart_id'];

    $delete_sql = "DELETE FROM cart WHERE id = $cart_id AND user_id = $user_id";

    if ($conn->query($delete_sql) === TRUE) {
        sendResponse('success', 'Item removed from cart');
    } else {
        sendResponse('error', 'Failed to remove item: ' . $conn->error);
    }

} else {
    sendResponse('error', 'Method not allowed');
}

?>
<?php
/**
 * Cart API
 * POST /api/cart - Add to cart
 * GET /api/cart - Get cart items
 * DELETE /api/cart - Remove from cart
 */

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Add to cart
    $data = getJsonInput();

    if (!isset($data['product_id']) || !isset($data['quantity'])) {
        sendResponse('error', 'Product ID and quantity are required');
    }

    $user_id = getCurrentUserId();
    if (!$user_id) {
        sendResponse('error', 'User not logged in');
    }

    $product_id = (int)$data['product_id'];
    $quantity = (int)$data['quantity'];

    // Check if product exists
    $sql = "SELECT id FROM products WHERE id = $product_id";
    $result = $conn->query($sql);
    if ($result->num_rows === 0) {
        sendResponse('error', 'Product not found');
    }

    // Check if already in cart
    $sql = "SELECT id, quantity FROM cart WHERE user_id = $user_id AND product_id = $product_id";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        // Update quantity
        $row = $result->fetch_assoc();
        $new_quantity = $row['quantity'] + $quantity;
        $sql = "UPDATE cart SET quantity = $new_quantity WHERE user_id = $user_id AND product_id = $product_id";
    } else {
        // Insert new cart item
        $sql = "INSERT INTO cart (user_id, product_id, quantity) VALUES ($user_id, $product_id, $quantity)";
    }

    if ($conn->query($sql)) {
        sendResponse('success', 'Item added to cart');
    } else {
        sendResponse('error', 'Failed to add to cart: ' . $conn->error);
    }

} elseif ($method === 'GET') {
    // Get cart items
    $user_id = getCurrentUserId();
    if (!$user_id) {
        sendResponse('error', 'User not logged in');
    }

    $sql = "SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url 
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = $user_id";

    $result = $conn->query($sql);
    $cart_items = [];
    $total = 0;

    while ($row = $result->fetch_assoc()) {
        $row['subtotal'] = $row['price'] * $row['quantity'];
        $total += $row['subtotal'];
        $cart_items[] = $row;
    }

    sendResponse('success', 'Cart retrieved', [
        'items' => $cart_items,
        'total' => $total
    ]);

} elseif ($method === 'DELETE') {
    // Remove from cart
    $data = getJsonInput();

    if (!isset($data['cart_id'])) {
        sendResponse('error', 'Cart ID is required');
    }

    $user_id = getCurrentUserId();
    if (!$user_id) {
        sendResponse('error', 'User not logged in');
    }

    $cart_id = (int)$data['cart_id'];

    $sql = "DELETE FROM cart WHERE id = $cart_id AND user_id = $user_id";

    if ($conn->query($sql)) {
        sendResponse('success', 'Item removed from cart');
    } else {
        sendResponse('error', 'Failed to remove from cart');
    }
} else {
    sendResponse('error', 'Method not allowed');
}
?>
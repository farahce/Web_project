<?php
/**
 * Cart API
 * POST /api/cart - Add to cart
 * GET /api/cart - Get cart items
 * PUT /api/cart - Update cart item quantity
 * DELETE /api/cart - Remove from cart
 */

// Set headers (only if not already set)
if (!headers_sent()) {
    header('Content-Type: application/json');
    // Allow credentials - set specific origin instead of *
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    // Configure session cookie to work with credentials
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'None');
    ini_set('session.cookie_secure', '0'); // Set to 1 if using HTTPS
    session_start();
}

// Include database connection if not already included
if (!isset($conn)) {
    $conn = include '../config/database.php';
}

// Include functions if not already included
if (!function_exists('sendResponse')) {
    include '../includes/functions.php';
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Add to cart
    $data = getJsonInput();

    if (!isset($data['product_id']) || !isset($data['quantity'])) {
        sendResponse('error', 'Product ID and quantity are required');
    }

    $user_id = getCurrentUserId();
    if (!$user_id) {
        // Try to get user_id from request if session failed
        // This is a fallback for debugging - in production, sessions should work
        if (isset($data['user_id']) && !empty($data['user_id'])) {
            $user_id = (int)$data['user_id'];
            // Verify user exists
            $check_user = $conn->prepare("SELECT id FROM users WHERE id = ?");
            if ($check_user) {
                $check_user->bind_param("i", $user_id);
                $check_user->execute();
                $result = $check_user->get_result();
                if ($result->num_rows === 0) {
                    $check_user->close();
                    sendResponse('error', 'Invalid user ID');
                }
                $check_user->close();
                // Set session for future requests
                $_SESSION['user_id'] = $user_id;
            } else {
                sendResponse('error', 'User not logged in. Please login first.');
            }
        } else {
            // Debug: log session info
            $sessionInfo = [
                'session_id' => session_id(),
                'session_status' => session_status(),
                'session_data' => $_SESSION,
                'cookie' => $_COOKIE
            ];
            error_log('Cart API POST: User not logged in. Debug: ' . json_encode($sessionInfo));
            sendResponse('error', 'User not logged in. Please login first.');
        }
    }

    $product_id = (int)$data['product_id'];
    $quantity = (int)$data['quantity'];

    // Validate quantity
    if ($quantity < 1) {
        sendResponse('error', 'Quantity must be at least 1');
    }

    // Check if product exists and is available
    $check_sql = "SELECT id, name, price, stock_quantity, is_available FROM products WHERE id = ?";
    $check_stmt = $conn->prepare($check_sql);
    
    if (!$check_stmt) {
        sendResponse('error', 'Database error: ' . $conn->error);
    }
    
    $check_stmt->bind_param("i", $product_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows === 0) {
        $check_stmt->close();
        sendResponse('error', 'Product not found');
    }
    
    $product = $check_result->fetch_assoc();
    
    if (!$product['is_available']) {
        $check_stmt->close();
        sendResponse('error', 'Product is not available');
    }
    
    // Check stock
    if ($product['stock_quantity'] < $quantity) {
        $check_stmt->close();
        sendResponse('error', 'Insufficient stock. Available: ' . $product['stock_quantity']);
    }
    
    $check_stmt->close();

    // Check if already in cart
    $check_sql = "SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("ii", $user_id, $product_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows > 0) {
        // Update quantity
        $row = $check_result->fetch_assoc();
        $new_quantity = $row['quantity'] + $quantity;
        
        // Check total quantity against stock
        if ($product['stock_quantity'] < $new_quantity) {
            $check_stmt->close();
            sendResponse('error', 'Insufficient stock. Available: ' . $product['stock_quantity']);
        }
        
        $update_sql = "UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?";
        $update_stmt = $conn->prepare($update_sql);
        $update_stmt->bind_param("iii", $new_quantity, $row['id'], $user_id);
        
        if ($update_stmt->execute()) {
            $check_stmt->close();
            $update_stmt->close();
            sendResponse('success', 'Cart updated successfully');
        } else {
            $error = $update_stmt->error;
            $check_stmt->close();
            $update_stmt->close();
            sendResponse('error', 'Failed to update cart: ' . $error);
        }
    } else {
        // Insert new cart item
        $insert_sql = "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)";
        $insert_stmt = $conn->prepare($insert_sql);
        $insert_stmt->bind_param("iii", $user_id, $product_id, $quantity);
        
        if ($insert_stmt->execute()) {
            $check_stmt->close();
            $insert_stmt->close();
            sendResponse('success', 'Item added to cart');
        } else {
            $error = $insert_stmt->error;
            $check_stmt->close();
            $insert_stmt->close();
            sendResponse('error', 'Failed to add to cart: ' . $error);
        }
    }

} elseif ($method === 'GET') {
    // Get cart items
    $user_id = getCurrentUserId();
    if (!$user_id) {
        // Try to get user_id from query string as fallback
        if (isset($_GET['user_id']) && !empty($_GET['user_id'])) {
            $user_id = (int)$_GET['user_id'];
            // Verify user exists
            $check_user = $conn->prepare("SELECT id FROM users WHERE id = ?");
            if ($check_user) {
                $check_user->bind_param("i", $user_id);
                $check_user->execute();
                $result = $check_user->get_result();
                if ($result->num_rows === 0) {
                    $check_user->close();
                    sendResponse('error', 'Invalid user ID');
                }
                $check_user->close();
                // Set session for future requests
                $_SESSION['user_id'] = $user_id;
            } else {
                sendResponse('error', 'User not logged in');
            }
        } else {
            sendResponse('error', 'User not logged in');
        }
    }

    $sql = "SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url, p.stock_quantity, p.is_available
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        sendResponse('error', 'Database error: ' . $conn->error);
    }
    
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $cart_items = [];
    $total = 0;

    while ($row = $result->fetch_assoc()) {
        $row['subtotal'] = $row['price'] * $row['quantity'];
        $total += $row['subtotal'];
        $cart_items[] = $row;
    }
    $stmt->close();

    sendResponse('success', 'Cart retrieved', [
        'items' => $cart_items,
        'total' => number_format($total, 2, '.', ''),
        'item_count' => count($cart_items)
    ]);

} elseif ($method === 'PUT') {
    // Update cart item quantity
    $data = getJsonInput();

    if (!isset($data['cart_id']) || !isset($data['quantity'])) {
        sendResponse('error', 'Cart ID and quantity are required');
    }

    $user_id = getCurrentUserId();
    if (!$user_id) {
        sendResponse('error', 'User not logged in');
    }

    $cart_id = (int)$data['cart_id'];
    $quantity = (int)$data['quantity'];

    if ($quantity < 1) {
        sendResponse('error', 'Quantity must be at least 1');
    }

    // Get cart item with product info
    $check_sql = "SELECT c.id, c.product_id, p.stock_quantity 
                  FROM cart c 
                  JOIN products p ON c.product_id = p.id 
                  WHERE c.id = ? AND c.user_id = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("ii", $cart_id, $user_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows === 0) {
        $check_stmt->close();
        sendResponse('error', 'Cart item not found');
    }
    
    $cart_item = $check_result->fetch_assoc();
    
    if ($cart_item['stock_quantity'] < $quantity) {
        $check_stmt->close();
        sendResponse('error', 'Insufficient stock. Available: ' . $cart_item['stock_quantity']);
    }
    
    $check_stmt->close();

    // Update quantity
    $update_sql = "UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?";
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param("iii", $quantity, $cart_id, $user_id);

    if ($update_stmt->execute()) {
        $update_stmt->close();
        sendResponse('success', 'Cart item updated');
    } else {
        $error = $update_stmt->error;
        $update_stmt->close();
        sendResponse('error', 'Failed to update cart: ' . $error);
    }

} elseif ($method === 'DELETE') {
    // Remove from cart
    $data = getJsonInput();

    if (!isset($data['cart_id'])) {
        sendResponse('error', 'Cart ID is required');
    }

    $user_id = getCurrentUserId();
    if (!$user_id) {
        // Try fallback with user_id from request
        if (isset($data['user_id']) && !empty($data['user_id'])) {
            $user_id = (int)$data['user_id'];
            // Verify user exists
            $check_user = $conn->prepare("SELECT id FROM users WHERE id = ?");
            if ($check_user) {
                $check_user->bind_param("i", $user_id);
                $check_user->execute();
                $result = $check_user->get_result();
                if ($result->num_rows === 0) {
                    $check_user->close();
                    sendResponse('error', 'Invalid user ID');
                }
                $check_user->close();
                $_SESSION['user_id'] = $user_id;
            } else {
                sendResponse('error', 'User not logged in');
            }
        } else {
            sendResponse('error', 'User not logged in');
        }
    }

    $cart_id = (int)$data['cart_id'];

    $sql = "DELETE FROM cart WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        sendResponse('error', 'Database error: ' . $conn->error);
    }
    
    $stmt->bind_param("ii", $cart_id, $user_id);

    if ($stmt->execute()) {
        $stmt->close();
        sendResponse('success', 'Item removed from cart');
    } else {
        $error = $stmt->error;
        $stmt->close();
        sendResponse('error', 'Failed to remove from cart: ' . $error);
    }
} else {
    sendResponse('error', 'Method not allowed');
}
?>

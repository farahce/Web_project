<?php
/**
 * User Dashboard API
 * GET /api/dashboard - Get user stats, profile, and orders
 * POST /api/dashboard - Update profile or redeem points
 */

// Set CORS headers
if (!headers_sent()) {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../includes/functions.php';
global $conn;

// Require login
$user_id = getCurrentUserId();
if (!$user_id) {
    sendResponse('error', 'Unauthorized. Please login first.', [], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // 1. Get User Details
    $sql = "SELECT username, email, phone, address, city, postal_code as zip, points FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) {
        sendResponse('error', 'User not found');
    }

    // 2. Get Orders
    $orders_sql = "SELECT id, order_number, total_amount, final_amount, status, created_at as date,
                   (SELECT COUNT(*) FROM order_items WHERE order_id = orders.id) as item_count
                   FROM orders 
                   WHERE user_id = ? 
                   ORDER BY created_at DESC";
    $stmt = $conn->prepare($orders_sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $orders = [];
    $total_spent = 0;
    while ($row = $result->fetch_assoc()) {
        // Fetch items for each order (simplified for dashboard view)
        $order_id = $row['id'];
        $items_sql = "SELECT product_name as name, quantity, unit_price as price FROM order_items WHERE order_id = ?";
        $item_stmt = $conn->prepare($items_sql);
        $item_stmt->bind_param("i", $order_id);
        $item_stmt->execute();
        $items_result = $item_stmt->get_result();
        $row['items'] = [];
        while($item = $items_result->fetch_assoc()) {
            $row['items'][] = $item;
        }
        $item_stmt->close();

        // Add shipping info structure (mocked from user profile if not in order)
        $row['shipping'] = [
            'address' => $row['shipping_address'] ?? $user['address'],
            'city' => $row['shipping_city'] ?? $user['city']
        ];
        
        // Normalize 'final_amount' to 'total' for frontend compatibility
        $row['total'] = (float)$row['final_amount'];
        
        $orders[] = $row;
        $total_spent += $row['total'];
    }
    $stmt->close();

    // 3. Return Data
    sendResponse('success', 'Dashboard data retrieved', [
        'user' => $user,
        'orders' => $orders,
        'stats' => [
            'total_orders' => count($orders),
            'total_spent' => $total_spent,
            'points' => $user['points']
        ]
    ]);

} elseif ($method === 'POST') {
    $data = getJsonInput();
    $action = $data['action'] ?? 'update_profile';

    if ($action === 'update_profile') {
        // Update Profile
        $first_name = ''; // We only have username, so we'll skip name splitting or handle it if you added columns.
        // Assuming user.js logic just updates what it has.
        // Let's update the fields we have in DB: username, email, phone, address, city, postal_code
        
        // Note: Changing email/username might check for duplicates, simpler for now.
        $phone = $data['phone'] ?? '';
        $address = $data['address'] ?? '';
        $city = $data['city'] ?? '';
        $zip = $data['zip'] ?? '';

        $sql = "UPDATE users SET phone = ?, address = ?, city = ?, postal_code = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssi", $phone, $address, $city, $zip, $user_id);
        
        if ($stmt->execute()) {
             sendResponse('success', 'Profile updated successfully');
        } else {
             sendResponse('error', 'Failed to update profile: ' . $stmt->error);
        }
        $stmt->close();

    } elseif ($action === 'redeem') {
        // Redeem Points
        $points_to_redeem = (int)($data['points'] ?? 0);
        
        if ($points_to_redeem <= 0) {
            sendResponse('error', 'Invalid points amount');
        }

        // Check balance
        $check_sql = "SELECT points FROM users WHERE id = ?";
        $stmt = $conn->prepare($check_sql);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $current_points = $stmt->get_result()->fetch_assoc()['points'];
        $stmt->close();

        if ($current_points < $points_to_redeem) {
             sendResponse('error', 'Insufficient points');
        }

        // Deduct points
        $update_sql = "UPDATE users SET points = points - ? WHERE id = ?";
        $stmt = $conn->prepare($update_sql);
        $stmt->bind_param("ii", $points_to_redeem, $user_id);
        
        if ($stmt->execute()) {
            // Ideally record the redemption in a ledger table
            sendResponse('success', 'Reward redeemed successfully', ['new_balance' => $current_points - $points_to_redeem]);
        } else {
            sendResponse('error', 'Transaction failed');
        }
        $stmt->close();
    }
}
?>

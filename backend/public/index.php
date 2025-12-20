<?php
/**
 * Main Entry Point
 * API Router
 */

// Enable error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Content-Type: application/json');
// Allow credentials for session management
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session with proper cookie settings for cross-origin requests
if (session_status() === PHP_SESSION_NONE) {
    // Configure session cookie to work with credentials
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax'); // Lax is better for localhost/same-origin
    ini_set('session.cookie_secure', '0'); // Set to 1 if using HTTPS
    session_start();
}

// Include database connection
$conn = include '../config/database.php';

// Include functions
include '../includes/functions.php';

// Get request path
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_method = $_SERVER['REQUEST_METHOD'];

// DEBUG LOG
file_put_contents(__DIR__ . '/../../api_debug.log', date('[Y-m-d H:i:s] ') . "Request: $request_method $request_uri\n", FILE_APPEND);

// Simple routing
if (strpos($request_uri, '/api/register') !== false) {
    include '../api/register.php';
} elseif (strpos($request_uri, '/api/login') !== false) {
    include '../api/login.php';
} elseif (strpos($request_uri, '/api/logout') !== false) {
    include '../api/logout.php';
} elseif (strpos($request_uri, '/api/admin/products') !== false) {
    include '../admin/products.php';
} elseif (strpos($request_uri, '/api/admin/orders') !== false) {
    include '../admin/orders.php';
} elseif (strpos($request_uri, '/api/admin/customers') !== false) {
    include '../admin/customers.php';
} elseif (strpos($request_uri, '/api/admin/dashboard') !== false) {
    include '../admin/dashboard.php';
} elseif (strpos($request_uri, '/api/admin/analytics') !== false) {
    include '../admin/analytics.php';
} elseif (strpos($request_uri, '/api/products') !== false) {
    include '../api/products.php';
} elseif (strpos($request_uri, '/api/cart') !== false) {
    include '../api/cart.php';
} elseif (strpos($request_uri, '/api/orders') !== false) {
    include '../api/orders.php';
} elseif (strpos($request_uri, '/api/notifications') !== false) {
    include '../api/notifications.php';
} elseif (strpos($request_uri, '/api/dashboard') !== false) {
    include '../api/dashboard.php';
} elseif (strpos($request_uri, '/api/messages') !== false) {
    include '../api/messages.php';
} else {
    sendResponse('success', 'Dafah API is running!', [
        'version' => '1.0.0',
        'endpoints' => [
            'POST /api/register' => 'Register new user',
            'POST /api/login' => 'Login user',
            'POST /api/logout' => 'Logout user',
            'GET /api/products' => 'Get all products',
            'GET /api/products?category=donuts' => 'Get products by category',
            'GET /api/products?id=1' => 'Get specific product',
            'POST /api/cart' => 'Add to cart',
            'GET /api/cart' => 'Get cart items',
            'PUT /api/cart' => 'Update cart item quantity',
            'DELETE /api/cart' => 'Remove from cart',
            'POST /api/orders' => 'Create order',
            'GET /api/orders' => 'Get user orders',
            'GET /api/orders?id=1' => 'Get specific order',
            'PUT /api/orders' => 'Update order status'
        ]
    ]);
}

$conn->close();
?>
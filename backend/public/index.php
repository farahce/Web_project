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
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session
session_start();

// Include database connection
$conn = include '../config/database.php';

// Include functions
include '../includes/functions.php';

// Get request path
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_method = $_SERVER['REQUEST_METHOD'];

// Simple routing
if (strpos($request_uri, '/api/register') !== false) {
    include '../api/register.php';
} elseif (strpos($request_uri, '/api/login') !== false) {
    include '../api/login.php';
} elseif (strpos($request_uri, '/api/products') !== false) {
    include '../api/products.php';
} elseif (strpos($request_uri, '/api/cart') !== false) {
    include '../api/cart.php';
} elseif (strpos($request_uri, '/api/orders') !== false) {
    include '../api/orders.php';
} else {
    sendResponse('success', 'Dafah API is running!', [
        'version' => '1.0.0',
        'endpoints' => [
            'POST /api/register' => 'Register new user',
            'POST /api/login' => 'Login user',
            'GET /api/products' => 'Get all products',
            'GET /api/products?category=donuts' => 'Get products by category',
            'POST /api/cart' => 'Add to cart',
            'GET /api/cart' => 'Get cart items',
            'POST /api/orders' => 'Create order'
        ]
    ]);
}

$conn->close();
?>

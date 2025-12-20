<?php
/**
 * User Login API
 * POST /api/login
 */

// Set headers (only if not already set)
if (!headers_sent()) {
    header('Content-Type: application/json');
    // Allow credentials - set specific origin instead of *
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session if not already started
// (Session is now handled by functions.php)

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
    // Get JSON input
    $data = getJsonInput();

    // Validate required fields
    if (!isset($data['email']) || !isset($data['password'])) {
        sendResponse('error', 'Email and password are required');
    }

    $email = trim($data['email']);
    $password = $data['password'];

    // Validate email
    if (!isValidEmail($email)) {
        sendResponse('error', 'Invalid email format');
    }

    // Validate password not empty
    if (empty($password)) {
        sendResponse('error', 'Password is required');
    }

    // Find user using prepared statement
    $sql = "SELECT id, username, email, password, role, is_active FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        sendResponse('error', 'Database error: ' . $conn->error);
    }

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        $stmt->close();
        sendResponse('error', 'Invalid email or password');
    }

    $user = $result->fetch_assoc();
    $stmt->close();

    // Check if user is active
    if (!$user['is_active']) {
        sendResponse('error', 'Account is deactivated. Please contact support.');
    }

    // Verify password
    // Verify password (simple comparison for development)
    if ($password !== $user['password']) {
        sendResponse('error', 'Invalid email or password');
    }

    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['role'] = $user['role'];

    sendResponse('success', 'Login successful', [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role']
    ]);
} else {
    sendResponse('error', 'Method not allowed');
}
?>
<?php
/**
 * User Registration API
 * POST /api/register
 */

// Set headers (only if not already set)
if (!headers_sent()) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
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
    // Get JSON input
    $data = getJsonInput();

    // Validate required fields
    if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
        sendResponse('error', 'Username, email, and password are required');
    }

    $username = trim($data['username']);
    $email = trim($data['email']);
    $password = $data['password'];
    $phone = isset($data['phone']) ? trim($data['phone']) : '';
    $address = isset($data['address']) ? trim($data['address']) : '';
    $city = isset($data['city']) ? trim($data['city']) : '';
    $country = isset($data['country']) ? trim($data['country']) : '';
    $postal = isset($data['postal_code']) ? trim($data['postal_code']) : '';

    // Validate username
    if (empty($username) || strlen($username) < 3) {
        sendResponse('error', 'Username must be at least 3 characters long');
    }

    // Validate email
    if (!isValidEmail($email)) {
        sendResponse('error', 'Invalid email format');
    }

    // Validate password strength
    if (!isStrongPassword($password)) {
        sendResponse('error', 'Password must be at least 8 characters with uppercase, lowercase, and number');
    }

    // Check if email already exists
    $check_sql = "SELECT id FROM users WHERE email = ?";
    $check_stmt = $conn->prepare($check_sql);
    
    if (!$check_stmt) {
        sendResponse('error', 'Database error: ' . $conn->error);
    }
    
    $check_stmt->bind_param("s", $email);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows > 0) {
        $check_stmt->close();
        sendResponse('error', 'Email already exists');
    }
    $check_stmt->close();

    // Check if username already exists
    $check_sql = "SELECT id FROM users WHERE username = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("s", $username);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows > 0) {
        $check_stmt->close();
        sendResponse('error', 'Username already exists');
    }
    $check_stmt->close();

    // Hash password
    $hashedPassword = hashPassword($password);

    // Insert user
    $insert_sql = "INSERT INTO users (username, email, password, phone, address, city, country, postal_code, is_active) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)";
    $stmt = $conn->prepare($insert_sql);
    
    if (!$stmt) {
        sendResponse('error', 'Database error: ' . $conn->error);
    }
    
    $stmt->bind_param("ssssssss", $username, $email, $hashedPassword, $phone, $address, $city, $country, $postal);

    if ($stmt->execute()) {
        $user_id = $conn->insert_id;
        $stmt->close();
        
        sendResponse('success', 'Registration successful', [
            'user_id' => $user_id,
            'username' => $username,
            'email' => $email
        ]);
    } else {
        $error = $stmt->error;
        $stmt->close();
        sendResponse('error', 'Registration failed: ' . $error);
    }
} else {
    sendResponse('error', 'Method not allowed');
}
?>

<?php
/**
 * Common Functions
 * Reusable functions for all API endpoints
 */

/**
 * Send JSON response
 */
function sendResponse($status, $message, $data = null) {
    $response = [
        'status' => $status,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    if ($data !== null) {
        $response['data'] = $data;
    }

    echo json_encode($response);
    exit;
}

/**
 * Validate email
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate password strength
 */
function isStrongPassword($password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password);
}

/**
 * Hash password
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Sanitize input
 */
function sanitize($conn, $input) {
    return $conn->real_escape_string(trim($input));
}

/**
 * Get JSON input
 */
function getJsonInput() {
    $input = file_get_contents("php://input");
    return json_decode($input, true);
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
    return isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
}

/**
 * Log activity
 */
function logActivity($conn, $user_id, $action, $details = null) {
    $action = $conn->real_escape_string($action);
    $details = $details ? $conn->real_escape_string($details) : null;

    $sql = "INSERT INTO activity_log (user_id, action, details)
            VALUES ($user_id, '$action', '$details')";

    return $conn->query($sql);
}

?>

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
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse('error', 'Invalid JSON input: ' . json_last_error_msg());
    }
    
    return $data ? $data : [];
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

/**
 * Get current user ID
 * Checks session first, then falls back to checking Authorization header or request body
 */
function getCurrentUserId() {
    // First check session (primary method)
    if (isset($_SESSION['user_id'])) {
        return $_SESSION['user_id'];
    }
    
    // Fallback: Check if user_id is in request body (for debugging/fallback)
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    if (isset($data['user_id'])) {
        // Verify the user_id is valid by checking database
        global $conn;
        $user_id = (int)$data['user_id'];
        $check = $conn->prepare("SELECT id FROM users WHERE id = ?");
        if ($check) {
            $check->bind_param("i", $user_id);
            $check->execute();
            $result = $check->get_result();
            if ($result->num_rows > 0) {
                $check->close();
                // Set session for future requests
                $_SESSION['user_id'] = $user_id;
                return $user_id;
            }
            $check->close();
        }
    }
    
    return null;
}

/**
 * Log activity (if activity_log table exists)
 */
function logActivity($conn, $user_id, $action, $details = null) {
    // Check if table exists first
    $check_table = $conn->query("SHOW TABLES LIKE 'activity_log'");
    if ($check_table->num_rows === 0) {
        return false; // Table doesn't exist
    }
    
    // Use prepared statement for security
    $sql = "INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        return false;
    }
    
    $stmt->bind_param("iss", $user_id, $action, $details);
    $result = $stmt->execute();
    $stmt->close();
    
    return $result;
}

?>

<?php
/**
 * Global Session Initialization
 * Ensures session is started consistently across all entry points
 */
function startSession() {
    if (session_status() === PHP_SESSION_NONE) {
        // Enforce secure/consistent session settings
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_samesite', 'Lax');
        ini_set('session.cookie_path', '/'); // Crucial: shared across all directories
        ini_set('session.cookie_secure', '0'); // Set to 1 for HTTPS
        session_start();
    }
}

// Auto-start session when functions are included
startSession();


/**
 * Send JSON response
 */
function sendResponse($status, $message, $data = null) {
    header('Content-Type: application/json');

    echo json_encode([
        'status' => $status,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit; // 🔥 REQUIRED
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
 * Get current user role
 */
function getCurrentUserRole() {
    return isset($_SESSION['role']) ? $_SESSION['role'] : null;
}

/**
 * Check if user is admin
 */
function isAdmin() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

/**
 * Check if user is regular user
 */
function isUser() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'user';
}

/**
 * Require admin role - redirect if not admin
 */
function requireAdmin() {
    if (!isAdmin()) {
        // Debugging Session State
        $role = isset($_SESSION['role']) ? $_SESSION['role'] : 'guest';
        $uid = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'null';
        $sid = session_id();
        
        sendResponse('error', "Access denied. Admin privileges required. (Debug: Role=$role, UID=$uid, SessionID=$sid)");
    }
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

/**
 * Send real email via Brevo API
 */
function sendRealEmail($to, $subject, $content, $toName = "") {
    if (!defined('BREVO_API_KEY')) {
        require_once dirname(__DIR__) . '/config/secrets.php';
    }
    $apiKey = BREVO_API_KEY;
    
    $url = 'https://api.brevo.com/v3/smtp/email';
    
    $data = [
        'sender' => [
            'name' => 'Dafah Store',
            'email' => 'danaimad04@gmail.com' // You can change this to your verified sender
        ],
        'to' => [
            [
                'email' => $to,
                'name' => $toName
            ]
        ],
        'subject' => $subject,
        'htmlContent' => $content
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'api-key: ' . $apiKey,
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        return true;
    } else {
        error_log("Brevo API Error ($httpCode): " . $response);
        return false;
    }
}

?>

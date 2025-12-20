<?php
/**
 * Notifications API
 * POST /api/notifications
 * Payload: { type: 'sms'|'email', recipient: string, subject?: string, message: string }
 */

// Set headers
if (!headers_sent()) {
    header('Content-Type: application/json');
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include dependencies
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'None'); 
    ini_set('session.cookie_secure', '0');
    session_start();
}

if (!isset($conn)) {
    $conn = include '../config/database.php';
}

if (!function_exists('getJsonInput')) {
    function getJsonInput() {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}

if (!function_exists('sendResponse')) {
    function sendResponse($status, $message, $data = null) {
        echo json_encode(['status' => $status, 'message' => $message, 'data' => $data]);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getJsonInput();

    // Validate
    if (empty($data['type']) || empty($data['recipient']) || empty($data['message'])) {
        sendResponse('error', 'Missing required fields: type, recipient, message');
    }

    $type = $data['type'];
    $recipient = trim($data['recipient']);
    $message = $data['message'];
    $subject = isset($data['subject']) ? $data['subject'] : null;

    if (!in_array($type, ['sms', 'email'])) {
        sendResponse('error', 'Invalid type. Must be sms or email');
    }

    // Insert into notifications table
    $stmt = $conn->prepare("INSERT INTO notifications (type, recipient, subject, message, status) VALUES (?, ?, ?, ?, 'pending')");
    
    if (!$stmt) {
        sendResponse('error', 'Database error: ' . $conn->error);
    }

    $stmt->bind_param("ssss", $type, $recipient, $subject, $message);

    if ($stmt->execute()) {
        $notificationId = $stmt->insert_id;
        $stmt->close();
        
        // 🚀 ATTEMPT TO SEND REAL NOTIFICATION
        $sent = false;
        
        if ($type === 'email') {
            // Send Real Email using Brevo API
            $sent = sendRealEmail($recipient, $subject, $message, "Customer");
        }
        
        // Update status if sent (simulated or real)
        $status = $sent ? 'sent' : 'failed'; 
        $conn->query("UPDATE notifications SET status = '$status' WHERE id = $notificationId");
        
        sendResponse('success', 'Notification processed', ['notification_id' => $notificationId]);

    } else {
        $error = $stmt->error;
        $stmt->close();
        sendResponse('error', 'Failed to send notification: ' . $error);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $recipient = isset($_GET['recipient']) ? trim($_GET['recipient']) : null;

    if ($recipient) {
        // User: Fetch only their notifications
        $stmt = $conn->prepare("SELECT * FROM notifications WHERE recipient = ? ORDER BY created_at DESC LIMIT 50");
        $stmt->bind_param("s", $recipient);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        // Admin: Fetch all notifications
        $sql = "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50";
        $result = $conn->query($sql);
    }
    
    $notifications = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $notifications[] = $row;
        }
    }
    
    sendResponse('success', 'Notifications retrieved', $notifications);

} else {
    sendResponse('error', 'Method not allowed');
}
?>

<?php
/**
 * Messages API
 * POST /api/messages - Submit a new contact message
 * GET /api/messages - Get all messages (Admin only)
 */

if (!headers_sent()) {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../includes/functions.php';
global $conn;

$method = $_SERVER['REQUEST_METHOD'];

// Ensure table exists
$conn->query("CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Check if phone column exists (in case table was created before)
$result = $conn->query("SHOW COLUMNS FROM messages LIKE 'phone'");
if ($result->num_rows == 0) {
    $conn->query("ALTER TABLE messages ADD COLUMN phone VARCHAR(50) AFTER email");
}

if ($method === 'POST') {
    // Submit new message (Public)
    $data = getJsonInput();
    
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? '';
    $subject = $data['subject'] ?? '';
    $message = $data['message'] ?? '';
    
    // Validate
    if (empty($name) || empty($email) || empty($message)) {
        sendResponse('error', 'Please fill in all required fields');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse('error', 'Invalid email address');
    }
    
    $stmt = $conn->prepare("INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)");
    
    if (!$stmt) {
        sendResponse('error', 'Database Error: Prepare Failed');
    }
    
    $stmt->bind_param("sssss", $name, $email, $phone, $subject, $message);
    
    if ($stmt->execute()) {
        // 📧 SEND NOTIFICATION EMAIL TO ADMIN
        $adminEmail = 'danaimad04@gmail.com'; // Admin's email
        $emailSubject = "New Contact Message: " . $subject;
        $emailBody = "
            <h2>New Message Received</h2>
            <p><strong>Name:</strong> $name</p>
            <p><strong>Email:</strong> $email</p>
            <p><strong>Phone:</strong> $phone</p>
            <p><strong>Subject:</strong> $subject</p>
            <p><strong>Message:</strong></p>
            <p>$message</p>
            <hr>
            <p>Sent via Dafah Store Contact Form</p>
        ";
        
        sendRealEmail($adminEmail, $emailSubject, $emailBody, "Admin");
        
        sendResponse('success', 'Message sent successfully');
    } else {
        error_log("Message error: " . $stmt->error);
        sendResponse('error', 'Failed to send message');
    }
    $stmt->close();
    
} elseif ($method === 'GET') {
    // Get messages (Admin only)
    requireAdmin();
    
    $sql = "SELECT * FROM messages ORDER BY created_at DESC";
    $result = $conn->query($sql);
    
    if (!$result) {
        error_log("Database error: " . $conn->error);
        sendResponse('error', 'Database error reading messages');
    }
    
    $messages = [];
    while ($row = $result->fetch_assoc()) {
        $messages[] = $row;
    }
    
    // Log count for debugging
    error_log("Retrieved " . count($messages) . " messages");
    
    sendResponse('success', 'Messages retrieved', $messages);
} elseif ($method === 'DELETE') {
    // Delete message (Admin only)
    requireAdmin();
    $data = getJsonInput();
    $id = $data['id'] ?? null;

    if (!$id) {
        sendResponse('error', 'Message ID required');
    }

    $stmt = $conn->prepare("DELETE FROM messages WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        sendResponse('success', 'Message deleted successfully');
    } else {
        error_log("Delete error: " . $stmt->error);
        sendResponse('error', 'Failed to delete message');
    }
    $stmt->close();
}
?>

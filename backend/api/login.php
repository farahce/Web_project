<?php global $conn;
/**
 * User Login API
 * POST /api/login
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

// INCLUDE THESE FIRST!
$conn = include '../config/database.php';
include '../includes/functions.php';

// NOW use the functions
// Get JSON input
$data = getJsonInput();

// Validate required fields
if (!isset($data['email']) || !isset($data['password'])) {
    sendResponse('error', 'Email and password are required');
}

// Sanitize input
$email = sanitize($conn, $data['email']);
$password = $data['password'];

// Validate email
if (!isValidEmail($email)) {
    sendResponse('error', 'Invalid email format');
}

// Find user
$sql = "SELECT id, username, email, password FROM users WHERE email = '$email'";
$result = $conn->query($sql);

if ($result->num_rows === 0) {
    sendResponse('error', 'User not found');
}

$user = $result->fetch_assoc();

// Verify password
if (!verifyPassword($password, $user['password'])) {
    sendResponse('error', 'Invalid password');
}

// Set session
$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['email'] = $user['email'];

// Log activity
logActivity($conn, $user['id'], 'login', 'User logged in');

sendResponse('success', 'Login successful', [
    'user_id' => $user['id'],
    'username' => $user['username'],
    'email' => $user['email']
]);

?>

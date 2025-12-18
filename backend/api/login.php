<?php
/**
 * User Registration API
 * POST /api/register
 */

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Get JSON input
    $data = getJsonInput();

    // Validate required fields
    if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
        sendResponse('error', 'Username, email, and password are required');
    }

    // Sanitize input
    $username = sanitize($conn, $data['username']);
    $email = sanitize($conn, $data['email']);
    $password = $data['password'];

    // Validate email
    if (!isValidEmail($email)) {
        sendResponse('error', 'Invalid email format');
    }

    // Check if user already exists
    $sql = "SELECT id FROM users WHERE email = '$email'";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        sendResponse('error', 'Email already registered');
    }

    // Hash password
    $hashed_password = hashPassword($password);

    // Insert user
    $sql = "INSERT INTO users (username, email, password) VALUES ('$username', '$email', '$hashed_password')";

    if ($conn->query($sql)) {
        $user_id = $conn->insert_id;
        sendResponse('success', 'Registration successful', [
            'user_id' => $user_id,
            'username' => $username,
            'email' => $email
        ]);
    } else {
        sendResponse('error', 'Registration failed: ' . $conn->error);
    }
} else {
    sendResponse('error', 'Method not allowed');
}
?>

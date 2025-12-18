<?php global $conn;
/**
 * User Registration API
 * POST /api/register
 */

// Get JSON input
$data = getJsonInput();

// Validate required fields
if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
    sendResponse('error', 'Missing required fields: username, email, password');
}

// Sanitize input
$username = sanitize($conn, $data['username']);
$email = sanitize($conn, $data['email']);
$password = $data['password'];
$full_name = sanitize($conn, isset($data['full_name']) ? $data['full_name'] : '');

// Validate email
if (!isValidEmail($email)) {
    sendResponse('error', 'Invalid email format');
}

// Validate password strength
if (!isStrongPassword($password)) {
    sendResponse('error', 'Password must be at least 8 characters with uppercase, lowercase, and numbers');
}

// Check if user already exists
$check_sql = "SELECT id FROM users WHERE email = '$email' OR username = '$username'";
$check_result = $conn->query($check_sql);

if ($check_result->num_rows > 0) {
    sendResponse('error', 'User already exists with this email or username');
}

// Hash password
$hashed_password = hashPassword($password);

// Insert user
$insert_sql = "INSERT INTO users (username, email, password, full_name) 
               VALUES ('$username', '$email', '$hashed_password', '$full_name')";

if ($conn->query($insert_sql) === TRUE) {
    $user_id = $conn->insert_id;

    sendResponse('success', 'User registered successfully', [
        'user_id' => $user_id,
        'username' => $username,
        'email' => $email
    ]);
} else {
    sendResponse('error', 'Registration failed: ' . $conn->error);
}

?>


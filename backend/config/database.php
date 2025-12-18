<?php
/**
 * Database Configuration File
 * This file contains all database connection settings
 */

// Database credentials
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '12217108'); // ⚠️ CHANGE THIS!
define('DB_NAME', 'dafah_db');
define('DB_PORT', 3306);

// Create connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

// Set charset to UTF-8
if (!$conn->set_charset("utf8")) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Error loading character set utf8: ' . $conn->error
    ]));
}

// Return connection for use in other files
return $conn;
?>
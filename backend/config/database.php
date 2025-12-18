<?php
/**
 * Database Connection
 * Returns mysqli connection object
 */

$hostname = "localhost";
$username = "root";
$password = "";
$database = "dafah_db";
$port = 3306;

// Create connection
$conn = new mysqli($hostname, $username, $password, $database, $port);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

// Set charset
$conn->set_charset("utf8");

// Return connection object
return $conn;
?>
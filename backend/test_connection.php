<?php
/**
 * Database Connection Test Script
 * This file tests if PHP can connect to MySQL
 */

// Database credentials - EXPLICIT EMPTY PASSWORD
$hostname = "localhost";
$username = "root";
$password = ""; // EMPTY - NO PASSWORD
$database = "dafah_db";
$port = 3306;

echo "Testing connection with:\n";
echo "Host: $hostname\n";
echo "User: $username\n";
echo "Password: " . (empty($password) ? "EMPTY" : "SET") . "\n";
echo "Database: $database\n";
echo "Port: $port\n\n";

// Create connection
$conn = new mysqli($hostname, $username, $password, $database, $port);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $conn->connect_error,
        'error_code' => $conn->connect_errno
    ]));
}

// If we get here, connection is successful
$response = [
    'status' => 'success',
    'message' => 'Database connection successful!',
    'server_info' => $conn->server_info,
    'database' => $database,
    'host' => $hostname,
    'port' => $port
];

// Try to get table count
$result = $conn->query("SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = '$database'");
if ($result) {
    $row = $result->fetch_assoc();
    $response['tables_count'] = $row['table_count'];
}

// List all tables
$tables_result = $conn->query("SHOW TABLES FROM $database");
$tables = [];
if ($tables_result) {
    while ($row = $tables_result->fetch_row()) {
        $tables[] = $row[0];
    }
}
$response['tables'] = $tables;

$conn->close();

// Return JSON response
header('Content-Type: application/json');
echo json_encode($response, JSON_PRETTY_PRINT);
?>

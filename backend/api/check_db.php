<?php
require_once '../includes/functions.php';
global $conn;

$result = $conn->query("SELECT COUNT(*) as count FROM messages");
if ($result) {
    $row = $result->fetch_assoc();
    echo "Message count: " . $row['count'] . "\n";
} else {
    echo "Error: " . $conn->error . "\n";
}

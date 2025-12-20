<?php
require_once 'config/database.php';

// Add points column if it doesn't exist
$sql = "SHOW COLUMNS FROM users LIKE 'points'";
$result = $conn->query($sql);

if ($result->num_rows == 0) {
    $sql = "ALTER TABLE users ADD COLUMN points INT DEFAULT 0";
    if ($conn->query($sql) === TRUE) {
        echo "Points column added successfully";
    } else {
        echo "Error adding points column: " . $conn->error;
    }
} else {
    echo "Points column already exists";
}

$conn->close();
?>

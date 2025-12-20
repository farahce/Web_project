// webdf/backend/test_db_connection.php
<?php
$hostname = "localhost";
$username = "root";
$password = "";
$database = "dafah_db";
$port = 3306;

$conn = new mysqli($hostname, $username, $password, $database, $port);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql = "SELECT username, role FROM users WHERE role = 'admin'";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    echo "Database connection successful! Admin user found:  
";
    while($row = $result->fetch_assoc()) {
        echo "Username: " . $row["username"]. " - Role: " . $row["role"]. "  
";
    }
} else {
    echo "Database connection successful, but no admin user found. Did you run the database.sql script?";
}

$conn->close();
?>

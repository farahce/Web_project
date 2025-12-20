<?php
/**
 * Quick Admin Access Checker
 * Place in: backend/check_admin.php
 * Access: http://yoursite.com/backend/check_admin.php
 */

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include database
$conn = include 'config/database.php';
include 'includes/functions.php';

// Simple text output
header('Content-Type: text/plain; charset=utf-8');

echo "================================================================================\n";
echo "                    ADMIN ACCESS QUICK CHECK\n";
echo "================================================================================\n\n";

// 1. Session Check
echo "1. SESSION CHECK\n";
echo "   Status: " . (session_status() === PHP_SESSION_ACTIVE ? "ACTIVE ✓" : "INACTIVE ✗") . "\n";
echo "   Session ID: " . (session_id() ?: "NOT SET ✗") . "\n";

if (empty($_SESSION)) {
    echo "   Variables: EMPTY ✗\n";
    echo "   → User not logged in on backend\n";
} else {
    echo "   Variables: " . count($_SESSION) . " items ✓\n";
}
echo "\n";

// 2. Session Variables
echo "2. SESSION VARIABLES\n";
if (empty($_SESSION)) {
    echo "   (empty)\n";
} else {
    foreach ($_SESSION as $key => $value) {
        echo "   $key: " . (is_array($value) ? json_encode($value) : $value) . "\n";
    }
}
echo "\n";

// 3. Authentication Check
echo "3. AUTHENTICATION CHECK\n";
$isAdmin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
$isUser = isset($_SESSION['role']) && $_SESSION['role'] === 'user';

echo "   isAdmin(): " . ($isAdmin ? "TRUE ✓" : "FALSE ✗") . "\n";
echo "   isUser(): " . ($isUser ? "TRUE ✓" : "FALSE ✗") . "\n";
echo "   Current Role: " . (isset($_SESSION['role']) ? $_SESSION['role'] : "NOT SET ✗") . "\n";
echo "\n";

// 4. Database Check
echo "4. DATABASE CHECK\n";
if ($conn && !$conn->connect_error) {
    echo "   Connection: CONNECTED ✓\n";

    if (isset($_SESSION['user_id'])) {
        $user_id = $_SESSION['user_id'];
        $sql = "SELECT id, username, email, role, is_active FROM users WHERE id = ?";
        $stmt = $conn->prepare($sql);

        if ($stmt) {
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $user = $result->fetch_assoc();
                echo "   User Found: YES ✓\n";
                echo "   ID: " . $user['id'] . "\n";
                echo "   Username: " . $user['username'] . "\n";
                echo "   Email: " . $user['email'] . "\n";
                echo "   Role: " . $user['role'] . ($user['role'] === 'admin' ? " ✓" : " ✗") . "\n";
                echo "   Active: " . ($user['is_active'] ? "YES ✓" : "NO ✗") . "\n";
            } else {
                echo "   User Found: NO ✗\n";
                echo "   → User ID $user_id not in database\n";
            }
            $stmt->close();
        } else {
            echo "   Query Error: " . $conn->error . "\n";
        }
    } else {
        echo "   User ID: NOT IN SESSION ✗\n";
    }
} else {
    echo "   Connection: FAILED ✗\n";
    echo "   Error: " . ($conn ? $conn->connect_error : "Connection object not created") . "\n";
}
echo "\n";

// 5. Diagnosis
echo "5. DIAGNOSIS\n";

$problems = [];

if (empty($_SESSION)) {
    $problems[] = "❌ SESSION EMPTY - User not logged in on backend";
}

if (!isset($_SESSION['user_id'])) {
    $problems[] = "❌ user_id not in session";
}

if (!isset($_SESSION['role'])) {
    $problems[] = "❌ role not in session";
} elseif ($_SESSION['role'] !== 'admin') {
    $problems[] = "❌ role is '" . $_SESSION['role'] . "' but should be 'admin'";
}

if (isset($user) && $user['role'] !== 'admin') {
    $problems[] = "❌ Database user role is '" . $user['role'] . "' but should be 'admin'";
}

if (isset($user) && !$user['is_active']) {
    $problems[] = "❌ User account is deactivated";
}

if (empty($problems)) {
    echo "   ✓ NO PROBLEMS FOUND\n";
    echo "   Backend authentication is working correctly!\n";
    echo "\n   If you're still getting an error:\n";
    echo "   - Check browser console for JavaScript errors\n";
    echo "   - Check Network tab for API responses\n";
    echo "   - Verify admin.html is calling requireAdmin() correctly\n";
} else {
    foreach ($problems as $problem) {
        echo "   $problem\n";
    }
}
echo "\n";

// 6. Recommendations
echo "6. RECOMMENDATIONS\n";

if (empty($_SESSION)) {
    echo "   1. Login again to create a session\n";
    echo "   2. Check that login.php is setting \$_SESSION variables\n";
    echo "   3. Verify cookies are enabled in browser\n";
} elseif (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo "   1. Check database user role\n";
    echo "   2. Run: UPDATE users SET role = 'admin' WHERE id = " . ($_SESSION['user_id'] ?? 'N/A') . ";\n";
    echo "   3. Logout and login again\n";
} else {
    echo "   1. Check browser console (F12 → Console)\n";
    echo "   2. Check Network tab (F12 → Network)\n";
    echo "   3. Verify admin.html is loading correctly\n";
}
echo "\n";

echo "================================================================================\n";
?>

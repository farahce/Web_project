<?php
/**
 * Backend Authentication Debugger
 * Place this file in: backend/debug.php
 * Access it at: http://yoursite.com/backend/debug.php
 */

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include database connection
$conn = include 'config/database.php';

// Include functions
include 'includes/functions.php';

// Set headers
header('Content-Type: text/html; charset=utf-8');

?>
<!DOCTYPE html>
<html>
<head>
    <title>Backend Authentication Debug</title>
    <style>
        body {
            font-family: monospace;
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        h1 {
            color: #4ec9b0;
            border-bottom: 2px solid #4ec9b0;
            padding-bottom: 10px;
        }
        h2 {
            color: #569cd6;
            margin-top: 30px;
        }
        .section {
            background: #252526;
            padding: 15px;
            margin: 15px 0;
            border-left: 3px solid #007acc;
            border-radius: 3px;
        }
        .row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #3e3e42;
        }
        .row:last-child {
            border-bottom: none;
        }
        .label {
            color: #9cdcfe;
            font-weight: bold;
            min-width: 200px;
        }
        .value {
            color: #ce9178;
            word-break: break-all;
        }
        .success {
            color: #4ec9b0;
        }
        .error {
            color: #f48771;
        }
        .warning {
            color: #dcdcaa;
        }
        .code {
            background: #1e1e1e;
            padding: 10px;
            margin: 10px 0;
            border-left: 2px solid #007acc;
            overflow-x: auto;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        }
        .status-ok {
            background: #4ec9b0;
            color: #1e1e1e;
        }
        .status-error {
            background: #f48771;
            color: #1e1e1e;
        }
        .status-warning {
            background: #dcdcaa;
            color: #1e1e1e;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #3e3e42;
        }
        th {
            background: #2d2d30;
            color: #569cd6;
        }
        tr:hover {
            background: #2d2d30;
        }
    </style>
</head>
<body>
<div class="container">
    <h1>🔧 Backend Authentication Debugger</h1>

    <!-- Session Status -->
    <h2>📋 Session Status</h2>
    <div class="section">
        <div class="row">
            <span class="label">Session Status:</span>
            <span class="value">
                    <?php echo session_status() === PHP_SESSION_ACTIVE ? '<span class="success">ACTIVE</span>' : '<span class="error">INACTIVE</span>'; ?>
                </span>
        </div>
        <div class="row">
            <span class="label">Session ID:</span>
            <span class="value"><?php echo session_id() ?: '<span class="error">NOT SET</span>'; ?></span>
        </div>
        <div class="row">
            <span class="label">Session Name:</span>
            <span class="value"><?php echo session_name(); ?></span>
        </div>
    </div>

    <!-- Session Variables -->
    <h2>🔐 Session Variables ($_SESSION)</h2>
    <div class="section">
        <?php if (empty($_SESSION)): ?>
            <div class="row">
                <span class="error">⚠️ SESSION IS EMPTY - No user data stored</span>
            </div>
        <?php else: ?>
            <table>
                <thead>
                <tr>
                    <th>Key</th>
                    <th>Value</th>
                    <th>Status</th>
                </tr>
                </thead>
                <tbody>
                <?php foreach ($_SESSION as $key => $value): ?>
                    <tr>
                        <td><strong><?php echo htmlspecialchars($key); ?></strong></td>
                        <td>
                            <?php
                            if (is_array($value)) {
                                echo '<pre>' . htmlspecialchars(json_encode($value, JSON_PRETTY_PRINT)) . '</pre>';
                            } else {
                                echo htmlspecialchars($value);
                            }
                            ?>
                        </td>
                        <td>
                            <?php
                            if ($key === 'role' && $value === 'admin') {
                                echo '<span class="status-badge status-ok">✓ ADMIN</span>';
                            } elseif ($key === 'role') {
                                echo '<span class="status-badge status-warning">⚠ ' . strtoupper($value) . '</span>';
                            } elseif ($key === 'user_id') {
                                echo '<span class="status-badge status-ok">✓ SET</span>';
                            } else {
                                echo '<span class="status-badge status-ok">✓</span>';
                            }
                            ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>

    <!-- Authentication Check -->
    <h2>🔑 Authentication Functions</h2>
    <div class="section">
        <div class="row">
            <span class="label">isAdmin():</span>
            <span class="value">
                    <?php
                    $isAdmin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
                    echo $isAdmin ? '<span class="success">TRUE ✓</span>' : '<span class="error">FALSE ✗</span>';
                    ?>
                </span>
        </div>
        <div class="row">
            <span class="label">isUser():</span>
            <span class="value">
                    <?php
                    $isUser = isset($_SESSION['role']) && $_SESSION['role'] === 'user';
                    echo $isUser ? '<span class="success">TRUE ✓</span>' : '<span class="error">FALSE ✗</span>';
                    ?>
                </span>
        </div>
        <div class="row">
            <span class="label">getCurrentUserId():</span>
            <span class="value">
                    <?php
                    echo isset($_SESSION['user_id']) ? '<span class="success">' . $_SESSION['user_id'] . '</span>' : '<span class="error">NOT SET</span>';
                    ?>
                </span>
        </div>
    </div>

    <!-- Database Connection -->
    <h2>🗄️ Database Connection</h2>
    <div class="section">
        <div class="row">
            <span class="label">Connection Status:</span>
            <span class="value">
                    <?php
                    if ($conn && !$conn->connect_error) {
                        echo '<span class="success">✓ CONNECTED</span>';
                    } else {
                        echo '<span class="error">✗ FAILED</span>';
                    }
                    ?>
                </span>
        </div>
        <?php if ($conn && !$conn->connect_error): ?>
            <div class="row">
                <span class="label">Host:</span>
                <span class="value"><?php echo $conn->get_server_info(); ?></span>
            </div>
            <div class="row">
                <span class="label">Database:</span>
                <span class="value"><?php echo $conn->get_charset()->charset; ?></span>
            </div>
        <?php endif; ?>
    </div>

    <!-- User in Database -->
    <h2>👤 User in Database</h2>
    <div class="section">
        <?php
        if ($conn && !$conn->connect_error && isset($_SESSION['user_id'])) {
            $user_id = $_SESSION['user_id'];
            $sql = "SELECT id, username, email, password, role, is_active FROM users WHERE id = ?";
            $stmt = $conn->prepare($sql);

            if ($stmt) {
                $stmt->bind_param("i", $user_id);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($result->num_rows > 0) {
                    $user = $result->fetch_assoc();
                    ?>
                    <table>
                        <thead>
                        <tr>
                            <th>Field</th>
                            <th>Value</th>
                            <th>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td><strong>ID</strong></td>
                            <td><?php echo $user['id']; ?></td>
                            <td><span class="status-badge status-ok">✓</span></td>
                        </tr>
                        <tr>
                            <td><strong>Username</strong></td>
                            <td><?php echo htmlspecialchars($user['username']); ?></td>
                            <td><span class="status-badge status-ok">✓</span></td>
                        </tr>
                        <tr>
                            <td><strong>Email</strong></td>
                            <td><?php echo htmlspecialchars($user['email']); ?></td>
                            <td><span class="status-badge status-ok">✓</span></td>
                        </tr>
                        <tr>
                            <td><strong>Role</strong></td>
                            <td><?php echo htmlspecialchars($user['role']); ?></td>
                            <td>
                                <?php
                                if ($user['role'] === 'admin') {
                                    echo '<span class="status-badge status-ok">✓ ADMIN</span>';
                                } else {
                                    echo '<span class="status-badge status-error">✗ NOT ADMIN</span>';
                                }
                                ?>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Active</strong></td>
                            <td><?php echo $user['is_active'] ? 'Yes' : 'No'; ?></td>
                            <td>
                                <?php
                                echo $user['is_active'] ? '<span class="status-badge status-ok">✓</span>' : '<span class="status-badge status-error">✗</span>';
                                ?>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Password Hash</strong></td>
                            <td><?php echo substr($user['password'], 0, 20) . '...'; ?></td>
                            <td><span class="status-badge status-warning">⚠ PLAIN TEXT</span></td>
                        </tr>
                        </tbody>
                    </table>
                    <?php
                } else {
                    echo '<div class="error">❌ User ID ' . $user_id . ' not found in database!</div>';
                }
                $stmt->close();
            } else {
                echo '<div class="error">❌ Database query failed: ' . $conn->error . '</div>';
            }
        } else {
            echo '<div class="warning">⚠️ No user_id in session or database not connected</div>';
        }
        ?>
    </div>

    <!-- API Endpoint Test -->
    <h2>🔗 API Endpoint Test</h2>
    <div class="section">
        <div class="row">
            <span class="label">Test Admin Dashboard API:</span>
        </div>
        <div class="code">
            <strong>Endpoint:</strong> /backend/admin/dashboard.php<br>
            <strong>Method:</strong> GET<br>
            <strong>Required:</strong> Admin role in session<br>
            <strong>Current Status:</strong>
            <?php
            if (isset($_SESSION['role']) && $_SESSION['role'] === 'admin') {
                echo '<span class="success">✓ Should work</span>';
            } else {
                echo '<span class="error">✗ Will fail - not admin</span>';
            }
            ?>
        </div>
    </div>

    <!-- Comparison: Frontend vs Backend -->
    <h2>🔄 Frontend vs Backend Comparison</h2>
    <div class="section">
        <table>
            <thead>
            <tr>
                <th>Property</th>
                <th>Frontend (localStorage)</th>
                <th>Backend (Session)</th>
                <th>Database</th>
                <th>Match?</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td><strong>user_id</strong></td>
                <td>5</td>
                <td><?php echo isset($_SESSION['user_id']) ? $_SESSION['user_id'] : '<span class="error">NOT SET</span>'; ?></td>
                <td><?php echo isset($user['id']) ? $user['id'] : '<span class="error">N/A</span>'; ?></td>
                <td>
                    <?php
                    $match = (isset($_SESSION['user_id']) && $_SESSION['user_id'] == 5);
                    echo $match ? '<span class="success">✓</span>' : '<span class="error">✗</span>';
                    ?>
                </td>
            </tr>
            <tr>
                <td><strong>user_role</strong></td>
                <td>admin</td>
                <td><?php echo isset($_SESSION['role']) ? $_SESSION['role'] : '<span class="error">NOT SET</span>'; ?></td>
                <td><?php echo isset($user['role']) ? $user['role'] : '<span class="error">N/A</span>'; ?></td>
                <td>
                    <?php
                    $match = (isset($_SESSION['role']) && $_SESSION['role'] === 'admin');
                    echo $match ? '<span class="success">✓</span>' : '<span class="error">✗</span>';
                    ?>
                </td>
            </tr>
            </tbody>
        </table>
    </div>

    <!-- Diagnosis -->
    <h2>🔍 Diagnosis</h2>
    <div class="section">
        <?php
        $issues = [];

        // Check session
        if (empty($_SESSION)) {
            $issues[] = ['error', '❌ SESSION IS EMPTY - User not logged in on backend'];
        }

        // Check user_id
        if (!isset($_SESSION['user_id'])) {
            $issues[] = ['error', '❌ user_id not in session'];
        }

        // Check role
        if (!isset($_SESSION['role'])) {
            $issues[] = ['error', '❌ role not in session'];
        } elseif ($_SESSION['role'] !== 'admin') {
            $issues[] = ['error', '❌ role is "' . $_SESSION['role'] . '" but should be "admin"'];
        }

        // Check database
        if ($conn && !$conn->connect_error && isset($user)) {
            if ($user['role'] !== 'admin') {
                $issues[] = ['error', '❌ Database user role is "' . $user['role'] . '" but should be "admin"'];
            }
            if (!$user['is_active']) {
                $issues[] = ['error', '❌ User account is deactivated'];
            }
        }

        if (empty($issues)) {
            echo '<div style="color: #4ec9b0; font-size: 16px;"><strong>✓ NO ISSUES FOUND</strong></div>';
            echo '<p>Backend authentication appears to be working correctly!</p>';
            echo '<p>If you\'re still getting an error, check:</p>';
            echo '<ul>';
            echo '<li>Browser console for JavaScript errors</li>';
            echo '<li>Network tab to see API responses</li>';
            echo '<li>That admin.html is properly calling requireAdmin()</li>';
            echo '</ul>';
        } else {
            foreach ($issues as $issue) {
                $class = $issue[0];
                $message = $issue[1];
                echo '<div style="color: ' . ($class === 'error' ? '#f48771' : '#dcdcaa') . '; margin: 10px 0;">' . $message . '</div>';
            }
        }
        ?>
    </div>

    <!-- Recommendations -->
    <h2>💡 Recommendations</h2>
    <div class="section">
        <?php
        if (empty($_SESSION)) {
            echo '<div style="color: #dcdcaa;"><strong>1. Session is empty:</strong></div>';
            echo '<ul>';
            echo '<li>User is not logged in on the backend</li>';
            echo '<li>Login again to create a session</li>';
            echo '<li>Check that login.php is setting $_SESSION variables correctly</li>';
            echo '</ul>';
        } elseif (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            echo '<div style="color: #dcdcaa;"><strong>2. User is not admin:</strong></div>';
            echo '<ul>';
            echo '<li>Check database - user role should be "admin"</li>';
            echo '<li>Update database: UPDATE users SET role = "admin" WHERE id = ' . ($_SESSION['user_id'] ?? 'N/A') . ';</li>';
            echo '<li>Logout and login again</li>';
            echo '</ul>';
        } else {
            echo '<div style="color: #4ec9b0;"><strong>✓ Backend looks good!</strong></div>';
            echo '<ul>';
            echo '<li>Check frontend JavaScript for errors</li>';
            echo '<li>Verify admin.html is loading correctly</li>';
            echo '<li>Check browser Network tab for API responses</li>';
            echo '</ul>';
        }
        ?>
    </div>
</div>
</body>
</html>

<?php
/**
 * Products API
 * GET /api/products
 * GET /api/products?category=donuts
 */

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get category filter if provided
    $category = isset($_GET['category']) ? sanitize($conn, $_GET['category']) : null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    // Build query
    $sql = "SELECT * FROM products";

    if ($category) {
        $sql .= " WHERE category = '$category'";
    }

    $sql .= " LIMIT $limit OFFSET $offset";

    // Execute query
    $result = $conn->query($sql);

    if (!$result) {
        sendResponse('error', 'Query failed: ' . $conn->error);
    }

    // Fetch products
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }

    // Get total count
    $count_sql = "SELECT COUNT(*) as total FROM products";
    if ($category) {
        $count_sql .= " WHERE category = '$category'";
    }
    $count_result = $conn->query($count_sql);
    $count_row = $count_result->fetch_assoc();

    sendResponse('success', 'Products retrieved successfully', [
        'products' => $products,
        'total' => $count_row['total'],
        'limit' => $limit,
        'offset' => $offset
    ]);
} else {
    sendResponse('error', 'Method not allowed');
}
?>

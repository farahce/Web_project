<?php
/**
 * Products API
 * GET /api/products
 * GET /api/products?category=donuts
 * GET /api/products?id=1
 */

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get filters
    $category = isset($_GET['category']) ? trim($_GET['category']) : null;
    $product_id = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    // Validate limit and offset
    if ($limit < 1 || $limit > 1000) {
        $limit = 100;
    }
    if ($offset < 0) {
        $offset = 0;
    }

    // If specific product ID requested
    if ($product_id) {
        $sql = "SELECT * FROM products WHERE id = ? AND is_available = 1";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            sendResponse('error', 'Database error: ' . $conn->error);
        }
        
        $stmt->bind_param("i", $product_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $stmt->close();
            sendResponse('error', 'Product not found');
        }
        
        $product = $result->fetch_assoc();
        $stmt->close();
        
        sendResponse('success', 'Product retrieved successfully', [
            'product' => $product
        ]);
    }

    // Build query with prepared statements
    if ($category) {
        $sql = "SELECT * FROM products WHERE category = ? AND is_available = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            sendResponse('error', 'Database error: ' . $conn->error);
        }
        
        $stmt->bind_param("sii", $category, $limit, $offset);
    } else {
        $sql = "SELECT * FROM products WHERE is_available = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            sendResponse('error', 'Database error: ' . $conn->error);
        }
        
        $stmt->bind_param("ii", $limit, $offset);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();

    // Fetch products
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    $stmt->close();

    // Get total count
    if ($category) {
        $count_sql = "SELECT COUNT(*) as total FROM products WHERE category = ? AND is_available = 1";
        $count_stmt = $conn->prepare($count_sql);
        $count_stmt->bind_param("s", $category);
    } else {
        $count_sql = "SELECT COUNT(*) as total FROM products WHERE is_available = 1";
        $count_stmt = $conn->prepare($count_sql);
    }
    
    $count_stmt->execute();
    $count_result = $count_stmt->get_result();
    $count_row = $count_result->fetch_assoc();
    $count_stmt->close();

    sendResponse('success', 'Products retrieved successfully', [
        'products' => $products,
        'total' => $count_row['total'],
        'limit' => $limit,
        'offset' => $offset,
        'category' => $category
    ]);
} else {
    sendResponse('error', 'Method not allowed');
}
?>

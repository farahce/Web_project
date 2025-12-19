<?php
/**
 * Admin Products API
 * GET /api/admin/products - Get all products (admin only)
 * POST /api/admin/products - Create new product (admin only)
 * PUT /api/admin/products - Update product (admin only)
 * DELETE /api/admin/products - Delete product (admin only)
 */

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

// Require admin role
requireAdmin();

if ($method === 'GET') {
    // Get all products with filters
    $category = isset($_GET['category']) ? trim($_GET['category']) : null;
    $search = isset($_GET['search']) ? trim($_GET['search']) : null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    $product_id = isset($_GET['id']) ? (int)$_GET['id'] : null;

    // Validate limit and offset
    if ($limit < 1 || $limit > 1000) {
        $limit = 50;
    }
    if ($offset < 0) {
        $offset = 0;
    }

    // If specific product ID requested
    if ($product_id) {
        $sql = "SELECT * FROM products WHERE id = ?";
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

    // Build query with filters
    $where_clauses = [];
    $params = [];
    $param_types = "";

    if ($category) {
        $where_clauses[] = "category = ?";
        $params[] = $category;
        $param_types .= "s";
    }

    if ($search) {
        $where_clauses[] = "(name LIKE ? OR description LIKE ?)";
        $search_term = "%$search%";
        $params[] = $search_term;
        $params[] = $search_term;
        $param_types .= "ss";
    }

    $where = count($where_clauses) > 0 ? "WHERE " . implode(" AND ", $where_clauses) : "";

    // Get total count
    $count_sql = "SELECT COUNT(*) as total FROM products $where";
    $count_stmt = $conn->prepare($count_sql);

    if (count($params) > 0) {
        $count_stmt->bind_param($param_types, ...$params);
    }

    $count_stmt->execute();
    $count_result = $count_stmt->get_result();
    $count_row = $count_result->fetch_assoc();
    $count_stmt->close();

    // Get products
    $sql = "SELECT * FROM products $where ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        sendResponse('error', 'Database error: ' . $conn->error);
    }

    // Add limit and offset to params
    $params[] = $limit;
    $params[] = $offset;
    $param_types .= "ii";

    $stmt->bind_param($param_types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    $stmt->close();

    sendResponse('success', 'Products retrieved successfully', [
        'products' => $products,
        'total' => $count_row['total'],
        'limit' => $limit,
        'offset' => $offset
    ]);

} elseif ($method === 'POST') {
    // Create new product
    $data = getJsonInput();

    // Validate required fields
    $required_fields = ['name', 'category', 'price', 'stock_quantity'];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendResponse('error', "Field '$field' is required");
        }
    }

    $name = trim($data['name']);
    $category = trim($data['category']);
    $description = isset($data['description']) ? trim($data['description']) : '';
    $price = (float)$data['price'];
    $stock_quantity = (int)$data['stock_quantity'];
    $image_url = isset($data['image_url']) ? trim($data['image_url']) : '';
    $is_available = isset($data['is_available']) ? (int)$data['is_available'] : 1;

    // Validate price and stock
    if ($price < 0) {
        sendResponse('error', 'Price cannot be negative');
    }
    if ($stock_quantity < 0) {
        sendResponse('error', 'Stock quantity cannot be negative');
    }

    // Check if product name already exists
    $check_sql = "SELECT id FROM products WHERE name = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("s", $name);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows > 0) {
        $check_stmt->close();
        sendResponse('error', 'Product with this name already exists');
    }
    $check_stmt->close();

    // Insert product
    $sql = "INSERT INTO products (name, category, description, price, stock_quantity, image_url, is_available) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        sendResponse('error', 'Database error: ' . $conn->error);
    }

    $stmt->bind_param("sssidii", $name, $category, $description, $price, $stock_quantity, $image_url, $is_available);

    if ($stmt->execute()) {
        $product_id = $conn->insert_id;
        $stmt->close();

        // Log activity
        $user_id = getCurrentUserId();
        logActivity($conn, $user_id, 'CREATE_PRODUCT', "Created product: $name (ID: $product_id)");

        sendResponse('success', 'Product created successfully', [
            'product_id' => $product_id,
            'name' => $name
        ]);
    } else {
        $error = $stmt->error;
        $stmt->close();
        sendResponse('error', 'Failed to create product: ' . $error);
    }

} elseif ($method === 'PUT') {
    // Update product
    $data = getJsonInput();

    if (!isset($data['id'])) {
        sendResponse('error', 'Product ID is required');
    }

    $product_id = (int)$data['id'];

    // Check if product exists
    $check_sql = "SELECT id FROM products WHERE id = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("i", $product_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows === 0) {
        $check_stmt->close();
        sendResponse('error', 'Product not found');
    }
    $check_stmt->close();

    // Build update query dynamically
    $update_fields = [];
    $params = [];
    $param_types = "";

    $allowed_fields = ['name', 'category', 'description', 'price', 'stock_quantity', 'image_url', 'is_available'];

    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            $update_fields[] = "$field = ?";

            if ($field === 'price') {
                $params[] = (float)$data[$field];
                $param_types .= "d";
            } elseif (in_array($field, ['stock_quantity', 'is_available'])) {
                $params[] = (int)$data[$field];
                $param_types .= "i";
            } else {
                $params[] = trim($data[$field]);
                $param_types .= "s";
            }
        }
    }

    if (count($update_fields) === 0) {
        sendResponse('error', 'No fields to update');
    }

    $params[] = $product_id;
    $param_types .= "i";

    $sql = "UPDATE products SET " . implode(", ", $update_fields) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        sendResponse('error', 'Database error: ' . $conn->error);
    }

    $stmt->bind_param($param_types, ...$params);

    if ($stmt->execute()) {
        $stmt->close();

        // Log activity
        $user_id = getCurrentUserId();
        logActivity($conn, $user_id, 'UPDATE_PRODUCT', "Updated product ID: $product_id");

        sendResponse('success', 'Product updated successfully');
    } else {
        $error = $stmt->error;
        $stmt->close();
        sendResponse('error', 'Failed to update product: ' . $error);
    }

} elseif ($method === 'DELETE') {
    // Delete product
    $data = getJsonInput();

    if (!isset($data['id'])) {
        sendResponse('error', 'Product ID is required');
    }

    $product_id = (int)$data['id'];

    // Check if product exists
    $check_sql = "SELECT id, name FROM products WHERE id = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("i", $product_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows === 0) {
        $check_stmt->close();
        sendResponse('error', 'Product not found');
    }

    $product = $check_result->fetch_assoc();
    $check_stmt->close();

    // Check if product is in any orders
    $order_check_sql = "SELECT COUNT(*) as count FROM order_items WHERE product_id = ?";
    $order_check_stmt = $conn->prepare($order_check_sql);
    $order_check_stmt->bind_param("i", $product_id);
    $order_check_stmt->execute();
    $order_check_result = $order_check_stmt->get_result();
    $order_check_row = $order_check_result->fetch_assoc();
    $order_check_stmt->close();

    if ($order_check_row['count'] > 0) {
        // Don't delete, just mark as unavailable
        $sql = "UPDATE products SET is_available = 0 WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $product_id);

        if ($stmt->execute()) {
            $stmt->close();

            // Log activity
            $user_id = getCurrentUserId();
            logActivity($conn, $user_id, 'DELETE_PRODUCT', "Marked product as unavailable: {$product['name']} (ID: $product_id)");

            sendResponse('success', 'Product marked as unavailable (has existing orders)');
        } else {
            $error = $stmt->error;
            $stmt->close();
            sendResponse('error', 'Failed to delete product: ' . $error);
        }
    } else {
        // Safe to delete
        $sql = "DELETE FROM products WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $product_id);

        if ($stmt->execute()) {
            $stmt->close();

            // Log activity
            $user_id = getCurrentUserId();
            logActivity($conn, $user_id, 'DELETE_PRODUCT', "Deleted product: {$product['name']} (ID: $product_id)");

            sendResponse('success', 'Product deleted successfully');
        } else {
            $error = $stmt->error;
            $stmt->close();
            sendResponse('error', 'Failed to delete product: ' . $error);
        }
    }

} else {
    sendResponse('error', 'Method not allowed');
}
?>

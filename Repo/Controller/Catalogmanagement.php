<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Nhận diện phương thức OPTIONS khi trình duyệt gửi request kiểm tra (CORS Preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}


require_once '../Model/pdo.php'; 

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        handleGet();
        break;
    case 'POST':
        handlePost();
        break;
    case 'PUT':
        handlePut();
        break;
    case 'DELETE':
        handleDelete();
        break;
    default:
        echo json_encode(["status" => "error", "message" => "Phương thức không được hỗ trợ"]);
        break;
}

// --- A. LẤY DANH SÁCH (GET) ---
function handleGet() {
    try {
        $sqlCat = "SELECT c.category_id, c.name, c.slug, COUNT(ac.article_id) as count 
                   FROM categories c 
                   LEFT JOIN article_categories ac ON c.category_id = ac.category_id 
                   GROUP BY c.category_id 
                   ORDER BY c.sort_order ASC, c.category_id DESC";
        $categories = pdo_query($sqlCat);

        $sqlTag = "SELECT t.tag_id, t.name, t.slug, COUNT(at.article_id) as count 
                   FROM tags t 
                   LEFT JOIN article_tags at ON t.tag_id = at.tag_id 
                   GROUP BY t.tag_id 
                   ORDER BY t.tag_id DESC";
        $tags = pdo_query($sqlTag);

        echo json_encode([
            "status" => "success",
            "categories" => $categories,
            "tags" => $tags
        ]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

// --- B. THÊM MỚI (POST) ---
function handlePost() {
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data['name']) || empty($data['slug']) || empty($data['type'])) {
        echo json_encode(["status" => "error", "message" => "Thiếu dữ liệu đầu vào"]);
        return;
    }

    try {
        if ($data['type'] === 'Category') {
            $sql = "INSERT INTO categories (name, slug) VALUES (?, ?)";
            $id = pdo_execute_return_last_id($sql, $data['name'], $data['slug']);
        } else {
            $sql = "INSERT INTO tags (name, slug) VALUES (?, ?)";
            $id = pdo_execute_return_last_id($sql, $data['name'], $data['slug']);
        }
        echo json_encode(["status" => "success", "message" => "Thêm thành công", "id" => $id]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Lỗi DB: " . $e->getMessage()]);
    }
}

// --- C. CHỈNH SỬA (PUT) ---
function handlePut() {
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data['id']) || empty($data['name']) || empty($data['slug']) || empty($data['type'])) {
        echo json_encode(["status" => "error", "message" => "Thiếu thông tin cập nhật"]);
        return;
    }

    try {
        if ($data['type'] === 'Category') {
            $sql = "UPDATE categories SET name = ?, slug = ? WHERE category_id = ?";
        } else {
            $sql = "UPDATE tags SET name = ?, slug = ? WHERE tag_id = ?";
        }
        pdo_execute($sql, $data['name'], $data['slug'], $data['id']);
        echo json_encode(["status" => "success", "message" => "Cập nhật thành công"]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Lỗi DB: " . $e->getMessage()]);
    }
}

// --- D. XÓA (DELETE) ---
function handleDelete() {
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data['id']) || empty($data['type'])) {
        echo json_encode(["status" => "error", "message" => "Thiếu ID hoặc phân loại để xóa"]);
        return;
    }

    try {
        if ($data['type'] === 'Category') {
            $sql = "DELETE FROM categories WHERE category_id = ?";
        } else {
            $sql = "DELETE FROM tags WHERE tag_id = ?";
        }
        pdo_execute($sql, $data['id']);
        echo json_encode(["status" => "success", "message" => "Xóa thành công"]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Không thể xóa do ràng buộc dữ liệu ngoại khóa!"]);
    }
}
?>
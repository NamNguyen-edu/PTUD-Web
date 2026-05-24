<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once '../Services/CategoryManagement_service.php';
$model = new CategoryTagModel();
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

try {
    switch ($method) {
        case 'GET':
            echo json_encode([
                "status" => "success",
                "categories" => $model->getAllCategories(),
                "tags" => $model->getAllTags()
            ]);
            break;

        case 'POST':
            if (empty($data['name']) || empty($data['slug']) || empty($data['type'])) throw new Exception("Thiếu dữ liệu đầu vào");
            $id = $model->insert($data['type'], $data['name'], $data['slug']);
            echo json_encode(["status" => "success", "message" => "Thêm thành công", "id" => $id]);
            break;

        case 'PUT':
            if (empty($data['id']) || empty($data['name']) || empty($data['slug']) || empty($data['type'])) throw new Exception("Thiếu thông tin cập nhật");
            $model->update($data['type'], $data['id'], $data['name'], $data['slug']);
            echo json_encode(["status" => "success", "message" => "Cập nhật thành công"]);
            break;

        case 'DELETE':
            if (empty($data['id']) || empty($data['type'])) throw new Exception("Thiếu ID hoặc phân loại");
            $model->delete($data['type'], $data['id']);
            echo json_encode(["status" => "success", "message" => "Xóa thành công"]);
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Phương thức không hỗ trợ"]);
            break;
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
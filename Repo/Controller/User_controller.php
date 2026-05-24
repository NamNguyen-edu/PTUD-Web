<?php
// Thiết lập header trả về định dạng JSON
header('Content-Type: application/json; charset=utf-8');

// Nhúng file Service
require_once '../Services/User_service.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet();
        break;
    case 'POST':
        handlePost();
        break;
    case 'DELETE':
        handleDelete();
        break;
    default:
        echo json_encode(["success" => false, "message" => "Phương thức không được hỗ trợ!"]);
        break;
}

// =========================================================================
// XỬ LÝ LẤY DỮ LIỆU & TÌM KIẾM (GET)
// =========================================================================
function handleGet() {
    try {
        $keyword = isset($_GET['search']) ? trim($_GET['search']) : "";
        $data = UserService::getUsers($keyword);
        
        echo json_encode(["success" => true, "data" => $data]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Lỗi CSDL: " . $e->getMessage()]);
    }
}

// =========================================================================
// XỬ LÝ TẠO MỚI & THAO TÁC HÀNG LOẠT (POST)
// =========================================================================
function handlePost() {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        echo json_encode(["success" => false, "message" => "Dữ liệu không hợp lệ!"]);
        return;
    }

    try {
        // 1. Thao tác hàng loạt
        if (isset($input['action'])) {
            $action = $input['action'];
            $ids = isset($input['ids']) ? $input['ids'] : [];

            if (empty($ids)) {
                echo json_encode(["success" => false, "message" => "Chưa chọn người dùng nào!"]);
                return;
            }

            $message = UserService::processBulkAction($action, $ids);
            echo json_encode(["success" => true, "message" => $message]);
            return;
        }

        // 2. Tạo người dùng mới
        if (isset($input['email'])) {
            UserService::createUser(
                trim($input['name']), 
                trim($input['email']), 
                $input['role'], 
                $input['status']
            );
            echo json_encode(["success" => true, "message" => "Tạo người dùng mới thành công!"]);
            return;
        }
    } catch (Exception $e) {
        // Lỗi thường do trùng Email (Unique Key constraint) hoặc thao tác DB
        echo json_encode(["success" => false, "message" => "Lỗi xử lý: " . $e->getMessage()]);
    }
}

// =========================================================================
// XỬ LÝ XÓA MỘT NGƯỜI DÙNG (DELETE)
// =========================================================================
function handleDelete() {
    if (isset($_GET['id'])) {
        $userId = intval($_GET['id']);
        try {
            UserService::deleteSingleUser($userId);
            echo json_encode(["success" => true, "message" => "Đã xóa người dùng thành công."]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Không thể xóa người dùng! Lỗi CSDL: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Thiếu ID để thực thi."]);
    }
}
?>
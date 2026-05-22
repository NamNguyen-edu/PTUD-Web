<?php
// Bật thông báo lỗi để dễ debug trong quá trình làm
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Cấu hình Header trả về JSON và cho phép Javascript nhận dữ liệu
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Nhúng file kết nối CSDL của bạn vào đây (Sửa lại đường dẫn cho đúng)
require_once __DIR__ . '/../Model/pdo.php';

// Nhận phương thức HTTP (GET, POST, DELETE)
$method = $_SERVER['REQUEST_METHOD'];

try {
  switch ($method) {

    // -------------------------------------------------------------
    // 1. LẤY DANH SÁCH USER HOẶC TÌM KIẾM (GET)
    // -------------------------------------------------------------
    case 'GET':
      $keyword = isset($_GET['search']) ? trim($_GET['search']) : '';

      if (!empty($keyword)) {
        // Tìm kiếm theo tên, email hoặc vai trò
        $sql = "SELECT id, name, email, avatar, role, status, last_active AS lastActive 
                        FROM users 
                        WHERE name LIKE ? OR email LIKE ? OR role LIKE ? 
                        ORDER BY id DESC";
        $searchParam = "%$keyword%";
        $users = pdo_query($sql, $searchParam, $searchParam, $searchParam);
      } else {
        // Lấy toàn bộ không cần lọc
        $sql = "SELECT id, name, email, avatar, role, status, last_active AS lastActive 
                        FROM users 
                        ORDER BY id DESC";
        $users = pdo_query($sql);
      }

      echo json_encode([
        "success" => true,
        "data" => $users
      ], JSON_UNESCAPED_UNICODE);
      break;

    // -------------------------------------------------------------
    // 2. TẠO USER MỚI (POST)
    // -------------------------------------------------------------
    case 'POST':
      // Đọc dữ liệu JSON gửi từ Client
      $input = json_decode(file_get_contents('php://input'), true);

      // Xử lý hành động Bulk Action (Hành động hàng loạt) nếu có biến action
      if (isset($input['action'])) {
        handleBulkActions($input);
        break;
      }

      // Nếu không phải bulk action thì là tạo user mới
      $name = isset($input['name']) ? trim($input['name']) : '';
      $email = isset($input['email']) ? trim($input['email']) : '';
      $role = isset($input['role']) ? trim($input['role']) : '';
      $status = isset($input['status']) ? trim($input['status']) : 'Active';

      if (empty($name) || empty($email) || empty($role)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Vui lòng điền đầy đủ thông tin bắt buộc."]);
        exit;
      }

      // Tự động tạo ảnh đại diện (avatar) dựa trên tên
      $avatar = "https://i.pravatar.cc/150?u=" . urlencode(strtolower(str_replace(' ', '', $name)));
      $lastActive = ($status === 'Active') ? 'Just now' : (($status === 'Pending') ? 'Invited now' : 'Never');

      // Chèn vào CSDL sử dụng hàm pdo_execute của bạn
      $sql = "INSERT INTO users (name, email, avatar, role, status, last_active) VALUES (?, ?, ?, ?, ?, ?)";
      pdo_execute($sql, $name, $email, $avatar, $role, $status, $lastActive);

      echo json_encode([
        "success" => true,
        "message" => "Tạo thành viên mới thành công!"
      ], JSON_UNESCAPED_UNICODE);
      break;

    // -------------------------------------------------------------
    // 3. XÓA MỘT USER (DELETE)
    // -------------------------------------------------------------
    case 'DELETE':
      // Lấy ID từ thanh địa chỉ ví dụ: api_users.php?id=5
      if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Thiếu ID người dùng cần xóa."]);
        exit;
      }

      $id = intval($_GET['id']);

      $sql = "DELETE FROM users WHERE id = ?";
      pdo_execute($sql, $id);

      echo json_encode([
        "success" => true,
        "message" => "Đã xóa thành viên thành công!"
      ], JSON_UNESCAPED_UNICODE);
      break;

    default:
      http_response_code(405);
      echo json_encode(["success" => false, "message" => "Phương thức không được hỗ trợ."]);
      break;
  }
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode([
    "success" => false,
    "message" => "Lỗi hệ thống: " . $e->getMessage()
  ], JSON_UNESCAPED_UNICODE);
}

// Hàm phụ trợ xử lý các thao tác chọn hàng loạt dưới footer
function handleBulkActions($input)
{
  $action = $input['action'];
  $ids = $input['ids'];

  if (empty($ids) || !is_array($ids)) {
    echo json_encode(["success" => false, "message" => "Không có thành viên nào được chọn."]);
    exit;
  }

  // Biến mảng ID thành chuỗi số cách nhau bằng dấu phẩy (Ví dụ: 1,2,3) để dùng trong câu lệnh WHERE IN
  $idList = implode(',', array_map('intval', $ids));

  if ($action === 'delete') {
    $sql = "DELETE FROM users WHERE id IN ($idList)";
    pdo_execute($sql);
    $msg = "Đã xóa thành công các thành viên được chọn!";
  } elseif ($action === 'suspend') {
    $sql = "UPDATE users SET status = 'Suspended' WHERE id IN ($idList)";
    pdo_execute($sql);
    $msg = "Đã đình bản (Suspend) các thành viên được chọn!";
  } elseif ($action === 'invite') {
    $sql = "UPDATE users SET status = 'Pending', last_active = 'Invited now' WHERE id IN ($idList)";
    pdo_execute($sql);
    $msg = "Đã gửi lại lời mời đến các thành viên được chọn!";
  }

  echo json_encode(["success" => true, "message" => $msg], JSON_UNESCAPED_UNICODE);
}

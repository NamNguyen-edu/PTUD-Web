<?php
header('Content-Type: application/json');
require_once '../Services/Account_service.php';

$service = new UserService();
$method = $_SERVER['REQUEST_METHOD'];

try {
  if ($method === 'GET') {
    $search = $_GET['search'] ?? '';
    $data = $service->getAllUsers($search);
    echo json_encode(['success' => true, 'data' => $data]);
  } elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['action'])) {
      // Xử lý Bulk Action (Suspend, Delete)
      $success = ($input['action'] === 'delete') ?
        $service->deleteUsers($input['ids']) :
        $service->updateStatus($input['ids'], ucfirst($input['action']));

      echo json_encode(['success' => true, 'message' => 'Cập nhật thành công!']);
    } else {
      // Xử lý Tạo mới
      $service->createUser($input);
      echo json_encode(['success' => true, 'message' => 'Đã thêm người dùng mới!']);
    }
  } elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
      $service->deleteUsers([$id]);
      echo json_encode(['success' => true, 'message' => 'Đã xóa thành viên!']);
    }
  }
} catch (Exception $e) {
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
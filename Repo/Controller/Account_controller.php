<?php
require_once(__DIR__ . "/../Services/Account_service.php");

header('Content-Type: application/json');
$service = new AccountService();
$method = $_SERVER['REQUEST_METHOD'];

try {
  if ($method === 'GET') {
    if (isset($_GET['search'])) {
      $data = $service->searchUsers($_GET['search']);
    } else {
      $data = $service->getAllUsers();
    }

    // Map dữ liệu để khớp với tên biến trong JS cũ của bạn (nếu cần)
    $formattedData = array_map(function ($u) {
      return [
        'id' => $u['user_id'],
        'name' => $u['full_name'],
        'email' => $u['email'],
        'role' => $u['role_name'],
        'status' => ucfirst($u['status']),
        'lastActive' => $u['last_active'],
        'avatar' => $u['avatar_url']
      ];
    }, $data);

    echo json_encode(['success' => true, 'data' => $formattedData]);
  } elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['action'])) {
      if ($input['action'] === 'delete') {
        $service->deleteUsers($input['ids']);
      } elseif ($input['action'] === 'suspend') {
        $service->updateStatus($input['ids'], 'banned');
      }
      echo json_encode(['success' => true, 'message' => 'Cập nhật thành công.']);
    } else {
      $service->createUser($input);
      echo json_encode(['success' => true, 'message' => 'Người dùng đã được tạo.']);
    }
  } elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
      $service->deleteUsers([$id]);
      echo json_encode(['success' => true, 'message' => 'Đã xóa thành công.']);
    }
  }
} catch (Exception $e) {
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

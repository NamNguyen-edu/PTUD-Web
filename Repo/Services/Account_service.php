<?php
require_once(__DIR__ . '/../Model/pdo.php');

class AccountService
{
  // Lấy danh sách users kèm tên Role
  public function getAllUsers()
  {
    $sql = "SELECT u.*, r.name as role_name 
                FROM users u 
                LEFT JOIN roles r ON u.role_id = r.role_id 
                ORDER BY u.user_id DESC";
    return pdo_query($sql);
  }

  // Tìm kiếm (tìm theo full_name hoặc email)
  public function searchUsers($keyword)
  {
    $sql = "SELECT u.*, r.name as role_name 
                FROM users u 
                LEFT JOIN roles r ON u.role_id = r.role_id 
                WHERE u.full_name LIKE ? OR u.email LIKE ? 
                ORDER BY u.user_id DESC";
    return pdo_query_search($sql, $keyword);
  }

  // Tạo mới (cần map role_name sang role_id nếu cần)
  public function createUser($data)
  {
    // Lưu ý: $data['role'] ở đây là tên role, ta cần tìm ID của nó
    $role = pdo_query_one("SELECT role_id FROM roles WHERE name = ?", $data['role']);
    $role_id = $role ? $role['role_id'] : 5; // Mặc định là reader (ID 5)

    $sql = "INSERT INTO users(full_name, email, password_hash, role_id, status) VALUES(?, ?, ?, ?, ?)";
    // Mặc định mật khẩu là 123456 (hash) cho user mới
    $default_pass = password_hash('123456', PASSWORD_DEFAULT);
    pdo_execute($sql, $data['name'], $data['email'], $default_pass, $role_id, strtolower($data['status']));
  }

  public function deleteUsers($ids)
  {
    $idList = implode(',', array_map('intval', $ids));
    $sql = "DELETE FROM users WHERE user_id IN ($idList)";
    pdo_execute($sql);
  }

  public function updateStatus($ids, $status)
  {
    $idList = implode(',', array_map('intval', $ids));
    $sql = "UPDATE users SET status = ? WHERE user_id IN ($idList)";
    pdo_execute($sql, strtolower($status));
  }
}

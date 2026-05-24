<?php
require_once '../Model/pdo.php'; // Đảm bảo đường dẫn đúng

class UserService
{

  public function getAllUsers($search = '')
  {
    if ($search) {
      $sql = "SELECT * FROM users WHERE name LIKE ? OR email LIKE ?";
      return pdo_query_search($sql, $search);
    } else {
      return pdo_query("SELECT * FROM users ORDER BY id DESC");
    }
  }

  public function createUser($data)
  {
    $sql = "INSERT INTO users (name, email, role, status, lastActive) VALUES (?, ?, ?, ?, NOW())";
    pdo_execute($sql, $data['name'], $data['email'], $data['role'], $data['status']);
    return true;
  }

  public function deleteUsers($ids)
  {
    // Tạo chuỗi placeholder (?, ?, ?) dựa trên số lượng id
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $sql = "DELETE FROM users WHERE id IN ($placeholders)";
    // Truyền mảng $ids vào hàm pdo_execute
    return pdo_execute($sql, ...$ids);
  }

  public function updateStatus($ids, $status)
  {
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $sql = "UPDATE users SET status = ? WHERE id IN ($placeholders)";
    // Trộn $status vào đầu mảng $ids
    array_unshift($ids, $status);
    return pdo_execute($sql, ...$ids);
  }
}
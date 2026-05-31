<?php
require_once __DIR__ . '/../Model/pdo.php';
class AccountService
{
  /**
   * Lấy tất cả người dùng kèm thông tin Role
   */
  public function getAllUsers(): array
  {
    $sql = "SELECT u.*, r.name as role_name 
                FROM users u 
                LEFT JOIN roles r ON u.role_id = r.role_id 
                ORDER BY u.user_id DESC";
    return pdo_query($sql);
  }

  /**
   * Tìm kiếm người dùng theo tên hoặc email
   */
  public function searchUsers(string $keyword): array
  {
    $sql = "SELECT u.*, r.name as role_name 
                FROM users u 
                LEFT JOIN roles r ON u.role_id = r.role_id 
                WHERE u.full_name LIKE ? OR u.email LIKE ? 
                ORDER BY u.user_id DESC";

    $searchTerm = "%$keyword%";
    return pdo_query_search($sql, $searchTerm, $searchTerm);
  }

  /**
   * Cập nhật Role (Phân quyền)
   */
  public function changeRole(array $ids, string $role): void
  {
    if (empty($ids)) return;

    // Lấy role_id từ tên role
    $roleRow = pdo_query_one("SELECT role_id FROM roles WHERE name = ?", $role);
    if (!$roleRow) throw new Exception("Vai trò không hợp lệ.");

    $roleId = $roleRow['role_id'];
    $sanitizedIds = implode(',', array_map('intval', $ids));

    $sql = "UPDATE users SET role_id = ? WHERE user_id IN ($sanitizedIds)";
    pdo_execute($sql, $roleId);
  }

  /**
   * Xóa danh sách người dùng (Hỗ trợ nhiều ID)
   */
  public function deleteUsers(array $ids): void
  {
    if (empty($ids)) return;

    // Ép kiểu mảng IDs thành số nguyên để tránh SQL Injection
    $sanitizedIds = implode(',', array_map('intval', $ids));
    $sql = "UPDATE users SET status = 'banned' WHERE user_id IN ($sanitizedIds)";
    pdo_execute($sql);
  }

  /**
   * Cập nhật trạng thái người dùng (Hỗ trợ nhiều ID)
   */
  public function updateStatus(array $ids, string $status): void
  {
    if (empty($ids)) return;

    $sanitizedIds = implode(',', array_map('intval', $ids));

    $sql = "UPDATE users SET status = ? WHERE user_id IN ($sanitizedIds)";
    pdo_execute($sql, strtolower($status));
  }
}
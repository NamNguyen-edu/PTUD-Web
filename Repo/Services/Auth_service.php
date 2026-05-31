<?php
require_once __DIR__ . '/../Model/pdo.php';

class AuthService
{
  // Định nghĩa quyền hạn cụ thể cho từng role
  private array $permissions = [
    'admin'  => ['all'],
    'editor' => ['view_dashboard', 'manage_content', 'manage_own_posts', 'manage_profile'],
    'reader' => ['manage_own_posts', 'manage_profile']
  ];

  /**
   * Hàm xác thực người dùng đăng nhập
   */
  public function authenticate($identifier, $password)
  {
    // Đã nâng cấp SQL: Dùng LEFT JOIN để lấy thẳng `name` từ bảng `roles` và gán thành `role_name`
    $sql = "SELECT u.*, r.name AS role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.role_id 
            WHERE u.username = ? OR u.email = ? 
            LIMIT 1";

    $user = pdo_query_one($sql, $identifier, $identifier);

    if ($user) {
      if ($user['status'] === 'banned') {
        throw new Exception("Tài khoản của bạn đã bị khóa!");
      }
      if (password_verify($password, $user['password_hash']) || $password === $user['password_hash']) {
        return $user; // Lúc này $user đã có sẵn key 'role_name' (ví dụ: 'admin')
      }
    }
    return false;
  }

  /**
   * Hàm kiểm tra quyền truy cập
   */
  public function checkPermission(string $role, string $action): bool
  {
    // 1. Nếu role không tồn tại hoặc không được định nghĩa, chặn ngay lập tức
    if (!isset($this->permissions[$role])) {
      return false;
    }

    // 2. Quyền 'all' dành riêng cho Admin hoặc Super User
    if (in_array('all', $this->permissions[$role])) {
      return true;
    }

    // 3. Kiểm tra xem hành động có nằm trong danh sách quyền của role không
    return in_array($action, $this->permissions[$role]);
  }

  /**
   * Kiểm tra email đã tồn tại chưa
   */
  public function emailExists(string $email): bool
  {
    $sql = "SELECT COUNT(*) as count FROM users WHERE email = ?";
    $result = pdo_query_one($sql, $email);
    return ($result && $result['count'] > 0);
  }

  /**
   * Kiểm tra username đã tồn tại chưa
   */
  public function usernameExists(string $username): bool
  {
    $sql = "SELECT COUNT(*) as count FROM users WHERE username = ?";
    $result = pdo_query_one($sql, $username);
    return ($result && $result['count'] > 0);
  }

  /**
   * Tạo tài khoản mới
   */
  public function createAccount(string $fullname, string $email, string $username, string $password)
  {
    if ($this->emailExists($email)) {
      throw new Exception("Email này đã được đăng ký!");
    }
    if ($this->usernameExists($username)) {
      throw new Exception("Tên đăng nhập này đã được sử dụng!");
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO users (username, email, password_hash, full_name, role_id, status) VALUES (?, ?, ?, ?, 5, 'active')";
    return pdo_execute($sql, $username, $email, $hash, $fullname);
  }
}

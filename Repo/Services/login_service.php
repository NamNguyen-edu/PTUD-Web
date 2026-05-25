<?php
require_once __DIR__ . '/../Model/pdo.php';

class AuthService
{
  /**
   * Xác thực thông tin đăng nhập
   */
  public function authenticate($identifier, $password)
  {
    // Tìm user theo username HOẶC email
    $sql = "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1";
    $user = pdo_query_one($sql, $identifier, $identifier);

    if ($user && password_verify($password, $user['password_hash'])) {
      return $user;
    }
    return false;
  }

  /** tạo tài khoản mới */
  public function createAccount($fullname, $email, $password)
  {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    // Lấy username tạm từ email (bỏ phần sau @)
    $username = explode('@', $email)[0] . rand(1000, 9999);

    $sql = "INSERT INTO users (username, email, password_hash, full_name, role_id, status) 
                VALUES (?, ?, ?, ?, 5, 'active')";

    return pdo_execute($sql, $username, $email, $hash, $fullname);
  }
}
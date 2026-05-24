<?php

class AuthService
{
  private PDO $db;

  public function __construct(PDO $dbConnection)
  {
    $this->db = $dbConnection;
  }

  /**
   * Xử lý Đăng nhập truyền thống (Nhận cả Email hoặc Số điện thoại)
   */
  public function login($loginId, $password)
  {
    // Tìm user theo email hoặc phone (giả sử bảng users có 2 cột này)
    $sql = "SELECT id, full_name, email, role, password 
                FROM users 
                WHERE email = :loginId OR phone = :loginId 
                LIMIT 1";

    $stmt = $this->db->prepare($sql);
    $stmt->bindParam(':loginId', $loginId);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Kiểm tra mật khẩu (đã được băm bằng password_hash lúc đăng ký)
    if ($user && password_verify($password, $user['password'])) {
      unset($user['password']); // Xóa pass khỏi mảng trước khi ném vào Session cho an toàn
      return $user;
    }

    return false;
  }

  /**
   * Xử lý Đăng ký tài khoản mới
   */
  public function register($fullName, $email, $password)
  {
    // 1. Kiểm tra xem email đã tồn tại chưa
    $stmt = $this->db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->fetch()) {
      return ['success' => false, 'message' => 'Email này đã được đăng ký!'];
    }

    // 2. Băm mật khẩu (Mã hóa một chiều)
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // 3. Insert vào Database (mặc định cho role là 'Contributor' hoặc 'User')
    $insertSql = "INSERT INTO users (full_name, email, password, role, status) 
                      VALUES (:name, :email, :pass, 'Contributor', 'Active')";
    $insertStmt = $this->db->prepare($insertSql);
    $insertStmt->bindParam(':name', $fullName);
    $insertStmt->bindParam(':email', $email);
    $insertStmt->bindParam(':pass', $hashedPassword);

    if ($insertStmt->execute()) {
      return ['success' => true, 'message' => 'Đăng ký thành công!'];
    }

    return ['success' => false, 'message' => 'Có lỗi xảy ra, vui lòng thử lại!'];
  }

  /**
   * (Chuẩn bị sẵn) Xử lý Đăng nhập bằng Google
   */
  public function loginWithGoogle($googleEmail, $googleName)
  {
    // Code kiểm tra xem email google này có trong DB chưa, nếu chưa thì tự động tạo tài khoản...
  }
}

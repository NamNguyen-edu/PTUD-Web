<?php
require_once __DIR__ . '/../Services/login_service.php';

class AuthController
{
  private $service;

  public function __construct()
  {
    $this->service = new AuthService();
  }

  /**
   * Xử lý Login
   */
  public function login()
  {
    $user = $this->service->authenticate($_POST['username'] ?? '', $_POST['password'] ?? '');

    if ($user) {
      $_SESSION['user_id'] = $user['user_id'];
      $_SESSION['user_name'] = $user['full_name'];
      // Trả về response để JS nhận biết
      echo "success";
    } else {
      echo "Sai tài khoản hoặc mật khẩu!";
    }
    exit; // Dừng để không render trang login thêm lần nữa
  }

  /**
   * Xử lý Đăng ký
   */
  public function signup()
  {
    $fullname = $_POST['fullname'] ?? '';
    $email = $_POST['email_or_phone'] ?? '';
    $password = $_POST['password'] ?? '';

    try {
      $this->service->createAccount($fullname, $email, $password);
      echo "success";
    } catch (Exception $e) {
      echo "Đăng ký thất bại: " . $e->getMessage();
    }
    exit;
  }
}
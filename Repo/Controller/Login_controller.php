<?php
require_once __DIR__ . '/../Services/login_service.php';
require_once __DIR__ . '/../View/loginview.php';

class LoginController
{
  private AuthService $authService;
  private ViewEngine $viewEngine;

  // Truyền ViewEngine từ index.php vào để dùng chung cấu trúc hệ thống
  public function __construct(ViewEngine $viewEngine)
  {
    $this->authService = new AuthService();
    $this->viewEngine  = $viewEngine;
  }

  /**
   * Điều hướng hiển thị giao diện Đăng nhập / Đăng ký (GET)
   */
  public function show(): void
  {
    // Nếu người dùng đã đăng nhập rồi thì không cho quay lại trang login, đá về trang chủ
    if (isset($_SESSION['role'])) {
      header('Location: index.php?page=home');
      exit;
    }

    // Khởi tạo LoginView và ra lệnh render giao diện qua ViewEngine
    $loginView = new LoginView($this->viewEngine);
    $loginView->render([
      'META_TITLE' => 'NewsPulse - Đăng nhập hệ thống'
    ]);
  }

  /**
   * Xử lý logic Đăng nhập từ dữ liệu AJAX gửi lên (POST)
   */
  public function handleLogin(): void
  {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
      echo "Vui lòng nhập đầy đủ tài khoản và mật khẩu!";
      return;
    }

    $user = $this->authService->authenticate($username, $password);

    if ($user) {
      if ($user['status'] !== 'active') {
        echo "Tài khoản của bạn hiện đang bị tạm khóa!";
        return;
      }

      // Khởi động session nếu chưa có
      if (session_status() === PHP_SESSION_NONE) {
        session_start();
      }

      // Lưu thông tin vào Session hệ thống
      $_SESSION['user_id']   = $user['user_id'];
      $_SESSION['user_name'] = $user['full_name'];
      $_SESSION['role']      = $user['role_name']; // Chuỗi text phân quyền: 'admin', 'reader',...

      // Trả về tên quyền cụ thể để file JavaScript UI nhận diện và mở trang phù hợp
      echo $user['role_name'];
    } else {
      echo "Sai tài khoản hoặc mật khẩu!";
    }
  }

  /**
   * Xử lý logic Đăng ký tài khoản mới từ dữ liệu AJAX gửi lên (POST)
   */
  public function handleSignup(): void
  {
    $fullname = trim($_POST['fullname'] ?? '');
    $email    = trim($_POST['email_or_phone'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($fullname) || empty($email) || empty($password)) {
      echo "Vui lòng điền đủ mọi thông tin đăng ký!";
      return;
    }

    try {
      $this->authService->createAccount($fullname, $email, $password);
      echo "success";
    } catch (Exception $e) {
      echo "Lỗi hệ thống hoặc Email đã được đăng ký trước đó: " . $e->getMessage();
    }
  }
}

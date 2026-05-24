<?php
// Đường dẫn: Controller/Login_controller.php

// Gọi file Service vào
require_once __DIR__ . '/../Services/login_service.php';

// Biến $pdo lấy từ file pdo.php (đã được require ở index.php)
global $pdo;
$authService = new AuthService($pdo);

// Xác định xem người dùng đang Gửi form Đăng nhập hay Đăng ký
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

  // ==========================================
  // 1. XỬ LÝ ĐĂNG NHẬP
  // ==========================================
  if ($action === 'login') {
    // Lưu ý: Các thẻ input HTML của bạn phải có name="login_id" và name="password"
    $loginId = trim($_POST['login_id'] ?? '');
    $password = $_POST['password'] ?? '';

    $user = $authService->login($loginId, $password);

    if ($user) {
      // Lưu thông tin người dùng vào Session
      $_SESSION['user_id'] = $user['id'];
      $_SESSION['user_name'] = $user['full_name'];
      $_SESSION['user_role'] = $user['role']; // VD: Admin, Chief Editor...

      // Đăng nhập thành công -> Chuyển về Dashboard quản trị
      redirect('?page=admin_dashboard');
    } else {
      // Thất bại -> Lưu thông báo lỗi và quay lại trang đăng nhập
      $_SESSION['error_msg'] = "Tài khoản hoặc mật khẩu không chính xác.";
      redirect('?page=login');
    }
  }

  // ==========================================
  // 2. XỬ LÝ ĐĂNG KÝ
  // ==========================================
  elseif ($action === 'signup') {
    // Lưu ý: HTML cần có name="full_name", name="email", name="password"
    $fullName = trim($_POST['full_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    $result = $authService->register($fullName, $email, $password);

    if ($result['success']) {
      $_SESSION['success_msg'] = "Tạo tài khoản thành công! Vui lòng đăng nhập.";
      // Chuyển về trang login để họ đăng nhập
      redirect('?page=login');
    } else {
      $_SESSION['error_msg'] = $result['message'];
      // Bị lỗi (VD trùng email) -> Quay lại trang đăng ký
      redirect('?page=login&mode=signup');
    }
  }
}

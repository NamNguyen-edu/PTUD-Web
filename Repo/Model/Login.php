<?php
// auth_handler.php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Lấy action từ request (login hoặc register)
$action = $_POST['action'] ?? '';

if ($action === 'register') {
  $fullname = trim($_POST['fullname'] ?? '');
  $email    = trim($_POST['email'] ?? '');
  $password = $_POST['password'] ?? '';

  if (empty($fullname) || empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Vui lòng điền đủ thông tin.']);
    exit;
  }

  try {
    // 1. Kiểm tra email đã tồn tại chưa
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
      echo json_encode(['success' => false, 'message' => 'Email này đã được sử dụng.']);
      exit;
    }

    // 2. Mã hóa mật khẩu (Bắt buộc)
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // 3. Lưu vào Database (Mặc định role_id = 2 là User thường)
    $stmt = $pdo->prepare("INSERT INTO users (fullname, email, password, role_id) VALUES (?, ?, ?, 2)");
    $stmt->execute([$fullname, $email, $hashedPassword]);

    echo json_encode(['success' => true, 'message' => 'Đăng ký thành công!']);
  } catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Lỗi hệ thống: ' . $e->getMessage()]);
  }
} elseif ($action === 'login') {
  $email    = trim($_POST['email'] ?? '');
  $password = $_POST['password'] ?? '';

  try {
    // 1. Tìm user theo email
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
      // 2. Đăng nhập thành công -> Tạo Session
      $_SESSION['user_id'] = $user['id'];
      $_SESSION['user_fullname'] = $user['fullname'];
      $_SESSION['role_id'] = $user['role_id'];

      echo json_encode(['success' => true, 'message' => 'Đăng nhập thành công!']);
    } else {
      echo json_encode(['success' => false, 'message' => 'Email hoặc mật khẩu không đúng.']);
    }
  } catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Lỗi hệ thống: ' . $e->getMessage()]);
  }
}
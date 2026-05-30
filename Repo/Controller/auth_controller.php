<?php

require_once __DIR__ . '/../Services/auth_service.php';
require_once __DIR__ . '/PageController.php';

class AuthController
{
  private AuthService $service;

  public function __construct()
  {
    $this->service = new AuthService();
  }

  public function login(): void
  {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
      (new PageController())->render('login');
      return;
    }

    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($username === '' || $password === '') {
      echo "Vui lòng nhập đầy đủ tài khoản và mật khẩu.";
      exit;
    }

    try {
      $user = $this->service->authenticate($username, $password);

      if ($user) {
        $_SESSION['user_id'] = $user['user_id'] ?? ($user['id'] ?? null);
        $_SESSION['user_name'] = $user['full_name'] ?? ($user['name'] ?? 'Thành viên');
        $_SESSION['user_email'] = $user['email'] ?? '';

        $role = strtolower(trim($user['role_name'] ?? 'reader'));
        $_SESSION['role'] = $role;

        if (ob_get_length()) {
          ob_clean();
        }

        echo $role;
        exit;
      }

      echo "Tài khoản hoặc mật khẩu không chính xác!";
      exit;
    } catch (Exception $e) {
      echo "Hệ thống đang bảo trì hoặc gặp lỗi xử lý.";
      exit;
    }
  }

  public function signup(): void
  {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
      (new PageController())->render('signup');
      return;
    }

    $fullname = trim($_POST['fullname'] ?? '');
    $emailOrPhone = trim($_POST['email_or_phone'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($fullname === '' || $emailOrPhone === '' || $password === '') {
      echo "Vui lòng điền đầy đủ thông vị trí đăng ký.";
      exit;
    }

    try {
      if ($this->service->emailExists($emailOrPhone)) {
        echo "Email hoặc số điện thoại này đã được sử dụng.";
        exit;
      }

      $this->service->createAccount($fullname, $emailOrPhone, $password);

      echo "success";
      exit;
    } catch (Exception $e) {
      echo "Lỗi đăng ký: " . $e->getMessage();
      exit;
    }
  }

  public function logout(): void
  {
    if (session_status() === PHP_SESSION_NONE) {
      session_start();
    }

    session_unset();
    session_destroy();
    $this->redirect('?page=home');
  }

  public function currentUser(): void
  {
    if (session_status() === PHP_SESSION_NONE) {
      session_start();
    }

    header('Content-Type: application/json; charset=utf-8');

    $logged = isset($_SESSION['user_id']) && $_SESSION['user_id'];

    $avatarUrl = '';
    if ($logged) {
      require_once __DIR__ . '/../Services/profile_service.php';
      $userInfo = (new ProfileService())->getUserInfo(intval($_SESSION['user_id']));
      if ($userInfo) {
        $avatarUrl = $userInfo['avatar_url'] ?? '';
        if (!empty($userInfo['full_name'])) {
          $_SESSION['user_name'] = $userInfo['full_name'];
        }
      }
    }

    $user = [
      'id' => $logged ? ($_SESSION['user_id'] ?? null) : null,
      'name' => $logged ? ($_SESSION['user_name'] ?? ($_SESSION['user_fullname'] ?? '')) : null,
      'email' => $logged ? ($_SESSION['user_email'] ?? null) : null,
      'avatar_url' => $avatarUrl
    ];

    echo json_encode(['logged' => $logged, 'user' => $user]);
  }

  private function renderLogin(string $message = '', string $type = 'info'): void
  {
    if ($message !== '') {
      $this->showMessage($message, $type);
    }

    $pageController = new PageController();
    $pageController->render('login');
  }

  private function renderSignup(string $message = '', string $type = 'info'): void
  {
    if ($message !== '') {
      $this->showMessage($message, $type);
    }

    $pageController = new PageController();
    $pageController->render('signup');
  }

  private function showMessage(string $message, string $type = 'info'): void
  {
    $color = $type === 'error' ? 'red' : ($type === 'success' ? 'green' : '#333');
    echo '<div style="padding: 16px; margin: 16px 0; border: 1px solid ' . $color . '; color: ' . $color . '; background: #f9f9f9;">' . htmlspecialchars($message) . '</div>';
  }

  private function redirect(string $url): void
  {
    header('Location: ' . $url);
    exit;
  }
}
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
      echo $e->getMessage();
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
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($fullname === '' || $emailOrPhone === '' || $username === '' || $password === '') {
      echo "Vui lòng điền đầy đủ thông tin đăng ký.";
      exit;
    }

    try {
      if ($this->service->emailExists($emailOrPhone)) {
        echo "Email này đã được sử dụng.";
        exit;
      }

      if ($this->service->usernameExists($username)) {
        echo "Tên đăng nhập này đã được sử dụng.";
        exit;
      }

      $this->service->createAccount($fullname, $emailOrPhone, $username, $password);

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
      'avatar_url' => $avatarUrl,
      'role' => $logged ? ($_SESSION['role'] ?? 'guest') : 'guest'
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

  public function googleAuth(): void
  {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
      exit('Invalid request');
    }
    
    $credential = $_POST['credential'] ?? '';
    if (!$credential) {
      exit('No credential provided');
    }

    $parts = explode('.', $credential);
    if (count($parts) !== 3) {
      exit('Invalid credential format');
    }

    $base64 = str_replace(['-', '_'], ['+', '/'], $parts[1]);
    $pad = strlen($base64) % 4;
    if ($pad) {
        $base64 .= str_repeat('=', 4 - $pad);
    }
    
    $payload = json_decode(base64_decode($base64), true);
    if (!$payload || !isset($payload['email'])) {
      exit('Invalid Google payload');
    }

    $email = $payload['email'];
    $name = $payload['name'] ?? 'Google User';
    $mode = $_POST['mode'] ?? 'login';

    $sql = "SELECT u.*, r.name AS role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.email = ? LIMIT 1";
    $user = pdo_query_one($sql, $email);

    if ($mode === 'signup') {
        if ($user) {
            exit('EMAIL_EXISTS');
        }
        $username = explode('@', $email)[0] . rand(1000, 9999);
        $password = bin2hex(random_bytes(8));
        $this->service->createAccount($name, $email, $username, $password);
        $user = pdo_query_one($sql, $email);
    } else {
        if (!$user) {
            exit('EMAIL_NOT_FOUND');
        }
        if ($user['status'] === 'banned') {
            exit('BANNED');
        }
    }

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
    
    echo "Lỗi khi xử lý đăng nhập Google.";
    exit;
  }
}
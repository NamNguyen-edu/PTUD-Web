<?php

require_once __DIR__ . '/../Services/Auth_service.php';
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
            $this->renderLogin();
            return;
        }

        $username = trim($_POST['username'] ?? '');
        $password = trim($_POST['password'] ?? '');

        if ($username === '' || $password === '') {
            $this->renderLogin('Vui lòng nhập đầy đủ tài khoản và mật khẩu.', 'error');
            return;
        }

        try {
            $user = $this->service->findUserByLogin($username);

            if ($user && $this->service->verifyPassword($user, $password)) {
                $_SESSION['user_id'] = $user['user_id'] ?? ($user['id'] ?? null);
                $_SESSION['user_name'] = $user['full_name'] ?? ($user['name'] ?? 'Thành viên');
                $_SESSION['user_email'] = $user['email'] ?? '';

                $this->redirect('?page=home&login_success=1');
                return;
            }

            $this->renderLogin('Tài khoản hoặc mật khẩu không chính xác! Hãy kiểm tra lại.', 'error');
        } catch (PDOException $e) {
            $this->renderLogin('Hệ thống đang bảo trì hoặc mất kết nối Database.', 'error');
        }
    }

    public function signup(): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->renderSignup();
            return;
        }

        $fullname = trim($_POST['fullname'] ?? '');
        $emailOrPhone = trim($_POST['email_or_phone'] ?? '');
        $password = trim($_POST['password'] ?? '');

        if ($fullname === '' || $emailOrPhone === '' || $password === '') {
            $this->renderSignup('Vui lòng điền đầy đủ thông tin đăng ký.', 'error');
            return;
        }

        try {
            if ($this->service->existsUserByEmail($emailOrPhone)) {
                $this->renderSignup('Email hoặc số điện thoại này đã được sử dụng.', 'error');
                return;
            }

            $this->service->registerUser($fullname, $emailOrPhone, $password);
            $this->renderLogin('Đăng ký thành công. Vui lòng đăng nhập.', 'success');
        } catch (PDOException $e) {
            $this->renderSignup('Lỗi đăng ký: ' . $e->getMessage(), 'error');
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
        
        // CHỈ CHÈN THÊM ĐOẠN NÀY: Lấy avatar và đồng bộ tên mới nhất từ DB
        $avatarUrl = '';
        if ($logged) {
            require_once __DIR__ . '/../Services/profile_service.php';
            $userInfo = (new ProfileService())->getUserInfo(intval($_SESSION['user_id']));
            if ($userInfo) {
                $avatarUrl = $userInfo['avatar_url'] ?? '';
                if (!empty($userInfo['full_name'])) {
                    $_SESSION['user_name'] = $userInfo['full_name']; // Cập nhật lại session tên nếu có đổi
                }
            }
        }

        // Giữ nguyên cấu trúc mảng cũ của bạn, chỉ thêm trường avatar_url
        $user = [
            'id' => $logged ? ($_SESSION['user_id'] ?? null) : null,
            'name' => $logged ? ($_SESSION['user_name'] ?? ($_SESSION['user_fullname'] ?? '')) : null,
            'email' => $logged ? ($_SESSION['user_email'] ?? null) : null,
            'avatar_url' => $avatarUrl // Thêm trường này cho JS nhận diện
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

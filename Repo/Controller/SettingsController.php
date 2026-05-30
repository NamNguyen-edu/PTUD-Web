<?php

require_once __DIR__ . '/../Services/SettingsService.php';
require_once __DIR__ . '/../View/SettingsView.php';

class SettingsController
{
    private SettingsService $service;
    private SettingsView $view;

    public function __construct()
    {
        $this->service = new SettingsService();
        $this->view    = new SettingsView();
    }

    public function show(): void
    {
        if (!isset($_SESSION['user_id'])) {
            header('Location: ?page=login');
            exit;
        }

        $this->view->render();
    }

    public function changePassword(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Chưa đăng nhập.']);
            return;
        }

        $currentPassword = trim($_POST['current_password'] ?? '');
        $newPassword     = trim($_POST['new_password'] ?? '');
        $confirmPassword = trim($_POST['confirm_password'] ?? '');

        if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
            echo json_encode(['success' => false, 'message' => 'Vui lòng điền đầy đủ thông tin.']);
            return;
        }

        if ($newPassword !== $confirmPassword) {
            echo json_encode(['success' => false, 'message' => 'Mật khẩu xác nhận không khớp.']);
            return;
        }

        $result = $this->service->changePassword(
            intval($_SESSION['user_id']),
            $currentPassword,
            $newPassword
        );

        echo json_encode($result);
    }
}
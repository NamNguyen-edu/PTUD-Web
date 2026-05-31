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

        $homeCategories = [
            ['name' => 'Thời sự', 'slug' => 'thoi-su', 'emoji' => '🗞'],
            ['name' => 'Công nghệ', 'slug' => 'cong-nghe', 'emoji' => '💻'],
            ['name' => 'Kinh doanh', 'slug' => 'kinh-doanh', 'emoji' => '📈'],
            ['name' => 'Tài chính', 'slug' => 'tai-chinh', 'emoji' => '💵'],
            ['name' => 'Thị trường', 'slug' => 'thi-truong', 'emoji' => '📊'],
            ['name' => 'Khởi nghiệp', 'slug' => 'startup', 'emoji' => '🚀'],
            ['name' => 'Thế giới', 'slug' => 'the-gioi', 'emoji' => '🌍'],
            ['name' => 'Pháp luật', 'slug' => 'phap-luat', 'emoji' => '⚖️'],
            ['name' => 'Môi trường', 'slug' => 'moi-truong', 'emoji' => '🌱'],
            ['name' => 'Khoa học', 'slug' => 'khoa-hoc', 'emoji' => '🔬'],
            ['name' => 'Sức khỏe', 'slug' => 'suc-khoe', 'emoji' => '❤️'],
            ['name' => 'Xe', 'slug' => 'xe', 'emoji' => '🚗'],
            ['name' => 'Giải trí', 'slug' => 'giai-tri', 'emoji' => '🎬'],
            ['name' => 'Đời sống', 'slug' => 'doi-song', 'emoji' => '🌿'],
            ['name' => 'Thể thao', 'slug' => 'the-thao', 'emoji' => '⚽'],
        ];

        $topicsHtml = '';
        foreach ($homeCategories as $cat) {
            $topicsHtml .= '<button type="button" class="btn topic-chip" data-topic="' . htmlspecialchars($cat['slug']) . '">' . $cat['emoji'] . ' ' . htmlspecialchars($cat['name']) . '</button>' . "\n";
        }

        $this->view->render(['TOPICS_OPTIONS' => $topicsHtml]);
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
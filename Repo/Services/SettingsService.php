<?php

require_once __DIR__ . '/../Model/pdo.php';

class SettingsService
{
    public function getUserSettings(int $userId): ?array
    {
        return pdo_query_one("
            SELECT user_id, username, email, full_name, avatar_url, bio
            FROM users
            WHERE user_id = ? AND status = 'active'
        ", $userId) ?: null;
    }

    public function changePassword(int $userId, string $currentPassword, string $newPassword): array
    {
        $user = pdo_query_one("
            SELECT password_hash FROM users WHERE user_id = ? AND status = 'active'
        ", $userId);

        if (!$user) {
            return ['success' => false, 'message' => 'Người dùng không tồn tại.'];
        }

        if (!password_verify($currentPassword, $user['password_hash'])) {
            return ['success' => false, 'message' => 'Mật khẩu hiện tại không đúng.'];
        }

        if (strlen($newPassword) < 6) {
            return ['success' => false, 'message' => 'Mật khẩu mới phải có ít nhất 6 ký tự.'];
        }

        if ($currentPassword === $newPassword) {
            return ['success' => false, 'message' => 'Mật khẩu mới không được trùng mật khẩu cũ.'];
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        pdo_execute("
            UPDATE users SET password_hash = ? WHERE user_id = ?
        ", $newHash, $userId);

        return ['success' => true, 'message' => 'Đổi mật khẩu thành công.'];
    }
}
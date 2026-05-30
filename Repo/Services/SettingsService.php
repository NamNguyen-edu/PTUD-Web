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
        SELECT password_hash FROM users WHERE user_id = ?
    ", $userId);

    if (!$user) {
        return ['success' => false, 'message' => 'Người dùng không tồn tại.'];
    }

    $storedPassword = $user['password_hash'];

    // Kiểm tra cả plain text lẫn bcrypt
    $isCorrect = false;
    if (str_starts_with($storedPassword, '$2y$')) {
        // Đã hash bcrypt
        $isCorrect = password_verify($currentPassword, $storedPassword);
    } else {
        // Plain text (chưa hash)
        $isCorrect = ($currentPassword === $storedPassword);
    }

    if (!$isCorrect) {
        return ['success' => false, 'message' => 'Mật khẩu hiện tại không đúng.'];
    }

    if (strlen($newPassword) < 6) {
        return ['success' => false, 'message' => 'Mật khẩu mới phải có ít nhất 6 ký tự.'];
    }

    if ($currentPassword === $newPassword) {
        return ['success' => false, 'message' => 'Mật khẩu mới không được trùng mật khẩu cũ.'];
    }

    // Lưu luôn dạng bcrypt sau khi đổi
    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    pdo_execute("
        UPDATE users SET password_hash = ? WHERE user_id = ?
    ", $newHash, $userId);

    return ['success' => true, 'message' => 'Đổi mật khẩu thành công.'];
}
}
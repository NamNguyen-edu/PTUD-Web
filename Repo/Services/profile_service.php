<?php
require_once __DIR__ . '/../Model/pdo.php';

class ProfileService
{
    /**
     * Lấy thông tin chi tiết của một User từ bảng users
     */
    public function getUserInfo(int $userId): ?array
    {
        $sql = "SELECT user_id, username, email, full_name, avatar_url, bio, skills
                FROM users
                WHERE user_id = :user_id
                LIMIT 1";
        try {
            $db   = pdo_get_connection();
            $stmt = $db->prepare($sql);
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            return $user ?: null;
        } catch (PDOException $e) {
            return null;
        }
    }

    /**
     * Lấy danh sách bài viết của User
     */
    public function getUserArticles(int $userId): array
    {
        $sql = "SELECT
                    a.article_id,
                    a.title,
                    a.status,
                    a.created_at,
                    a.view_count,
                    c.name AS category_name
                FROM articles a
                LEFT JOIN article_categories ac ON a.article_id = ac.article_id
                LEFT JOIN categories c          ON ac.category_id = c.category_id
                WHERE a.user_id = :user_id AND a.is_deleted = 0
                ORDER BY a.created_at DESC";
        try {
            $db   = pdo_get_connection();
            $stmt = $db->prepare($sql);
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }

    /**
     * Cập nhật thông tin cơ bản và kỹ năng của User vào Database
     */
    public function updateUserInfo(int $userId, string $fullName, string $bio, string $skills): bool
    {
        $sql = "UPDATE users 
                SET full_name = :full_name, bio = :bio, skills = :skills, updated_at = NOW() 
                WHERE user_id = :user_id";
        try {
            $db   = pdo_get_connection();
            $stmt = $db->prepare($sql);
            $stmt->bindValue(':full_name', $fullName, PDO::PARAM_STR);
            $stmt->bindValue(':bio', $bio, PDO::PARAM_STR);
            $stmt->bindValue(':skills', $skills, PDO::PARAM_STR);
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Cập nhật đường dẫn ảnh đại diện mới sau khi crop
     */
    public function updateAvatarUrl(int $userId, string $avatarUrl): bool
    {
        $sql = "UPDATE users 
                SET avatar_url = :avatar_url, updated_at = NOW() 
                WHERE user_id = :user_id";
        try {
            $db   = pdo_get_connection();
            $stmt = $db->prepare($sql);
            $stmt->bindValue(':avatar_url', $avatarUrl, PDO::PARAM_STR);
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }
    public function getReadingHistory(int $userId): array {

    $sql = "
        SELECT
            h.history_id,
            h.read_count,
            h.last_read_at,

            a.article_id,
            a.title,
            a.slug,
            a.thumbnail_url,
            a.excerpt

        FROM user_read_history h

        INNER JOIN articles a
            ON h.article_id = a.article_id

        WHERE h.user_id = :user_id

        ORDER BY h.last_read_at DESC
    ";

    try {
        $db = pdo_get_connection();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(
            ':user_id',
            $userId,
            PDO::PARAM_INT
        );
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return [];
    }
}
}
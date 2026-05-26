<?php
require_once __DIR__ . '/../Model/pdo.php';

class ProfileService
{
    /**
     * Lấy thông tin chi tiết của một User từ bảng users
     */
    public function getUserInfo(int $userId): ?array
    {
        $sql = "SELECT user_id, username, email, full_name, avatar_url, bio
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
     * Lấy danh sách bài viết của User (JOIN category để lấy tên chuyên mục)
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
                WHERE a.user_id = :user_id
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
}
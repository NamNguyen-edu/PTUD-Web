<?php
// Nhúng file kết nối dùng chung của nhóm ăn theo database đám mây Aiven
require_once __DIR__ . '/../Model/pdo.php';

class ProfileService {

    /**
     * 1. Hàm lấy thông tin chi tiết của một User từ bảng `users`
     */
    public function getUserInfo(int $userId): ?array {
        $db = pdo_get_connection();
        
        // Sửa chính xác theo các cột thực tế của nhóm: user_id, username, email, full_name, avatar_url, bio
        $sql = "SELECT user_id, username, email, full_name, avatar_url, bio 
                FROM users 
                WHERE user_id = :user_id 
                LIMIT 1";
        
        try {
            $stmt = $db->prepare($sql);
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $user ? $user : null;
            
        } catch (PDOException $e) {
            return null;
        }
    }

    /**
     * 2. Hàm lấy danh sách tất cả bài viết do riêng User này quản lý (JOIN qua bảng Chuyên mục)
     */
    public function getUserArticles(int $userId): array {
        $db = pdo_get_connection();
        
        // Cú pháp JOIN từ bảng articles -> trung gian article_categories -> categories để lấy tên danh mục
        $sql = "SELECT 
                    a.article_id, 
                    a.title, 
                    a.status, 
                    a.created_at, 
                    a.view_count, 
                    c.name AS category_name
                FROM articles a
                LEFT JOIN article_categories ac ON a.article_id = ac.article_id
                LEFT JOIN categories c ON ac.category_id = c.category_id
                WHERE a.user_id = :user_id 
                ORDER BY a.created_at DESC";
                
        try {
            $stmt = $db->prepare($sql);
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    /**
     * Lấy chi tiết thông tin một bài viết dựa vào ID và User sở hữu (Dùng khi bấm Sửa bài)
     */
    public function getArticleById(int $articleId, int $userId): ?array {
        $db = pdo_get_connection();
        $sql = "SELECT * FROM articles WHERE article_id = :article_id AND user_id = :user_id LIMIT 1";
        try {
            $stmt = $db->prepare($sql);
            $stmt->bindValue(':article_id', $articleId, PDO::PARAM_INT);
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $article = $stmt->fetch(PDO::FETCH_ASSOC);
            return $article ? $article : null;
        } catch (PDOException $e) { 
            return null; 
        }
    }

    /**
     * Tự động nhận diện để INSERT bài viết mới hoặc UPDATE bài viết cũ
     */
    public function saveArticle(int $userId, array $data): int {
        $db = pdo_get_connection();
        $articleId = !empty($data['article_id']) ? intval($data['article_id']) : null;
        
        $title   = $data['title'] ?? 'Bài viết không tiêu đề';
        $content = $data['content'] ?? '';
        $slug    = $data['slug'] ?? '';
        $excerpt = $data['excerpt'] ?? '';
        $status  = $data['status'] ?? 'draft'; // Mặc định nhận trạng thái nháp hoặc đăng bài

        if ($articleId) {
            // Chế độ: UPDATE (Sửa bài dang dở)
            $sql = "UPDATE articles 
                    SET title = ?, slug = ?, excerpt = ?, content = ?, status = ?, updated_at = NOW() 
                    WHERE article_id = ? AND user_id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute([$title, $slug, $excerpt, $content, $status, $articleId, $userId]);
            return $articleId;
        } else {
            // Chế độ: INSERT (Tạo bài mới tinh)
            $sql = "INSERT INTO articles (title, slug, excerpt, content, status, user_id, created_at, updated_at, view_count) 
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), 0)";
            $stmt = $db->prepare($sql);
            $stmt->execute([$title, $slug, $excerpt, $content, $status, $userId]);
            return (int)$db->lastInsertId();
        }
    }
}
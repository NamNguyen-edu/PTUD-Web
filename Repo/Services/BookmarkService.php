<?php
require_once __DIR__ . '/../Model/pdo.php';

class BookmarkService
{
    public function isBookmarked(int $userId, int $articleId): bool
    {
        $row = pdo_query_one(
            "SELECT bookmark_id FROM bookmarks WHERE user_id = ? AND article_id = ?",
            $userId, $articleId
        );
        return !empty($row);
    }

    public function toggle(int $userId, int $articleId): bool
    {
        if ($this->isBookmarked($userId, $articleId)) {
            pdo_execute("DELETE FROM bookmarks WHERE user_id = ? AND article_id = ?", $userId, $articleId);
            return false; // đã xóa
        } else {
            pdo_execute("INSERT INTO bookmarks (user_id, article_id) VALUES (?, ?)", $userId, $articleId);
            return true; // đã thêm
        }
    }

    public function getUserBookmarks(int $userId): array
    {
        return pdo_query("
            SELECT a.article_id, a.title, a.slug, a.thumbnail_url, a.excerpt, a.published_at, b.created_at AS bookmarked_at
            FROM bookmarks b
            INNER JOIN articles a ON b.article_id = a.article_id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        ", $userId);
    }
}

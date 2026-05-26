<?php
require_once __DIR__ . '/../Model/pdo.php';

class PostnewsService
{
    public function saveArticle(int $userId, array $data): int
    {
        $articleId = isset($data['article_id']) 
            ? intval($data['article_id']) 
            : 0;

        $title   = $data['title']   ?? '';
        $content = $data['content'] ?? '';
        $slug    = $data['slug']    ?? '';
        $excerpt = $data['excerpt'] ?? '';
        $status  = $data['status']  ?? 'draft';

        if ($articleId > 0) {
            // UPDATE
            pdo_execute(
                "UPDATE articles
                 SET title=?, content=?, slug=?, excerpt=?, status=?, updated_at=NOW()
                 WHERE article_id=? AND user_id=?",
                $title, $content, $slug, $excerpt, $status,
                $articleId, $userId
            );
            return $articleId;
        }

        // INSERT
        return (int) pdo_execute_return_last_id(
            "INSERT INTO articles (user_id, title, content, slug, excerpt, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())",
            $userId, $title, $content, $slug, $excerpt, $status
        );
    }

    public function getArticleById(int $articleId, int $userId): ?array
    {
        $row = pdo_query_one(
            "SELECT * FROM articles WHERE article_id=? AND user_id=? LIMIT 1",
            $articleId, $userId
        );
        return $row ?: null;
    }
}
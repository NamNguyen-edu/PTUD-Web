<?php

require_once __DIR__ . '/../Model/pdo.php';

class PostnewsService
{
    public function saveArticle($userId, $data)
    {
        $conn = pdo_get_connection();

        $articleId = $data['article_id'] ?? null;

        // ======================================================
        // UPDATE EXISTING ARTICLE
        // ======================================================

        if (!empty($articleId)) {

            $sql = "
                UPDATE articles
                SET
                    title = :title,
                    content = :content,
                    slug = :slug,
                    excerpt = :excerpt,
                    status = :status,
                    updated_at = NOW()
                WHERE article_id = :article_id
                AND user_id = :user_id
            ";

            $stmt = $conn->prepare($sql);

            $stmt->execute([
                ':title'      => $data['title'] ?? '',
                ':content'    => $data['content'] ?? '',
                ':slug'       => $data['slug'] ?? '',
                ':excerpt'    => $data['excerpt'] ?? '',
                ':status'     => $data['status'] ?? 'draft',
                ':article_id' => $articleId,
                ':user_id'    => $userId
            ]);

            return $articleId;
        }

        // ======================================================
        // INSERT NEW ARTICLE
        // ======================================================

        $sql = "
            INSERT INTO articles
            (
                user_id,
                title,
                content,
                slug,
                excerpt,
                status,
                created_at
            )
            VALUES
            (
                :user_id,
                :title,
                :content,
                :slug,
                :excerpt,
                :status,
                NOW()
            )
        ";

        $stmt = $conn->prepare($sql);

        $stmt->execute([
            ':user_id' => $userId,
            ':title'   => $data['title'] ?? '',
            ':content' => $data['content'] ?? '',
            ':slug'    => $data['slug'] ?? '',
            ':excerpt' => $data['excerpt'] ?? '',
            ':status'  => $data['status'] ?? 'draft'
        ]);

        return $conn->lastInsertId();
    }

    public function getArticleById($articleId, $userId)
    {
        $sql = "
            SELECT *
            FROM articles
            WHERE article_id = ?
            AND user_id = ?
        ";

        return pdo_query_one($sql, $articleId, $userId);
    }
}
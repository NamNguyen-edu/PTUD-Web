<?php

require_once __DIR__ . '/../Model/pdo.php';

class CommentService {

    public function getArticleIdBySlug(string $slug): ?int {
        $slug = trim($slug);

        $row = pdo_query_one(
            "SELECT article_id FROM articles WHERE slug = ? AND status = 'published' LIMIT 1",
            $slug
        );

        return $row ? (int) $row['article_id'] : null;
    }

    public function getCommentsByArticleId(int $articleId): array {
        $comments = pdo_query(
            "SELECT
                c.comment_id,
                c.parent_id,
                c.content,
                c.status,
                c.created_at,
                u.user_id AS author_id,
                COALESCE(u.full_name, u.username, 'Thành viên') AS author_name
            FROM comments c
            JOIN users u ON u.user_id = c.user_id
            WHERE c.article_id = ?
              AND c.status = 'approved'
            ORDER BY c.created_at ASC",
            $articleId
        );

        return $this->buildTree($comments);
    }

    public function addComment(int $articleId, int $userId, string $content, ?int $parentId = null): int {
        if ($parentId !== null && !$this->isValidParent($parentId, $articleId)) {
            throw new InvalidArgumentException('Bình luận phản hồi không tồn tại hoặc không hợp lệ.');
        }

        return (int) pdo_execute_return_last_id(
            "INSERT INTO comments (article_id, user_id, parent_id, content, status, created_at)
             VALUES (?, ?, ?, ?, 'approved', NOW())",
            $articleId,
            $userId,
            $parentId,
            trim($content)
        );
    }

    private function isValidParent(int $parentId, int $articleId): bool {
        return (bool) pdo_query_one(
            "SELECT 1 FROM comments WHERE comment_id = ? AND article_id = ? LIMIT 1",
            $parentId,
            $articleId
        );
    }

    private function buildTree(array $comments): array {
        $index = [];

        foreach ($comments as $comment) {
            $comment['replies'] = [];
            $comment['parent_id'] = $comment['parent_id'] !== null ? (int) $comment['parent_id'] : null;
            $index[(int) $comment['comment_id']] = $comment;
        }

        $tree = [];

        foreach ($index as $commentId => $comment) {
            if ($comment['parent_id'] === null || !isset($index[$comment['parent_id']])) {
                $tree[] = &$index[$commentId];
            } else {
                $index[$comment['parent_id']]['replies'][] = &$index[$commentId];
            }
        }

        return $tree;
    }
}

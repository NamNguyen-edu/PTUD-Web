<?php

require_once __DIR__ . '/../Model/pdo.php';

class NotificationController
{
    // Kiểm tra bài viết mới theo chủ đề yêu thích
    public function checkNewArticles(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        $since   = trim($_GET['since'] ?? '');
        $topics  = trim($_GET['topics'] ?? '');

        if ($since === '' || $topics === '') {
            echo json_encode(['count' => 0, 'items' => []]);
            return;
        }

        $topicList = array_filter(array_map('trim', explode(',', $topics)));
        if (empty($topicList)) {
            echo json_encode(['count' => 0, 'items' => []]);
            return;
        }

        // Tạo placeholders cho IN clause
        $placeholders = implode(',', array_fill(0, count($topicList), '?'));

        $params = array_merge([$since], $topicList);

        $rows = pdo_query("
            SELECT DISTINCT a.article_id, a.title, a.slug, a.published_at
            FROM articles a
            INNER JOIN article_categories ac ON a.article_id = ac.article_id
            INNER JOIN categories c ON ac.category_id = c.category_id
            WHERE a.status = 'published'
              AND a.published_at > ?
              AND c.slug IN ($placeholders)
            ORDER BY a.published_at DESC
            LIMIT 5
        ", ...$params);

        echo json_encode([
            'count' => count($rows),
            'items' => $rows
        ]);
    }

    // Kiểm tra bình luận mới trên bài viết của user
    public function checkNewComments(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['count' => 0, 'items' => []]);
            return;
        }

        $since  = trim($_GET['since'] ?? '');
        $userId = intval($_SESSION['user_id']);

        if ($since === '') {
            echo json_encode(['count' => 0, 'items' => []]);
            return;
        }

        $rows = pdo_query("
            SELECT c.comment_id, c.content, c.created_at,
                   a.title AS article_title, a.slug AS article_slug
            FROM comments c
            INNER JOIN articles a ON c.article_id = a.article_id
            WHERE a.user_id = ?
              AND c.user_id != ?
              AND c.created_at > ?
            ORDER BY c.created_at DESC
            LIMIT 5
        ", $userId, $userId, $since);

        echo json_encode([
            'count' => count($rows),
            'items' => $rows
        ]);
    }
}
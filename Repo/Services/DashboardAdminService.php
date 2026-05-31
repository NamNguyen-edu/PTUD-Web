<?php

require_once __DIR__ . '/../Model/pdo.php';

class DashboardAdminService {

    public function getDashboardData(): array {
        // 1. Overview counts
        $totalArticlesResult = pdo_query_one("SELECT COUNT(*) AS total_articles FROM articles");
        $totalArticles = $totalArticlesResult ? (int) $totalArticlesResult['total_articles'] : 0;

        $pendingArticlesResult = pdo_query_one("SELECT COUNT(*) AS pending_articles FROM articles WHERE status = 'pending'");
        $pendingArticles = $pendingArticlesResult ? (int) $pendingArticlesResult['pending_articles'] : 0;

        $activeUsersResult = pdo_query_one("SELECT COUNT(*) AS active_users FROM users WHERE status = 'active'");
        $activeUsers = $activeUsersResult ? (int) $activeUsersResult['active_users'] : 0;

        $publishedArticlesResult = pdo_query_one("SELECT COUNT(*) AS published_articles FROM articles WHERE status = 'published'");
        $publishedArticles = $publishedArticlesResult ? (int) $publishedArticlesResult['published_articles'] : 0;

        $draftArticlesResult = pdo_query_one("SELECT COUNT(*) AS draft_articles FROM articles WHERE status = 'draft'");
        $draftArticles = $draftArticlesResult ? (int) $draftArticlesResult['draft_articles'] : 0;

        // 2. Pending queue (Approval queue)
        $pendingQueueSql = "
            SELECT
                a.article_id,
                a.title,
                a.slug,
                a.created_at,
                u.full_name   AS author_name,
                u.username    AS author_username,
                c.name        AS primary_category
            FROM articles a
            JOIN users u ON u.user_id = a.user_id
            LEFT JOIN article_categories ac ON ac.article_id = a.article_id AND ac.is_primary = 1
            LEFT JOIN categories c ON c.category_id = ac.category_id
            WHERE a.status = 'pending'
            ORDER BY a.created_at ASC
            LIMIT 10
        ";
        $pendingQueue = pdo_query($pendingQueueSql);
        if (!$pendingQueue) {
            $pendingQueue = [];
        }

        // 3. Recent activity
        // Published
        $published = pdo_query("
            SELECT
                'article_published'          AS type,
                u.full_name                  AS actor,
                a.title                      AS target,
                a.slug                       AS target_slug,
                a.published_at               AS created_at
            FROM articles a
            JOIN users u ON u.user_id = a.user_id
            WHERE a.status = 'published' AND a.published_at IS NOT NULL
            ORDER BY a.published_at DESC
            LIMIT 10
        ");
        if (!$published) $published = [];

        // Drafts
        $drafts = pdo_query("
            SELECT
                'article_draft'  AS type,
                u.full_name      AS actor,
                a.title          AS target,
                a.slug           AS target_slug,
                a.created_at
            FROM articles a
            JOIN users u ON u.user_id = a.user_id
            WHERE a.status = 'draft'
            ORDER BY a.created_at DESC
            LIMIT 10
        ");
        if (!$drafts) $drafts = [];

        // Archived / Rejected
        $archived = pdo_query("
            SELECT
                'article_rejected' AS type,
                u.full_name        AS actor,
                a.title            AS target,
                a.slug             AS target_slug,
                a.updated_at       AS created_at
            FROM articles a
            JOIN users u ON u.user_id = a.approved_by
            WHERE a.status = 'archived' AND a.approved_by IS NOT NULL
            ORDER BY a.updated_at DESC
            LIMIT 10
        ");
        if (!$archived) $archived = [];

        // Comments
        $comments = pdo_query("
            SELECT
                'comment_added'  AS type,
                u.full_name      AS actor,
                a.title          AS target,
                a.slug           AS target_slug,
                c.created_at
            FROM comments c
            JOIN users u ON u.user_id = c.user_id
            JOIN articles a ON a.article_id = c.article_id
            WHERE c.status = 'approved'
            ORDER BY c.created_at DESC
            LIMIT 10
        ");
        if (!$comments) $comments = [];

        // New Users
        $newUsers = pdo_query("
            SELECT
                'user_registered' AS type,
                u.full_name       AS actor,
                r.name            AS target,
                NULL              AS target_slug,
                u.created_at
            FROM users u
            JOIN roles r ON r.role_id = u.role_id
            ORDER BY u.created_at DESC
            LIMIT 10
        ");
        if (!$newUsers) $newUsers = [];

        // Merge and sort by created_at DESC
        $all = array_merge($published, $drafts, $archived, $comments, $newUsers);
        usort($all, function($a, $b) {
            $timeA = isset($a['created_at']) ? strtotime($a['created_at']) : 0;
            $timeB = isset($b['created_at']) ? strtotime($b['created_at']) : 0;
            return $timeB - $timeA;
        });
        $recentActivity = array_slice($all, 0, 20);

        return [
            'overview' => [
                'total_articles'     => $totalArticles,
                'pending_articles'   => $pendingArticles,
                'active_users'       => $activeUsers,
                'published_articles' => $publishedArticles,
                'draft_articles'     => $draftArticles,
            ],
            'pending_queue'   => $pendingQueue,
            'recent_activity' => $recentActivity
        ];
    }
}

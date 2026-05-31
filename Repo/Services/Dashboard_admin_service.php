<?php

require_once __DIR__ . "/../Model/pdo.php";

function getPDO(): PDO {
    return pdo_get_connection();
    }
    
function getTotalArticles(): int {
    $pdo = getPDO();
    $stmt = $pdo->query("SELECT COUNT(*) FROM articles");
    return (int) $stmt->fetchColumn();
}


function getPendingApprovalsCount(): int {
    $pdo = getPDO();
    $stmt = $pdo->query("SELECT COUNT(*) FROM articles WHERE status = 'pending'");
    return (int) $stmt->fetchColumn();
}


function getActiveUsersCount(): int {
    $pdo = getPDO();
    $stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE status = 'active'");
    return (int) $stmt->fetchColumn();
}


function getAvgApprovalTimeMinutes(): float {
    $pdo = getPDO();
    $stmt = $pdo->query("
        SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, published_at)) AS avg_min
        FROM articles
        WHERE status = 'published'
          AND published_at IS NOT NULL
          AND published_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ");
    $val = $stmt->fetchColumn();
    return $val !== null ? round((float) $val, 1) : 0.0;
}


function getWorkflowStatus(): array {
    $pdo = getPDO();

    // Tổng bài viết
    $total = (int) $pdo->query("SELECT COUNT(*) FROM articles")->fetchColumn();

    if ($total === 0) {
        return [
            'published' => 0, 'draft' => 0,
            'pending'   => 0, 'archived' => 0,
            'live_count' => 0,
        ];
    }

    // Đếm theo từng trạng thái
    $stmt = $pdo->query("
        SELECT status, COUNT(*) AS cnt
        FROM articles
        GROUP BY status
    ");
    $counts = ['draft' => 0, 'pending' => 0, 'published' => 0, 'archived' => 0];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $counts[$row['status']] = (int) $row['cnt'];
    }

    return [
        'published'  => round($counts['published']  / $total * 100, 1),
        'draft'      => round($counts['draft']       / $total * 100, 1),
        'pending'    => round($counts['pending']     / $total * 100, 1),
        'archived'   => round($counts['archived']    / $total * 100, 1),
        'live_count' => $counts['published'],
    ];
}

/**
 * Danh sách bài đang chờ duyệt, sắp xếp theo cũ nhất trước (ưu tiên urgent)
 * Mỗi item gồm: article_id, title, slug, author_name, primary_category, created_at
 * @param int $limit số lượng bài tối đa trả về
 */
function getApprovalQueue(int $limit = 10): array {
    $pdo = getPDO();
    $stmt = $pdo->prepare("
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
        LIMIT :lim
    ");
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}


/**
 * @param int $limit
 */
function getRecentActivity(int $limit = 20): array {
    $pdo = getPDO();

    // Bài mới published
    $published = $pdo->query("
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
    ")->fetchAll(PDO::FETCH_ASSOC);

    // Draft mới tạo
    $drafts = $pdo->query("
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
    ")->fetchAll(PDO::FETCH_ASSOC);

    // Bài bị archive (coi như rejected)
    $archived = $pdo->query("
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
    ")->fetchAll(PDO::FETCH_ASSOC);

    // Bình luận mới approved
    $comments = $pdo->query("
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
    ")->fetchAll(PDO::FETCH_ASSOC);

    // User mới đăng ký
    $newUsers = $pdo->query("
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
    ")->fetchAll(PDO::FETCH_ASSOC);

    // Gộp và sắp xếp theo thời gian mới nhất
    $all = array_merge($published, $drafts, $archived, $comments, $newUsers);
    usort($all, fn($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));

    return array_slice($all, 0, $limit);
}

if (isset($_GET['action']) && $_GET['action'] === 'get_dashboard_data') {
    header('Content-Type: application/json; charset=utf-8');

    $data = [
        'kpi' => [
            'total_articles'        => getTotalArticles(),
            'pending_approvals'     => getPendingApprovalsCount(),
            'active_users'          => getActiveUsersCount(),
            'avg_approval_time_min' => getAvgApprovalTimeMinutes(),
        ],
        'workflow_status' => getWorkflowStatus(),
        'approval_queue'  => getApprovalQueue(10),
        'recent_activity' => getRecentActivity(20),
    ];

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
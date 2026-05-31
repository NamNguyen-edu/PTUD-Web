
<?php
require_once __DIR__ . '/../Model/pdo.php';

function getArticleDetail(int $article_id): array|false {
    $article = pdo_query_one("
        SELECT
            a.article_id,
            a.title,
            a.slug,
            a.excerpt,
            a.content,
            a.thumbnail_url,
            a.status,
            a.is_featured,
            a.view_count,
            a.published_at,
            a.created_at,
            a.updated_at,
            -- Tác giả
            u.user_id       AS author_id,
            u.full_name     AS author_name,
            u.username      AS author_username,
            u.avatar_url    AS author_avatar,
            -- Người duyệt (nếu có)
            ap.full_name    AS approved_by_name,
            ap.username     AS approved_by_username,
            -- Danh mục chính
            c.name          AS primary_category,
            c.slug          AS category_slug
        FROM articles a
        JOIN users u ON u.user_id = a.user_id
        LEFT JOIN users ap ON ap.user_id = a.approved_by
        LEFT JOIN article_categories ac ON ac.article_id = a.article_id AND ac.is_primary = 1
        LEFT JOIN categories c ON c.category_id = ac.category_id
        WHERE a.article_id = ?
    ", $article_id);

    if (!$article) return false;

    // Lấy tags của bài
    $article['tags'] = pdo_query("
        SELECT t.tag_id, t.name, t.slug
        FROM tags t
        JOIN article_tags at ON at.tag_id = t.tag_id
        WHERE at.article_id = ?
    ", $article_id);

    // Tính thời gian đã ở giai đoạn pending (phút)
    if ($article['status'] === 'pending') {
        $article['time_in_stage_minutes'] = (int) pdo_query_one("
            SELECT TIMESTAMPDIFF(MINUTE, updated_at, NOW()) AS mins
            FROM articles WHERE article_id = ?
        ", $article_id)['mins'];
    }

    return $article;
}

/**
 * @param int $article_id
 * @param int $approver_id  user_id của tổng biên tập đang đăng nhập
 * @return bool
 */
function approveAndPublish(int $article_id, int $approver_id): bool {
    // Kiểm tra bài có đang ở trạng thái pending không
    $article = pdo_query_one(
        "SELECT status FROM articles WHERE article_id = ?",
        $article_id
    );

    if (!$article || $article['status'] !== 'pending') return false;

    pdo_execute("
    UPDATE articles
    SET status       = 'published',
        approved_by  = ?,
        published_at = NOW(),
        updated_at   = NOW()
    WHERE article_id = ?
    ", $approver_id, $article_id);

    return true;
}


/**
 note
 *
 * @param int    $article_id
 * @param int    $editor_id      user_id của tổng biên tập
 * @param string $revision_note  Nội dung yêu cầu chỉnh sửa
 * @return bool
 */
function requestRevision(int $article_id, int $editor_id, string $revision_note, ?string $edited_title = null, ?string $edited_content = null): bool {
    $article = pdo_query_one(
        "SELECT status, title, content, user_id FROM articles WHERE article_id = ?",
        $article_id
    );

    if (!$article || $article['status'] !== 'pending') return false;

    require_once __DIR__ . '/Version_control_service.php';
    $versionService = new VersionControlService();

    // 1. Đảm bảo bản 1.0 (hoặc bản gốc hiện tại) được chụp lại nếu chưa có phiên bản nào
    $versionService->ensureOriginalVersion($article_id, $article['title'], $article['content'], (int)$article['user_id']);

    // 2. Kiểm tra giới hạn phiên bản 1.3
    $rowCount = pdo_query_one("SELECT COUNT(*) as total FROM article_versions WHERE article_id = ?", $article_id);
    $count = $rowCount ? (int)$rowCount['total'] : 0;
    if ($count >= 4) {
        pdo_execute("
            UPDATE articles
            SET status = 'rejected',
                approved_by = ?,
                updated_at = NOW()
            WHERE article_id = ?
        ", $editor_id, $article_id);
        
        pdo_execute("
            INSERT INTO comments (article_id, user_id, content, status, created_at)
            VALUES (?, ?, ?, 'approved', NOW())
        ", $article_id, $editor_id, '[TỰ ĐỘNG TỪ CHỐI] Bài viết vượt quá giới hạn chỉnh sửa (1.3).');
        return false;
    }

    // Nếu Editor có chỉnh sửa trực tiếp, ta cập nhật title và content của bài viết chính
    $titleToSave = !empty($edited_title) ? $edited_title : $article['title'];
    $contentToSave = !empty($edited_content) ? $edited_content : $article['content'];

    // Trả bài về revision, cập nhật title & content nếu Editor sửa
    pdo_execute("
        UPDATE articles
        SET status = 'revision',
            title = ?,
            content = ?,
            updated_at = NOW()
        WHERE article_id = ?
    ", $titleToSave, $contentToSave, $article_id);

    // 3. Tạo phiên bản chỉnh sửa mới (1.1, 1.3...)
    $versionService->createVersion($article_id, $titleToSave, $contentToSave, $editor_id);

    // Lưu ghi chú chỉnh sửa vào comments (dùng status = 'approved' để phân biệt editorial note)
    pdo_execute("
        INSERT INTO comments (article_id, user_id, content, status, created_at)
        VALUES (?, ?, ?, 'approved', NOW())
    ", $article_id, $editor_id, '[YÊU CẦU CHỈNH SỬA] ' . trim($revision_note));

    return true;
}

/**
 *
 * @param int $article_id
 * @param int $editor_id
 * @return bool
 */
function rejectArticle(int $article_id, int $editor_id): bool {
    $article = pdo_query_one(
        "SELECT status FROM articles WHERE article_id = ?",
        $article_id
    );

    if (!$article || $article['status'] !== 'pending') return false;

    pdo_execute("
        UPDATE articles
        SET status      = 'rejected',
            approved_by = ?
        WHERE article_id = ?
    ", $editor_id, $article_id);

    return true;
}


/**
 * @param int $article_id
 */
function getEditorialComments(int $article_id): array {
    return pdo_query("
        SELECT
            c.comment_id,
            c.content,
            c.status,
            c.created_at,
            u.user_id,
            u.full_name,
            u.username,
            u.avatar_url,
            r.name AS role_name
        FROM comments c
        JOIN users u ON u.user_id = c.user_id
        JOIN roles r ON r.role_id = u.role_id
        WHERE c.article_id = ?
          AND c.parent_id IS NULL
          AND c.status = 'approved'
        ORDER BY c.created_at ASC
    ", $article_id);
}

/**
 * Thêm bình luận biên tập mới
 *
 * @param int    $article_id
 * @param int    $user_id
 * @param string $content
 * @param int|null $parent_id  null nếu là comment gốc, có giá trị nếu là reply
 * @return int  comment_id vừa tạo
 */
function addEditorialComment(int $article_id, int $user_id, string $content, ?int $parent_id = null): int {
    return (int) pdo_execute_return_last_id("
        INSERT INTO comments (article_id, user_id, parent_id, content, status, created_at)
        VALUES (?, ?, ?, ?, 'approved', NOW())
    ", $article_id, $user_id, $parent_id, trim($content));
}

/**
 * Lấy danh sách bài viết đang chờ duyệt (status = 'pending')
 *
 * @return array
 */
function getPendingArticlesList(): array {
    return pdo_query("
        SELECT
            a.article_id,
            a.title,
            a.slug,
            a.updated_at,
            c.name AS category_name,
            u.full_name AS author_name,
            (
                SELECT COUNT(*) + 1
                FROM article_versions av
                WHERE av.article_id = a.article_id
            ) AS version_count
        FROM articles a
        LEFT JOIN article_categories ac
            ON ac.article_id = a.article_id
            AND ac.is_primary = 1
        LEFT JOIN categories c
            ON c.category_id = ac.category_id
        LEFT JOIN users u
            ON u.user_id = a.user_id
        WHERE a.status = 'pending'
        ORDER BY a.updated_at DESC
    ");
}

if (isset($_POST['action']) || isset($_GET['action'])) {
    header('Content-Type: application/json; charset=utf-8');

    $action     = $_POST['action'] ?? $_GET['action'] ?? '';
    $article_id = (int) ($_POST['article_id'] ?? $_GET['article_id'] ?? 0);

    // Session: lấy user_id của người đang đăng nhập
    // session_start() nên được gọi ở đầu controller — đặt ở đây để service tự xử lý nếu gọi trực tiếp
    if (session_status() === PHP_SESSION_NONE) session_start();
    $current_user_id = (int) ($_SESSION['user_id'] ?? 0);

    if (!$article_id || !$current_user_id) {
        echo json_encode(['success' => false, 'message' => 'Thiếu tham số hoặc chưa đăng nhập.']);
        exit;
    }

    switch ($action) {

        // GET: lấy chi tiết bài viết
        case 'get_article':
            $data = getArticleDetail($article_id);
            echo json_encode($data
                ? ['success' => true, 'data' => $data]
                : ['success' => false, 'message' => 'Không tìm thấy bài viết.']
            );
            break;

        // POST: duyệt và xuất bản
        case 'approve_publish':
            $ok = approveAndPublish($article_id, $current_user_id);
            echo json_encode([
                'success' => $ok,
                'message' => $ok ? 'Bài viết đã được xuất bản.' : 'Không thể duyệt bài viết này.',
            ]);
            break;

        // POST: yêu cầu chỉnh sửa
        case 'request_revision':
            $note = trim($_POST['revision_note'] ?? '');
            $edited_title = isset($_POST['edited_title']) ? trim($_POST['edited_title']) : null;
            $edited_content = isset($_POST['edited_content']) ? trim($_POST['edited_content']) : null;
            if (!$note) {
                echo json_encode(['success' => false, 'message' => 'Vui lòng nhập nội dung yêu cầu chỉnh sửa.']);
                break;
            }
            $ok = requestRevision($article_id, $current_user_id, $note, $edited_title, $edited_content);
            
            $latestArticle = pdo_query_one("SELECT status FROM articles WHERE article_id = ?", $article_id);
            $msg = 'Đã gửi yêu cầu chỉnh sửa.';
            if ($latestArticle && $latestArticle['status'] === 'rejected') {
                $msg = 'Bài viết vượt quá giới hạn chỉnh sửa (1.3) và đã bị tự động Từ chối!';
            }

            echo json_encode([
                'success' => $ok,
                'message' => $msg,
            ]);
            break;

        // POST: từ chối bài viết
        case 'reject_article':
            $ok = rejectArticle($article_id, $current_user_id);
            echo json_encode([
                'success' => $ok,
                'message' => $ok ? 'Bài viết đã bị từ chối.' : 'Không thể từ chối bài viết này.',
            ]);
            break;

        // GET: lấy danh sách editorial comments
        case 'get_comments':
            $comments = getEditorialComments($article_id);
            echo json_encode(['success' => true, 'data' => $comments]);
            break;

        // POST: thêm editorial comment
        case 'add_comment':
            $content   = trim($_POST['content'] ?? '');
            $parent_id = !empty($_POST['parent_id']) ? (int) $_POST['parent_id'] : null;
            if (!$content) {
                echo json_encode(['success' => false, 'message' => 'Nội dung bình luận không được trống.']);
                break;
            }
            $new_id = addEditorialComment($article_id, $current_user_id, $content, $parent_id);
            echo json_encode(['success' => true, 'comment_id' => $new_id]);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Action không hợp lệ.']);
    }

    exit;
}
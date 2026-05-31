<?php

require_once __DIR__ . '/../Services/postnews_service.php';
require_once __DIR__ . '/../View/PostnewsView.php';

class PostnewsController
{
    private PostnewsService $service;

    public function __construct()
    {
        $this->service = new PostnewsService();
    }

    public function show(): void
    {
 $articleId = isset($_GET['id']) ? intval($_GET['id']) : 0;
        $userId = $_SESSION['user_id'] ?? 1;

        $article = null;

        if ($articleId > 0) {
            $article = $this->service->getArticleById($articleId, $userId);

            if ($article) {
                $status = $article['status'] ?? 'draft';
                if (in_array($status, ['pending', 'published'])) {
                    // Đá văng người dùng về trang profile kèm thông báo
                    echo "<script>
                            alert('🔒 BÀI VIẾT BỊ KHÓA: Bạn không thể chỉnh sửa bài viết đang chờ duyệt hoặc đã xuất bản.');
                            window.location.href = '?page=profile';
                          </script>";
                    exit; 
                }
            }
        }

        require_once __DIR__ . '/../Services/category_service.php';
        $categoryModel = new CategoryTagModel();
        $categories = $categoryModel->getAllCategories();

        $view = new PostnewsView();
        $view->render($article, $categories);
    }

  // Controller/PostnewsController.php

public function savePost(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        $userId = $_SESSION['user_id'] ?? 1;

        try {
            $data = $_POST;
            $articleId = isset($data['article_id']) ? intval($data['article_id']) : 0;

            // ==========================================
            // LỚP KHÓA 2: CHẶN API UPDATE NẾU BÀI BỊ KHÓA
            // ==========================================
            if ($articleId > 0) {
                $existingArticle = $this->service->getArticleById($articleId, $userId);
                if ($existingArticle) {
                    $status = $existingArticle['status'] ?? 'draft';
                    if (in_array($status, ['pending', 'published'])) {
                        echo json_encode([
                            'success' => false, 
                            'message' => 'Lỗi bảo mật: Bài viết đã khóa, không thể lưu thay đổi!'
                        ]);
                        return;
                    }
                }
            }

            if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === UPLOAD_ERR_OK) {
                $data['thumbnail_file'] = $_FILES['thumbnail']; 
            }

            $savedArticleId = $this->service->saveArticle($userId, $data);

            $articleStatus = pdo_query_one("SELECT status FROM articles WHERE article_id = ?", $savedArticleId)['status'] ?? 'draft';

            if ($articleStatus === 'rejected') {
                echo json_encode([
                    'success'    => true,
                    'article_id' => $savedArticleId,
                    'is_rejected'=> true,
                    'message'    => 'Bài viết đã vượt quá giới hạn chỉnh sửa (1.3) và hệ thống đã tự động Từ chối!'
                ]);
                return;
            }

            echo json_encode([
                'success'   => true,
                'article_id'=> $savedArticleId
            ]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
    public function handleAction(): void
{
    header('Content-Type: application/json');
    $action    = $_POST['action_type'] ?? '';
    $articleId = intval($_POST['article_id'] ?? 0);
    $userId    = $_SESSION['user_id'] ?? 1;

    try {
        if ($action === 'delete') {
            // Xóa thật vì schema không có is_deleted
            pdo_execute(
                "DELETE FROM articles WHERE article_id = ? AND user_id = ?",
                $articleId, $userId
            );
            echo json_encode(['success' => true]);

        } elseif ($action === 'withdraw') {
            pdo_execute(
                "UPDATE articles SET status = 'draft' 
                 WHERE article_id = ? AND user_id = ? AND status = 'pending'",
                $articleId, $userId
            );
            echo json_encode(['success' => true]);

        }
        elseif ($action === 'request_takedown') {
    $article = pdo_query_one(
        "SELECT status FROM articles WHERE article_id = ?",
        $articleId
    );

    if (!$article || $article['status'] !== 'published') {
        echo json_encode(['success' => false, 'message' => 'Bài viết không ở trạng thái có thể gỡ.']);
        return;
    }

    // Kiểm tra đã gửi chưa
    $existing = pdo_query_one(
        "SELECT 1 FROM takedown_requests WHERE article_id = ? AND user_id = ?",
        $articleId, $userId
    );

    if ($existing) {
        echo json_encode(['success' => false, 'message' => 'Bạn đã gửi yêu cầu gỡ bài này rồi, vui lòng chờ xử lý.']);
        return;
    }

    $reason = trim($_POST['reason'] ?? '');
    pdo_execute(
        "INSERT INTO takedown_requests (article_id, user_id, reason) VALUES (?, ?, ?)",
        $articleId, $userId, $reason
    );
    echo json_encode(['success' => true]);
}
         else {
            echo json_encode(['success' => false, 'message' => 'Action không hợp lệ.']);
        }

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
}

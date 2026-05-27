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

        $view = new PostnewsView();
        $view->render($article);
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
    $action = $_POST['action_type'] ?? '';
    $articleId = intval($_POST['article_id'] ?? 0);
    $userId = $_SESSION['user_id'] ?? 1;

    try {
        if ($action === 'delete') {
            // Xóa mềm: is_deleted = 1
            pdo_execute("UPDATE articles SET is_deleted = 1 WHERE article_id = ? AND user_id = ?", $articleId, $userId);
        } 
        elseif ($action === 'withdraw') {
            // Rút bài: pending -> draft
            pdo_execute("UPDATE articles SET status = 'draft' WHERE article_id = ? AND user_id = ? AND status = 'pending'", $articleId, $userId);
        } 
        elseif ($action === 'request_takedown') {
            // Lưu yêu cầu gỡ bài vào bảng takedown_requests
            $reason = $_POST['reason'] ?? '';
            pdo_execute("INSERT INTO takedown_requests (article_id, user_id, reason, status) VALUES (?, ?, ?, 'pending')", 
                        $articleId, $userId, $reason);
        }

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
}

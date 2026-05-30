<?php

require_once __DIR__ . '/../Services/Comment_service.php';

class CommentController {

    private CommentService $service;

    public function __construct() {
        $this->service = new CommentService();
    }

    public function listComments(): void {
        header('Content-Type: application/json; charset=utf-8');

        $slug = trim((string) ($_GET['slug'] ?? ''));
        $articleId = (int) ($_GET['article_id'] ?? 0);

        if ($slug !== '') {
            $articleId = $this->service->getArticleIdBySlug($slug) ?? 0;
        }

        if ($articleId <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Thiếu slug hoặc article_id.'
            ]);
            return;
        }

        $comments = $this->service->getCommentsByArticleId($articleId);

        echo json_encode([
            'success' => true,
            'data' => $comments
        ]);
    }

    public function add(): void {
        header('Content-Type: application/json; charset=utf-8');

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Phương thức không hợp lệ.'
            ]);
            return;
        }

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $userId = (int) ($_SESSION['user_id'] ?? 0);

        if ($userId <= 0) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để bình luận.'
            ]);
            return;
        }

        $articleId = (int) ($_POST['article_id'] ?? 0);
        $slug = trim((string) ($_POST['slug'] ?? ''));

        if ($articleId <= 0 && $slug !== '') {
            $articleId = $this->service->getArticleIdBySlug($slug) ?? 0;
        }

        if ($articleId <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Thiếu slug hoặc article_id.'
            ]);
            return;
        }

        $content = trim((string) ($_POST['content'] ?? ''));
        $parentId = isset($_POST['parent_id']) && trim((string) ($_POST['parent_id'] ?? '')) !== ''
            ? (int) $_POST['parent_id']
            : null;

        if ($content === '') {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Nội dung bình luận không được trống.'
            ]);
            return;
        }

        try {
            $commentId = $this->service->addComment($articleId, $userId, $content, $parentId);
            echo json_encode([
                'success' => true,
                'comment_id' => $commentId
            ]);
        } catch (InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Không thể thêm bình luận. Vui lòng thử lại.'
            ]);
        }
    }
}

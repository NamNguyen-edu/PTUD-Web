<?php
require_once __DIR__ . '/../Services/vote_service.php';
require_once __DIR__ . '/../Model/pdo.php';

class VoteController
{
    private VoteService $voteService;

    public function __construct()
    {
        $this->voteService = new VoteService();
    }

    /**
     * Thực hiện vote bài viết qua API POST
     */
    public function vote(): void
    {
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

        $userId = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;

        if ($userId <= 0) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để thực hiện đánh giá tin cậy bài viết.'
            ]);
            return;
        }

        $articleId = isset($_POST['article_id']) ? intval($_POST['article_id']) : 0;
        $slug = isset($_POST['slug']) ? trim($_POST['slug']) : '';
        $type = isset($_POST['type']) ? trim($_POST['type']) : 'up';

        if ($articleId <= 0 && $slug !== '') {
            $dbRes = pdo_query_one("SELECT article_id FROM articles WHERE slug = ? LIMIT 1", $slug);
            if ($dbRes) {
                $articleId = intval($dbRes['article_id']);
            }
        }

        if ($articleId <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Bài viết không tồn tại hoặc thiếu ID.'
            ]);
            return;
        }

        if ($type !== 'up' && $type !== 'down') {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Loại vote không hợp lệ.'
            ]);
            return;
        }

        try {
            $result = $this->voteService->toggleVote($userId, $articleId, $type);
            echo json_encode(array_merge([
                'success' => true,
                'message' => 'Đánh giá thành công.'
            ], $result));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Lỗi máy chủ khi bình chọn: ' . $e->getMessage()
            ]);
        }
    }
}

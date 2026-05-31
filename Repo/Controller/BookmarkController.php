<?php
require_once __DIR__ . '/../Services/BookmarkService.php';

class BookmarkController
{
    public function toggle(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        if (empty($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Chưa đăng nhập']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $articleId = intval($data['article_id'] ?? 0);

        if ($articleId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Thiếu article_id']);
            return;
        }

        $userId = intval($_SESSION['user_id']);
        $service = new BookmarkService();
        $isBookmarked = $service->toggle($userId, $articleId);

        echo json_encode([
            'success'      => true,
            'is_bookmarked' => $isBookmarked
        ]);
    }

    public function list(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        if (empty($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Chưa đăng nhập']);
            return;
        }

        $userId = intval($_SESSION['user_id']);
        $service = new BookmarkService();
        $bookmarks = $service->getUserBookmarks($userId);

        echo json_encode(['success' => true, 'data' => $bookmarks]);
    }
}

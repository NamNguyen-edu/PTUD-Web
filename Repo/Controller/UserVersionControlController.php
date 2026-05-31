<?php
// =============================================
// FILE: Controller/UserVersionControlController.php
// =============================================

require_once __DIR__ . '/../Services/Version_control_service.php';
require_once __DIR__ . '/../View/UserVersionControlView.php';

class UserVersionControlController
{
    private VersionControlService $service;

    public function __construct()
    {
        $this->service = new VersionControlService();
    }

    public function show(): void
    {
        $articleId = (int)($_GET['article_id'] ?? 0);

        if ($articleId <= 0) {
            $this->handleError('Thiếu article_id');
        }

        // Lấy thông tin bài viết
        $article = $this->service->getArticle($articleId);

        if (!$article) {
            $this->handleError('Không tìm thấy bài viết');
        }

        // Kiểm tra quyền sở hữu: Chỉ cho phép Tác giả của bài viết này xem
        $userId = (int)($_SESSION['user_id'] ?? 0);
        $role = $_SESSION['role'] ?? 'guest';

        $isAuthor = ((int)($article['user_id'] ?? 0) === $userId);

        if (!$isAuthor && $role !== 'admin') {
            http_response_code(403);
            $this->handleError('Bạn không có quyền truy cập lịch sử phiên bản của bài viết này.');
        }

        // Lấy toàn bộ danh sách phiên bản nháp
        $versions = $this->service->getVersions($articleId);

        if (empty($versions)) {
            // Nếu chưa có phiên bản nào, tự động tạo phiên bản gốc ban đầu (v1.0)
            $this->service->ensureOriginalVersion($articleId, $article['title'], $article['content'], $article['user_id']);
            // Tải lại danh sách
            $versions = $this->service->getVersions($articleId);
        }

        // Xác định phiên bản so sánh (mặc định là v0 và v1 mới nhất)
        $current = $versions[0] ?? [];
        $previous = $versions[1] ?? $current; // Nếu chỉ có 1 version, so với chính nó

        // Nếu có tham số version_id gửi qua AJAX để đổi phiên bản so sánh
        $selectedVersionId = (int)($_GET['version_id'] ?? 0);
        if ($selectedVersionId > 0) {
            $foundIndex = -1;
            foreach ($versions as $idx => $v) {
                if ((int)$v['version_id'] === $selectedVersionId) {
                    $foundIndex = $idx;
                    break;
                }
            }

            if ($foundIndex !== -1) {
                $current = $versions[$foundIndex];
                // Bản tiền nhiệm của nó sẽ là bản nháp cũ hơn tiếp theo (index + 1)
                $previous = $versions[$foundIndex + 1] ?? $current;
            }
        }

        // Tạo diff cho cặp phiên bản đã xác định
        $diff = $this->service->generateDiff([$current, $previous]);

        // Nếu là yêu cầu AJAX
        if (isset($_GET['ajax'])) {
            header('Content-Type: application/json; charset=utf-8');

            // Tính toán nhanh Word count, Reading time và SEO score cho version đang xem
            $currentContent = strip_tags($current['content'] ?? '');
            $previousContent = strip_tags($previous['content'] ?? '');

            $currentWordCount = count(preg_split('/\s+/', trim($currentContent), -1, PREG_SPLIT_NO_EMPTY));
            $previousWordCount = count(preg_split('/\s+/', trim($previousContent), -1, PREG_SPLIT_NO_EMPTY));

            $currentReadingSeconds = max(30, (int)ceil($currentWordCount / 200 * 60));
            $previousReadingSeconds = max(30, (int)ceil($previousWordCount / 200 * 60));

            $readTimeMinutes = (int)ceil($currentReadingSeconds / 60);
            $readTimeDeltaSeconds = $currentReadingSeconds - $previousReadingSeconds;
            $readTimeDeltaLabel = $readTimeDeltaSeconds === 0 ? '0s' : ($readTimeDeltaSeconds > 0 ? '+' . $readTimeDeltaSeconds . 's' : $readTimeDeltaSeconds . 's');

            $wordDelta = $currentWordCount - $previousWordCount;
            $wordDeltaLabel = $wordDelta >= 0 ? '+' . number_format($wordDelta) . ' từ' : number_format($wordDelta) . ' từ';

            $uniqueWords = count(array_unique(array_filter(array_map('trim', preg_split('/\s+/', strtolower($currentContent), -1, PREG_SPLIT_NO_EMPTY)))));
            $seoScore = min(100, max(30, 40 + (int)round($uniqueWords / 2)));

            $currentAvatar = !empty($current['avatar_url'])
                ? $current['avatar_url']
                : 'https://ui-avatars.com/api/?background=0c56d0&color=fff&name=' . urlencode($current['full_name'] ?? 'U');

            $previousAvatar = !empty($previous['avatar_url'])
                ? $previous['avatar_url']
                : 'https://ui-avatars.com/api/?background=0c56d0&color=fff&name=' . urlencode($previous['full_name'] ?? 'U');

            echo json_encode([
                'success' => true,
                'article' => [
                    'article_id' => $article['article_id'],
                    'title' => $article['title']
                ],
                'current' => [
                    'version_id' => $current['version_id'],
                    'version_label' => $current['version_label'],
                    'full_name' => $current['full_name'],
                    'avatar_url' => $currentAvatar,
                    'created_at' => $current['created_at'],
                    'word_count' => number_format($currentWordCount),
                    'read_time' => $readTimeMinutes . ' phút',
                    'word_delta' => $wordDeltaLabel,
                    'read_time_delta' => $readTimeDeltaLabel,
                    'seo_score' => $seoScore,
                    'diff_html' => $diff['new']
                ],
                'previous' => [
                    'version_id' => $previous['version_id'],
                    'version_label' => $previous['version_label'],
                    'full_name' => $previous['full_name'],
                    'avatar_url' => $previousAvatar,
                    'created_at' => $previous['created_at'],
                    'diff_html' => $diff['old']
                ]
            ]);
            exit;
        }

        // Render giao diện thông thường
        $view = new UserVersionControlView();
        $view->render($article, $versions, $diff);
    }

    public function restoreVersion(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        $userId = (int)($_SESSION['user_id'] ?? 0);
        $data = $_POST;
        if (empty($data) && strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
            $payload = json_decode(file_get_contents('php://input'), true);
            if (is_array($payload)) {
                $data = $payload;
            }
        }

        $versionId = (int)($data['version_id'] ?? 0);

        if ($versionId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Version không hợp lệ']);
            return;
        }

        // Kiểm tra quyền sở hữu trước khi khôi phục
        $version = pdo_query_one("SELECT article_id FROM article_versions WHERE version_id = ?", $versionId);
        if (!$version) {
            echo json_encode(['success' => false, 'message' => 'Không tìm thấy phiên bản']);
            return;
        }

        $article = $this->service->getArticle((int)$version['article_id']);
        if (!$article || ((int)$article['user_id'] !== $userId && $_SESSION['role'] !== 'admin')) {
            echo json_encode(['success' => false, 'message' => 'Bạn không có quyền khôi phục phiên bản của bài viết này']);
            return;
        }

        $success = $this->service->restoreVersion($versionId);

        echo json_encode(['success' => $success]);
    }

    private function handleError(string $message): void
    {
        if (isset($_GET['ajax'])) {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'message' => $message]);
            exit;
        }
        die('<h1>403 Forbidden: ' . htmlspecialchars($message) . '</h1>');
    }
}

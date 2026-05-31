<?php
// =============================================
// FILE: View/UserVersionControlView.php
// =============================================

require_once __DIR__ . '/../View/ViewEngine.php';

class UserVersionControlView
{
    private ViewEngine $engine;

    public function __construct()
    {
        $this->engine = new ViewEngine();
    }

    public function render(
        array $article,
        array $versions,
        array $diff
    ): void {
        $current  = $versions[0] ?? [];
        $previous = $versions[1] ?? $current; // Nếu chỉ có 1 version, so với chính nó

        $currentContent  = strip_tags($current['content'] ?? '');
        $previousContent = strip_tags($previous['content'] ?? '');

        // Cách đếm từ chuẩn xác cho cả tiếng Việt
        $currentWordCount  = count(preg_split('/\s+/', trim($currentContent), -1, PREG_SPLIT_NO_EMPTY));
        $previousWordCount = count(preg_split('/\s+/', trim($previousContent), -1, PREG_SPLIT_NO_EMPTY));

        $currentReadingSeconds  = max(30, (int) ceil($currentWordCount / 200 * 60));
        $previousReadingSeconds = max(30, (int) ceil($previousWordCount / 200 * 60));

        $readTimeMinutes = (int) ceil($currentReadingSeconds / 60);
        $readTimeDeltaSeconds = $currentReadingSeconds - $previousReadingSeconds;

        $readTimeDeltaLabel = $readTimeDeltaSeconds === 0
            ? '0s'
            : ($readTimeDeltaSeconds > 0
                ? '+' . $readTimeDeltaSeconds . 's'
                : $readTimeDeltaSeconds . 's');

        $wordDelta = $currentWordCount - $previousWordCount;
        $wordDeltaLabel = $wordDelta >= 0
            ? '+' . number_format($wordDelta) . ' từ'
            : number_format($wordDelta) . ' từ';

        $uniqueWords = count(array_unique(array_filter(array_map(
            'trim',
            preg_split('/\s+/', strtolower($currentContent), -1, PREG_SPLIT_NO_EMPTY)
        ))));

        $seoScore = min(100, max(30, 40 + (int) round($uniqueWords / 2)));

        // Chuẩn bị avatar động cho giao diện người dùng
        $currentAvatar = !empty($current['avatar_url'])
            ? '<img src="' . htmlspecialchars($current['avatar_url']) . '" class="rounded-circle shadow-sm" width="36" height="36" style="object-fit: cover;">'
            : '<img src="https://ui-avatars.com/api/?background=0c56d0&color=fff&name=' . urlencode($current['full_name'] ?? 'U') . '" class="rounded-circle shadow-sm" width="36" height="36">';

        $previousAvatar = !empty($previous['avatar_url'])
            ? '<img src="' . htmlspecialchars($previous['avatar_url']) . '" class="rounded-circle shadow-sm" width="36" height="36" style="object-fit: cover;">'
            : '<img src="https://ui-avatars.com/api/?background=0c56d0&color=fff&name=' . urlencode($previous['full_name'] ?? 'U') . '" class="rounded-circle shadow-sm" width="36" height="36">';

        // Lấy nhận xét biên tập gần nhất nếu bài viết đang ở trạng thái cần sửa (revision)
        $editorFeedbackHtml = '';
        if (isset($article['status']) && $article['status'] === 'revision') {
            $revNote = pdo_query_one(
                "SELECT content, created_at FROM comments WHERE article_id = ? AND content LIKE '[YÊU CẦU CHỈNH SỬA]%' ORDER BY comment_id DESC LIMIT 1",
                $article['article_id']
            );
            if ($revNote) {
                $noteText = htmlspecialchars(str_replace('[YÊU CẦU CHỈNH SỬA] ', '', $revNote['content']));
                $editorFeedbackHtml = '
                <div class="feedback-card mb-4 p-4 rounded-lg shadow-sm border border-warning" style="background: rgba(255, 193, 7, 0.05); border-left: 5px solid #ffc107 !important;">
                    <div class="d-flex align-items-center mb-3">
                        <span class="material-symbols-outlined text-warning mr-2" style="font-size: 2rem;">rate_review</span>
                        <div>
                            <h5 class="mb-0 font-weight-bold text-warning" style="font-size: 1.1rem;">Nhận xét từ Biên tập viên</h5>
                            <small class="text-muted">Cập nhật vào: ' . htmlspecialchars($revNote['created_at']) . '</small>
                        </div>
                    </div>
                    <div class="bg-white p-3 rounded border border-warning-subtle text-dark" style="font-size: 0.95rem; line-height: 1.6; border: 1px solid #ffeeba !important; font-weight: 500;">
                        <i class="fas fa-comment-dots text-muted mr-1"></i> ' . $noteText . '
                    </div>
                </div>';
            }
        }

        $data = [
            'ARTICLE_ID'       => $article['article_id'],
            'ARTICLE_TITLE'    => htmlspecialchars($article['title'] ?? ''),
            'ARTICLE_CATEGORY' => htmlspecialchars($article['category_name'] ?? 'Chung'),

            'CURRENT_VERSION' => htmlspecialchars($current['version_label'] ?? 'v1.0'),
            'PREVIOUS_VERSION' => htmlspecialchars($previous['version_label'] ?? 'v0.9'),

            'CURRENT_AUTHOR' => htmlspecialchars($current['full_name'] ?? ''),
            'PREVIOUS_AUTHOR' => htmlspecialchars($previous['full_name'] ?? ''),

            'CURRENT_DATE' => htmlspecialchars($current['created_at'] ?? ''),
            'PREVIOUS_DATE' => htmlspecialchars($previous['created_at'] ?? ''),

            'CURRENT_DIFF_HTML' => $diff['new'],
            'PREVIOUS_DIFF_HTML' => $diff['old'],

            'CURRENT_AVATAR_HTML' => $currentAvatar,
            'PREVIOUS_AVATAR_HTML' => $previousAvatar,

            'VERSION_HISTORY_HTML' => $this->buildVersionList($versions),

            'WORD_COUNT'    => number_format($currentWordCount),
            'READ_TIME'     => $readTimeMinutes . ' phút',
            'WORD_DELTA'    => $wordDeltaLabel,
            'READ_TIME_DELTA' => $readTimeDeltaLabel,
            'SEO_SCORE'     => $seoScore,
            'EDITOR_FEEDBACK_HTML' => $editorFeedbackHtml
        ];

        // Kết xuất giao diện chuyên biệt cho Contributor
        echo $this->engine->render('VersionControl_View', $data);
    }

    private function buildVersionList(array $versions): string
    {
        $html = '';

        foreach ($versions as $index => $v) {
            $active = $index === 0 ? 'active-item' : '';
            $pillClass = $index === 0 ? 'active-pill' : 'inactive-pill';

            $html .= '
            <div
                class="version-history-item mb-3 ' . $active . '"
                data-version-id="' . $v['version_id'] . '"
                data-version-label="' . htmlspecialchars($v['version_label']) . '"
            >
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="version-pill ' . $pillClass . '">
                        ' . htmlspecialchars($v['version_label']) . '
                    </span>
                    <span class="version-item-meta">
                        ' . htmlspecialchars($v['created_at']) . '
                    </span>
                </div>
                <div class="version-item-author">
                    ' . htmlspecialchars($v['full_name'] ?? '') . '
                </div>
                <div class="version-item-desc">
                    ' . htmlspecialchars($v['summary'] ?? 'Bản lưu nháp tự động') . '
                </div>
            </div>';
        }

        return $html;
    }
}

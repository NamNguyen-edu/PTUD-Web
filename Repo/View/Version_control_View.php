<?php
// =============================================
// FILE: View/Version_control_View.php
// =============================================

require_once __DIR__ . '/../View/ViewEngine.php';

class VersionControlView
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
        $basePath = dirname(__DIR__);
        $role = $_SESSION['role'] ?? 'guest';

        $current  = $versions[0] ?? [];
        $previous = $versions[1] ?? [];

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
            ? '<img src="' . htmlspecialchars($current['avatar_url']) . '" class="rounded-circle" width="32" height="32">'
            : '<img src="https://ui-avatars.com/api/?background=0c56d0&color=fff&name=' . urlencode($current['full_name'] ?? 'U') . '" class="rounded-circle" width="32" height="32">';

        $previousAvatar = !empty($previous['avatar_url'])
            ? '<img src="' . htmlspecialchars($previous['avatar_url']) . '" class="rounded-circle" width="32" height="32">'
            : '<img src="https://ui-avatars.com/api/?background=0c56d0&color=fff&name=' . urlencode($previous['full_name'] ?? 'U') . '" class="rounded-circle" width="32" height="32">';

        $data = [
            'ARTICLE_ID'       => $article['article_id'],
            'ARTICLE_TITLE'    => htmlspecialchars($article['title'] ?? ''),
            'ARTICLE_CATEGORY' => htmlspecialchars(
                $article['category_name'] ?? 'Chung'
            ),

            'CURRENT_VERSION' => htmlspecialchars(
                $current['version_label'] ?? 'v1.0'
            ),

            'PREVIOUS_VERSION' => htmlspecialchars(
                $previous['version_label'] ?? 'v0.9'
            ),

            'CURRENT_AUTHOR' => htmlspecialchars(
                $current['full_name'] ?? ''
            ),

            'PREVIOUS_AUTHOR' => htmlspecialchars(
                $previous['full_name'] ?? ''
            ),

            'CURRENT_DATE' => htmlspecialchars(
                $current['created_at'] ?? ''
            ),

            'PREVIOUS_DATE' => htmlspecialchars(
                $previous['created_at'] ?? ''
            ),

            'CURRENT_DIFF_HTML' => $diff['new'],
            'PREVIOUS_DIFF_HTML' => $diff['old'],

            'CURRENT_AVATAR_HTML' => $currentAvatar,
            'PREVIOUS_AVATAR_HTML' => $previousAvatar,

            'VERSION_HISTORY_HTML' =>
                $this->buildVersionList($versions),

            'WORD_COUNT'    => number_format($currentWordCount),
            'READ_TIME'     => $readTimeMinutes . ' phút',
            'WORD_DELTA'    => $wordDeltaLabel,
            'READ_TIME_DELTA' => $readTimeDeltaLabel,
            'SEO_SCORE'     => $seoScore,
        ];

        // Lọc giao diện theo vai trò (Người đăng bài dùng VersionControl_View, Editor/Admin dùng version-control)
        if ($role === 'contributor') {
            echo $this->engine->render('VersionControl_View', $data);
        } else {
            $sidebarHtml = @file_get_contents($basePath . '/UI/html/sidebar_admin.html') ?: '';
            $headerHtml  = @file_get_contents($basePath . '/UI/html/header_admin.html') ?: '';

            $data['SIDEBAR_COMPONENT'] = $sidebarHtml;
            $data['HEADER_COMPONENT']  = $headerHtml;

            echo $this->engine->render('version-control', $data);
        }
    }

    private function buildVersionList(array $versions): string
    {
        $html = '';

        foreach ($versions as $index => $v) {

            $active = $index === 0
                ? 'active-item'
                : '';

            $html .= '
            <div
                class="version-history-item ' . $active . '"
                data-version-id="' . $v['version_id'] . '"
                data-version-label="' . htmlspecialchars($v['version_label']) . '"
            >

                <div class="d-flex justify-content-between mb-2">

                    <span class="version-pill">
                        ' . htmlspecialchars($v['version_label']) . '
                    </span>

                    <span class="small text-muted">
                        ' . htmlspecialchars($v['created_at']) . '
                    </span>

                </div>

                <div class="fw-bold">
                    ' . htmlspecialchars($v['full_name'] ?? '') . '
                </div>

                <div class="small text-muted">
                    ' . htmlspecialchars($v['summary'] ?? '') . '
                </div>

            </div>';
        }

        return $html;
    }
}
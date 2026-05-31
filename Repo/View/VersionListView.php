<?php
// =============================================
// FILE: View/VersionListView.php
// =============================================

require_once __DIR__ . '/../View/ViewEngine.php';

class VersionListView
{
    private ViewEngine $engine;

    public function __construct()
    {
        $this->engine = new ViewEngine();
    }

    public function render(array $articles): void
    {
        $tableHtml = $this->buildTable($articles);

        $data = [
            'PENDING_COUNT'     => count($articles),
            'ARTICLES_TABLE'    => $tableHtml,
        ];

        echo $this->engine->render('version-list', $data);
    }

    private function buildTable(array $articles): string
    {
        if (empty($articles)) {
            return '
            <tr>
                <td colspan="5" class="empty-row text-center py-5 text-muted">
                    Không có bài viết nào đang có yêu cầu chỉnh sửa
                </td>
            </tr>';
        }

        $html = '';

        foreach ($articles as $a) {
            $html .= '
            <tr
                class="article-row"
                data-article-id="' . (int)$a['article_id'] . '"
                onclick="goToVersionControl(' . (int)$a['article_id'] . ')"
                style="cursor: pointer;"
                title="Xem lịch sử phiên bản"
            >
                <td class="col-title">
                    <span class="article-title">'
                        . htmlspecialchars($a['title'] ?? '')
                    . '</span>
                </td>

                <td class="col-category">
                    <span class="badge-category">'
                        . htmlspecialchars($a['category_name'] ?? 'Chung')
                    . '</span>
                </td>

                <td class="col-author">'
                    . htmlspecialchars($a['author_name'] ?? '—')
                . '</td>

                <td class="col-updated">'
                    . htmlspecialchars($a['updated_at'] ?? '—')
                . '</td>

                <td class="col-versions">
                    <span class="version-count">'
                        . (int)($a['version_count'] ?? 0)
                    . ' phiên bản</span>
                    <i class="arrow-icon">›</i>
                </td>
            </tr>';
        }

        return $html;
    }
}
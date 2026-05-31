<?php
require_once __DIR__ . '/ViewEngine.php';

class PostnewsView
{
    private ViewEngine $engine;

    public function __construct(ViewEngine $engine = null)
    {
        $this->engine = $engine ?? new ViewEngine();
    }

    public function render(?array $article, array $categories = []): void
    {
        $categoryOptions = '';
        foreach ($categories as $cat) {
            $selected = '';
            if ($article && isset($article['category_slug']) && $article['category_slug'] === $cat['slug']) {
                $selected = 'selected';
            }
            $categoryOptions .= '<option value="' . htmlspecialchars($cat['slug']) . '" ' . $selected . '>' . htmlspecialchars($cat['name']) . '</option>';
        }

        $revisionAlertHtml = '';
        if ($article && isset($article['status']) && $article['status'] === 'revision') {
            $revNote = pdo_query_one(
                "SELECT content FROM comments WHERE article_id = ? AND content LIKE '[YÊU CẦU CHỈNH SỬA]%' ORDER BY comment_id DESC LIMIT 1",
                $article['article_id']
            );
            if ($revNote) {
                $noteText = htmlspecialchars(str_replace('[YÊU CẦU CHỈNH SỬA] ', '', $revNote['content']));
                $revisionAlertHtml = '
                <div class="alert alert-warning border-warning shadow-sm rounded-lg p-4 mb-4" style="border-left: 5px solid #ffc107 !important; background: #fffdf5;">
                    <div class="d-flex align-items-center mb-2">
                        <i class="fas fa-edit fa-2x text-warning mr-3"></i>
                        <div>
                            <h5 class="alert-heading font-weight-bold mb-0 text-warning" style="font-size: 1.15rem;">Yêu cầu chỉnh sửa bài viết</h5>
                            <small class="text-muted">Vui lòng đọc kỹ nhận xét biên tập dưới đây trước khi sửa đổi nội dung</small>
                        </div>
                    </div>
                    <hr class="my-2" style="border-top-color: rgba(255, 193, 7, 0.2);">
                    <div class="p-3 bg-white rounded border border-warning-subtle text-dark mb-3" style="font-weight: 500; font-size: 0.95rem; line-height: 1.6; border: 1px solid #ffeeba !important;">
                        <i class="fas fa-comment-dots text-muted mr-1"></i> ' . $noteText . '
                    </div>
                    <div class="text-right">
                        <a href="?page=user-version-control&article_id=' . $article['article_id'] . '" class="btn btn-warning btn-sm font-weight-bold text-white shadow-sm" style="background: #e0a800; border: none; border-radius: 20px; padding: 8px 20px; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
                            <i class="fas fa-history"></i> So Sánh Các Phiên Bản & Lịch Sử Sửa
                        </a>
                    </div>
                </div>';
            }
        }

        $data = [
            'ARTICLE_ID'    => $article['article_id'] ?? '',
            'TITLE'         => $article['title'] ?? '',
            'CONTENT'       => $article['content'] ?? '',
            'SLUG'          => $article['slug'] ?? '',
            'EXCERPT'       => $article['excerpt'] ?? '',
            'CATEGORY_SLUG' => $article['category_slug'] ?? '',
            'TAGS'          => $article['tags_string'] ?? '',
            'CATEGORIES_OPTIONS' => $categoryOptions,
            'REVISION_ALERT_HTML' => $revisionAlertHtml
        ];

        echo $this->engine->render('postnews', $data);
    }
}
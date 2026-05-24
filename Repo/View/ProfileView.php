<?php

require_once __DIR__ . '/ViewEngine.php';

class ProfileView
{
    private ViewEngine $engine;

    public function __construct(ViewEngine $engine = null)
    {
        $this->engine = $engine ?? new ViewEngine();
    }

    public function render(?array $userInfo, ?array $userArticles): void
    {
        $fullName = (!empty($userInfo) && !empty($userInfo['full_name'])) ? $userInfo['full_name'] : 'Nguyễn Duy Bảo';
        $bio      = (!empty($userInfo) && !empty($userInfo['bio']))       ? $userInfo['bio']       : 'Nhà văn tự do, đam mê viết lách.';
        $email    = (!empty($userInfo) && !empty($userInfo['email']))     ? $userInfo['email']     : 'bebao2005at@gmail.com';

        // Build articles list HTML
        $articlesHtml = '';
        $totalViews = 0;
        $postsCount = !empty($userArticles) ? count($userArticles) : 0;

        if (empty($userArticles)) {
            $articlesHtml = '<tr><td colspan="4" class="text-center text-muted py-4">Bạn chưa có bài đăng nào.</td></tr>';
        } else {
            foreach ($userArticles as $article) {
                $views = isset($article['view_count']) ? intval($article['view_count']) : (isset($article['views']) ? intval($article['views']) : 0);
                $totalViews += $views;

                $statusText = 'Bản nháp';
                $statusClass = 'badge-warning';
                if (!empty($article['status']) && (in_array(strtolower($article['status']), ['published', 'đã đăng', 'public']))) {
                    $statusText = 'Đã đăng';
                    $statusClass = 'badge-success';
                }

                $dateFormatted = !empty($article['created_at']) ? date('d/m/Y', strtotime($article['created_at'])) : date('d/m/Y');
                $articleId = isset($article['article_id']) ? $article['article_id'] : 0;

                $articlesHtml .= '
                <tr>
                    <td style="max-width: 250px;">
                        <div class="font-weight-bold text-truncate">' . htmlspecialchars($article['title'] ?? 'Bài viết không tiêu đề') . '</div>
                        <small class="text-muted">Cập nhật: ' . $dateFormatted . '</small>
                    </td>
                    <td class="text-center align-middle">
                        <span class="badge badge-pill ' . $statusClass . ' px-3">' . $statusText . '</span>
                    </td>
                    <td class="text-center align-middle">
                        <div class="small"><i class="fas fa-eye mr-1"></i> ' . number_format($views) . '</div>
                    </td>
                    <td class="text-right align-middle">
                        <a href="?page=postnews&id=' . $articleId . '" class="btn btn-light btn-sm mr-1"><i class="fas fa-edit"></i></a>
                        <button class="btn btn-light btn-sm text-danger"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>';
            }
        }

        $data = [
            'FULL_NAME' => htmlspecialchars($fullName),
            'BIO' => htmlspecialchars($bio),
            'EMAIL' => htmlspecialchars($email),
            'MAJOR' => 'Chuyên ngành Hệ thống thông tin',
            'ORGANIZATION' => 'UEH',
            'POSTS_COUNT' => $postsCount,
            'VIEWS_COUNT' => $totalViews > 1000 ? number_format($totalViews/1000, 1) . 'K' : $totalViews,
            'LIST_ARTICLES' => $articlesHtml,
        ];

        // Note: ViewEngine expects keys without braces and will uppercase them when replacing
        $renderData = [];
        foreach ($data as $k => $v) {
            $renderData[$k] = $v;
        }

        echo $this->engine->render('profile', $renderData);
    }
}

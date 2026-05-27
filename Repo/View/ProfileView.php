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
        $avatarUrl = (!empty($userInfo) && !empty($userInfo['avatar_url'])) 
                     ? $userInfo['avatar_url'] 
                     : 'https://ui-avatars.com/api/?name=' . urlencode($fullName) . '&size=150';

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

                // Lấy trạng thái chuẩn từ Database
                $status = strtolower($article['status'] ?? 'draft');
                $isLocked = false;

                // Quy tắc nghiệp vụ: Phân loại nhãn và quyền chỉnh sửa
                switch ($status) {
                    case 'published':
                        $statusText = 'Đã đăng';
                        $statusClass = 'badge-success';
                        $isLocked = true; // KHÓA
                        break;
                    case 'pending':
                        $statusText = 'Chờ duyệt';
                        $statusClass = 'badge-warning';
                        $isLocked = true; // KHÓA
                        break;
                    case 'rejected':
                        $statusText = 'Bị từ chối';
                        $statusClass = 'badge-danger';
                        break;
                    case 'revision':
                        $statusText = 'Cần sửa lại';
                        $statusClass = 'badge-info';
                        break;
                    case 'draft':
                    default:
                        $statusText = 'Bản nháp';
                        $statusClass = 'badge-secondary';
                        break;
                }

                $dateFormatted = !empty($article['created_at']) ? date('d/m/Y', strtotime($article['created_at'])) : date('d/m/Y');
                $articleId = isset($article['article_id']) ? $article['article_id'] : 0;

                // Render Nút chức năng (Khóa hoặc Mở)
                if ($isLocked) {
                    $editBtnHtml = '<button class="btn btn-light btn-sm mr-1 text-muted" title="Bị khóa (Đang chờ duyệt hoặc Đã xuất bản)" disabled><i class="fas fa-lock"></i></button>';
                } else {
                    $editBtnHtml = '<a href="?page=postnews&id=' . $articleId . '" class="btn btn-light btn-sm mr-1 text-primary" title="Chỉnh sửa"><i class="fas fa-edit"></i></a>';
                }

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
                        ' . $editBtnHtml . '
                        <button class="btn btn-light btn-sm text-danger" title="Xóa bài"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>';
            }
        }

        $data = [
            'AVATAR_URL' => $avatarUrl,
            'FULL_NAME' => htmlspecialchars($fullName),
            'BIO' => htmlspecialchars($bio),
            'EMAIL' => htmlspecialchars($email),
            'MAJOR' => 'Chuyên ngành Hệ thống thông tin',
            'ORGANIZATION' => 'UEH',
            'POSTS_COUNT' => $postsCount,
            'VIEWS_COUNT' => $totalViews > 1000 ? number_format($totalViews/1000, 1) . 'K' : $totalViews,
            'LIST_ARTICLES' => $articlesHtml,
            'SKILLS_JSON' => (!empty($userInfo) && !empty($userInfo['skills'])) ? htmlspecialchars($userInfo['skills'], ENT_QUOTES, 'UTF-8') : '[]',        
        ];

        echo $this->engine->render('profile', $data);
    }
}

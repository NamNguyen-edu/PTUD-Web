<?php
/**
 * ApprovalView.php
 * Đặt tại: View/ApprovalView.php
 */

require_once __DIR__ . '/ViewEngine.php';

class ApprovalView
{
    private ViewEngine $engine;

    public function __construct(?ViewEngine $engine = null)
    {
        $this->engine = $engine ?? new ViewEngine();
    }

    public function render(?array $article, array $comments = [], int $currentUserId = 0, string $currentUserName = 'Editor'): void
    {
        if (!$article) {
            // Redirect về dashboard nếu không tìm thấy bài
            header('Location: ?page=admin_dashboard');
            exit;
        }

        $status    = $article['status'] ?? 'draft';
        $isPending = $status === 'pending';
        $timeInStage = $article['time_in_stage_minutes'] ?? null;
        $isUrgent  = $isPending && $timeInStage !== null && $timeInStage > 120;

        $data = [
            // JS config
            'ARTICLE_ID'            => (string)(int)$article['article_id'],
            'IS_PENDING'            => $isPending ? 'true' : 'false',
            'CURRENT_USER'          => htmlspecialchars($currentUserName, ENT_QUOTES),

            // Header
            'ARTICLE_TITLE'         => htmlspecialchars($article['title'] ?? ''),
            'TIME_IN_STAGE'         => $this->buildTimeInStage($isPending, $timeInStage),
            'TIME_BADGE_CLASS'      => $isUrgent
                                        ? 'text-danger bg-danger-subtle border-danger-subtle'
                                        : 'text-secondary bg-secondary-subtle border-secondary-subtle',

            // Pipeline step classes
            'STEP_PENDING_CLASS'    => ($status === 'pending')   ? 'step-active'   : ($status === 'published' ? 'step-complete' : 'opacity-50'),
            'STEP_PENDING_BOX_STYLE'=> ($status === 'pending')   ? ''              : ($status === 'published' ? '' : 'style="background:#eee;color:#999"'),
            'STEP_APPROVED_CLASS'   => ($status === 'published') ? 'step-complete' : 'opacity-50',
            'STEP_APPROVED_BOX_STYLE'=> ($status === 'published') ? '' : 'style="background:#eee;color:#999"',
            'STEP_PUBLISHED_CLASS'  => ($status === 'published') ? 'step-complete' : 'opacity-50',
            'STEP_PUBLISHED_BOX_STYLE'=> ($status === 'published') ? '' : 'style="background:#eee;color:#999"',

            // Article detail
            'WORD_COUNT'            => number_format($this->countWords($article['content'] ?? '')),
            'PRIMARY_CATEGORY'      => htmlspecialchars($article['primary_category'] ?? 'Chung'),
            'CATEGORY_BADGE_CLASS'  => 'bg-secondary-subtle text-secondary',
            'EXCERPT_BLOCK'         => $this->buildExcerpt($article['excerpt'] ?? ''),
            'THUMBNAIL_BLOCK'       => $this->buildThumbnail($article),
            'TAG_LIST'              => $this->buildTagList($article['tags'] ?? []),
            'ARTICLE_BODY'          => $article['content'] ?? '',

            // Comments
            'COMMENT_COUNT'         => (string)count($comments),
            'COMMENT_LIST'          => $this->buildCommentList($comments),

            // Right panel
            'AUTHOR_AVATAR'         => $this->buildAuthorAvatar($article),
            'AUTHOR_NAME'           => htmlspecialchars($article['author_name'] ?? ''),
            'AUTHOR_USERNAME'       => htmlspecialchars($article['author_username'] ?? ''),
            'ARTICLE_STATUS_NOTE'   => $this->buildStatusNote($status, $article),
            'INFO_ROWS'             => $this->buildInfoRows($article, $isPending, $timeInStage, $isUrgent),
            'ACTION_BLOCK'          => $isPending ? $this->buildActionBlock() : $this->buildNonPendingNotice($status),
        ];

        echo $this->engine->render('approvalView', $data);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    private function buildTimeInStage(bool $isPending, ?int $minutes): string
    {
        if (!$isPending || $minutes === null) return '—';
        if ($minutes < 60) return $minutes . ' phút';
        $h = floor($minutes / 60);
        $m = $minutes % 60;
        return $h . ' giờ ' . ($m > 0 ? $m . ' phút' : '');
    }

    private function buildExcerpt(string $excerpt): string
    {
        if (!$excerpt) return '';
        return '
        <div class="border-start border-primary border-4 ps-4 py-3 bg-light mb-4 rounded-end shadow-sm">
            <p class="fst-italic fw-bold text-dark mb-0 fs-5">"' . htmlspecialchars($excerpt) . '"</p>
        </div>';
    }

    private function buildThumbnail(array $article): string
    {
        if (empty($article['thumbnail_url'])) return '';
        return '
        <div class="mb-4">
            <img src="' . htmlspecialchars($article['thumbnail_url']) . '"
                 class="img-fluid rounded-4 shadow-sm w-100"
                 style="max-height:380px;object-fit:cover"
                 alt="' . htmlspecialchars($article['title'] ?? '') . '">
        </div>';
    }

    private function buildTagList(array $tags): string
    {
        if (empty($tags)) return '';
        $items = array_map(
            fn($t) => '<span class="badge bg-light text-secondary border me-1 mb-1">#' . htmlspecialchars($t['name']) . '</span>',
            $tags
        );
        return '<div class="mb-4">' . implode('', $items) . '</div>';
    }

    private function buildCommentList(array $comments): string
    {
        if (empty($comments)) {
            return '<p class="small text-muted no-comments-placeholder">Chưa có ý kiến nào.</p>';
        }

        $html = '';
        foreach ($comments as $c) {
            $isNote    = str_starts_with($c['content'] ?? '', '[YÊU CẦU CHỈNH SỬA]');
            $bubbleCls = $isNote ? 'comment-bubble active' : 'comment-bubble';
            $name      = htmlspecialchars($c['full_name'] ?? '');
            $role      = htmlspecialchars($c['role_name'] ?? '');
            $content   = htmlspecialchars($c['content'] ?? '');
            $time      = $this->timeAgo($c['created_at'] ?? '');
            $initial   = strtoupper(mb_substr($c['full_name'] ?? 'U', 0, 1));

            $avatarHtml = !empty($c['avatar_url'])
                ? '<img src="' . htmlspecialchars($c['avatar_url']) . '" class="comment-avatar" alt="Avatar">'
                : '<div class="comment-avatar-initials">' . $initial . '</div>';

            $html .= '
            <div class="comment-item">
                ' . $avatarHtml . '
                <div class="' . $bubbleCls . '">
                    <div class="d-flex justify-content-between small mb-1">
                        <span class="fw-bold">' . $name . ' <span class="fw-normal text-muted">(' . $role . ')</span></span>
                        <span class="text-muted" style="font-size:10px">' . $time . '</span>
                    </div>
                    <p class="small mb-0">' . $content . '</p>
                </div>
            </div>';
        }
        return $html;
    }

    private function buildAuthorAvatar(array $article): string
    {
        if (!empty($article['author_avatar'])) {
            return '<img src="' . htmlspecialchars($article['author_avatar']) . '" class="rounded-circle" width="52" height="52" alt="Avatar">';
        }
        $initial = strtoupper(mb_substr($article['author_name'] ?? 'U', 0, 1));
        return '
        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
             style="width:52px;height:52px;font-size:1.2rem;flex-shrink:0">' . $initial . '</div>';
    }

    private function buildStatusNote(string $status, array $article): string
    {
        return match ($status) {
            'pending'   => 'Bài viết đang chờ phê duyệt cuối cùng trước khi xuất bản.',
            'published' => 'Bài viết đã được xuất bản lúc ' . $this->fmtDate($article['published_at'] ?? null) . '.',
            'rejected'  => 'Bài viết đã bị từ chối.',
            'revision'  => 'Đã trả về tác giả để chỉnh sửa.',
            'draft'     => 'Bài viết đang ở trạng thái nháp.',
            'archived'  => 'Bài viết đã được lưu trữ.',
            default     => '',
        };
    }

    private function buildInfoRows(array $article, bool $isPending, ?int $timeInStage, bool $isUrgent): string
    {
        $rows = [
            ['<i class="fa fa-hashtag text-muted me-2"></i>ID',        '#' . (int)$article['article_id']],
            ['<i class="fa fa-calendar text-muted me-2"></i>Tạo lúc',  $this->fmtDate($article['created_at'] ?? null)],
            ['<i class="fa fa-pen text-muted me-2"></i>Cập nhật',      $this->fmtDate($article['updated_at'] ?? null)],
            ['<i class="fa fa-eye text-muted me-2"></i>Lượt xem',      number_format((int)($article['view_count'] ?? 0))],
        ];

        if (!empty($article['published_at'])) {
            $rows[] = ['<i class="fa fa-rocket text-muted me-2"></i>Xuất bản', $this->fmtDate($article['published_at'])];
        }
        if (!empty($article['approved_by_name'])) {
            $rows[] = ['<i class="fa fa-user-check text-muted me-2"></i>Duyệt bởi', htmlspecialchars($article['approved_by_name'])];
        }

        $html = '';
        foreach ($rows as [$label, $val]) {
            $html .= '
            <li class="d-flex justify-content-between py-2 border-bottom">
                <span class="text-muted">' . $label . '</span>
                <span class="fw-semibold">' . $val . '</span>
            </li>';
        }

        // Slug
        $html .= '
        <li class="py-2">
            <div class="text-muted mb-1"><i class="fa fa-link text-muted me-2"></i>Slug</div>
            <code class="small text-break">' . htmlspecialchars($article['slug'] ?? '') . '</code>
        </li>';

        return $html;
    }

    private function buildActionBlock(): string
    {
        return '
        <div class="white-card mb-4">
            <h5 class="fw-bold mb-4">Hành động biên tập</h5>
            <button class="btn-approve">
                <span class="material-symbols-outlined">check_circle</span>
                Duyệt bài viết
            </button>
            <button class="btn-revision mb-3">
                <span class="material-symbols-outlined">edit_note</span>
                Yêu cầu chỉnh sửa
            </button>
            <button class="btn btn-outline-primary w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 mb-3" onclick="showCompareModal()">
                <span class="material-symbols-outlined">compare_arrows</span>
                So sánh phiên bản
            </button>
            <div class="text-danger fw-bold small text-center cursor-pointer"
                 id="btn-reject">
                Từ chối bài viết
            </div>
        </div>';
    }

    private function buildNonPendingNotice(string $status): string
    {
        $map = [
            'published' => ['success', 'check_circle', 'Bài viết đã được xuất bản.'],
            'rejected'  => ['danger',  'cancel',       'Bài viết đã bị từ chối.'],
            'revision'  => ['warning', 'edit_note',    'Đã yêu cầu tác giả chỉnh sửa.'],
            'draft'     => ['secondary','draft',       'Bài viết đang ở trạng thái nháp.'],
        ];
        [$cls, $icon, $msg] = $map[$status] ?? ['secondary', 'info', 'Trạng thái: ' . $status];
        return '
        <div class="white-card mb-4">
            <div class="alert alert-' . $cls . ' d-flex align-items-center gap-2 mb-0 rounded-4" role="alert">
                <span class="material-symbols-outlined">' . $icon . '</span>
                <span class="small fw-semibold">' . $msg . '</span>
            </div>
        </div>';
    }

    // ─── Utils ─────────────────────────────────────────────────────────────

    private function countWords(string $html): int
    {
        return count(preg_split('/\s+/', trim(strip_tags($html)), -1, PREG_SPLIT_NO_EMPTY));
    }

    private function fmtDate(?string $d): string
    {
        if (!$d) return '—';
        return date('d/m/Y H:i', strtotime($d));
    }

    private function timeAgo(string $datetime): string
    {
        if (!$datetime) return '';
        $diff = time() - strtotime($datetime);
        if ($diff < 60)    return $diff . 'giây trước';
        if ($diff < 3600)  return floor($diff / 60) . ' phút trước';
        if ($diff < 86400) return floor($diff / 3600) . ' giờ trước';
        return floor($diff / 86400) . ' ngày trước';
    }
}
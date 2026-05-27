<?php
require_once __DIR__ . '/../View/ApprovalView.php';
require_once __DIR__ . '/../Services/Approval_service.php';

class ApprovalController
{
    public function show(): void
    {
        $article_id = (int)($_GET['article_id'] ?? 0);

        if ($article_id <= 0) {
            header('Location: ?page=admin_dashboard');
            exit;
        }

        $article  = getArticleDetail($article_id);
        $comments = $article
            ? getEditorialComments($article_id)
            : [];

        $currentUserId   = (int)($_SESSION['user_id'] ?? 0);
        $currentUserName = $_SESSION['user_name'] ?? 'Editor';

        (new ApprovalView())->render(
            $article,
            $comments,
            $currentUserId,
            $currentUserName
        );
    }
}
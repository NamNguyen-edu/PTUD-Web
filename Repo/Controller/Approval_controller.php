<?php

require_once __DIR__ . '/../View/ApprovalView.php';
require_once __DIR__ . '/../View/ApprovalListView.php';
require_once __DIR__ . '/../Services/Approval_service.php';

class ApprovalController
{
    // ─────────────────────────────
    // LOAD PAGE
    // ─────────────────────────────
    public function show(): void
    {
        $article_id =
            (int)($_GET['article_id'] ?? 0);

        if ($article_id <= 0) {
            $articles = getPendingArticlesList();
            (new ApprovalListView())->render($articles);
            exit;
        }

        $article =
            getArticleDetail($article_id);

        $comments = $article
            ? getEditorialComments($article_id)
            : [];

        $currentUserId =
            (int)($_SESSION['user_id'] ?? 0);

        $currentUserName =
            $_SESSION['user_name'] ?? 'Editor';

        (new ApprovalView())->render(
            $article,
            $comments,
            $currentUserId,
            $currentUserName
        );
    }

    // ─────────────────────────────
    // APPROVE & PUBLISH
    // ─────────────────────────────
    public function approvePublish(): void
    {
        header('Content-Type: application/json');

        $article_id =
            (int)($_POST['article_id'] ?? 0);

        $current_user_id =
            (int)($_SESSION['user_id'] ?? 0);

        $ok = approveAndPublish(
            $article_id,
            $current_user_id
        );

        echo json_encode([
            'success' => $ok,
            'message' => $ok
                ? 'Bài viết đã được xuất bản.'
                : 'Không thể duyệt bài viết.'
        ]);
    }

    // ─────────────────────────────
    // REQUEST REVISION
    // ─────────────────────────────
    public function requestRevision(): void
    {
        header('Content-Type: application/json');

        $article_id =
            (int)($_POST['article_id'] ?? 0);

        $note =
            trim($_POST['revision_note'] ?? '');

        $current_user_id =
            (int)($_SESSION['user_id'] ?? 0);

        if ($note === '') {

            echo json_encode([
                'success' => false,
                'message' => 'Thiếu nội dung chỉnh sửa.'
            ]);

            return;
        }

        $ok = requestRevision(
            $article_id,
            $current_user_id,
            $note
        );

        echo json_encode([
            'success' => $ok,
            'message' => $ok
                ? 'Đã gửi yêu cầu chỉnh sửa.'
                : 'Không thể gửi yêu cầu.'
        ]);
    }

    // ─────────────────────────────
    // REJECT ARTICLE
    // ─────────────────────────────
    public function reject(): void
    {
        header('Content-Type: application/json');

        $article_id =
            (int)($_POST['article_id'] ?? 0);

        $current_user_id =
            (int)($_SESSION['user_id'] ?? 0);

        $ok = rejectArticle(
            $article_id,
            $current_user_id
        );

        echo json_encode([
            'success' => $ok,
            'message' => $ok
                ? 'Đã từ chối bài viết.'
                : 'Không thể từ chối bài viết.'
        ]);
    }

    // ─────────────────────────────
    // GET COMMENTS
    // ─────────────────────────────
    public function getComments(): void
    {
        header('Content-Type: application/json');

        $article_id =
            (int)($_GET['article_id'] ?? 0);

        $comments =
            getEditorialComments($article_id);

        echo json_encode([
            'success' => true,
            'data' => $comments
        ]);
    }

    // ─────────────────────────────
    // ADD COMMENT
    // ─────────────────────────────
    public function addComment(): void
    {
        header('Content-Type: application/json');

        $article_id =
            (int)($_POST['article_id'] ?? 0);

        $content =
            trim($_POST['content'] ?? '');

        $parent_id =
            !empty($_POST['parent_id'])
                ? (int)$_POST['parent_id']
                : null;

        $current_user_id =
            (int)($_SESSION['user_id'] ?? 0);

        if ($content === '') {

            echo json_encode([
                'success' => false,
                'message' => 'Nội dung không được trống.'
            ]);

            return;
        }

        $comment_id =
            addEditorialComment(
                $article_id,
                $current_user_id,
                $content,
                $parent_id
            );

        echo json_encode([
            'success' => true,
            'comment_id' => $comment_id
        ]);
    }
}
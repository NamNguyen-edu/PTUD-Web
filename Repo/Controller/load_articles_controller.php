<?php

require_once __DIR__ . '/../Services/load_articles.php';
require_once __DIR__ . '/../Services/Comment_service.php';

class ArticleController {

    private ArticleService $articleService;
    private CommentService $commentService;

    public function __construct() {

        $this->articleService = new ArticleService();
        $this->commentService = new CommentService();
    }

    public function detail(): void {

        header('Content-Type: application/json; charset=utf-8');

        try {

            $slug = isset($_GET['slug'])
                ? trim($_GET['slug'])
                : '';

            if ($slug === '') {

                http_response_code(400);

                echo json_encode([
                    'success' => false,
                    'message' => 'Thiếu slug bài viết'
                ]);

                return;
            }

            $article = $this->articleService
                ->getArticleBySlug($slug);

            if (!$article) {

                http_response_code(404);

                echo json_encode([
                    'success' => false,
                    'message' => 'Không tìm thấy bài viết'
                ]);

                return;
            }

            $relatedArticles = $this->articleService
                ->getRelatedArticles(
                    $article['article_id']
                );

            $comments = $this->commentService
                ->getCommentsByArticleId(
                    $article['article_id']
                );

            $userVote = null;
            $userId = !empty($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;
            if ($userId > 0) {
                require_once __DIR__ . '/../Services/vote_service.php';
                $userVote = (new VoteService())->getUserVote($userId, intval($article['article_id']));
            }
            $article['user_vote'] = $userVote;

            $currentUser = [
                'logged' => !empty($_SESSION['user_id']),
                'id' => $_SESSION['user_id'] ?? null,
                'name' => $_SESSION['user_name'] ?? ($_SESSION['user_fullname'] ?? null),
            ];

            echo json_encode([
                'success' => true,
                'data' => [
                    'article' => $article,
                    'related_articles' => $relatedArticles,
                    'comments' => $comments,
                    'current_user' => $currentUser
                ]
            ]);

        } catch (Exception $e) {

            http_response_code(500);

            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
}

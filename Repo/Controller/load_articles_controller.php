<?php

require_once __DIR__ . '/../Services/load_articles.php';

class ArticleController {

    private ArticleService $articleService;

    public function __construct() {

        $this->articleService = new ArticleService();
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

            echo json_encode([
                'success' => true,
                'data' => [
                    'article' => $article,
                    'related_articles' => $relatedArticles
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

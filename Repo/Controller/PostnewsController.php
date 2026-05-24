<?php

require_once __DIR__ . '/../Services/postnews_service.php';
require_once __DIR__ . '/../View/PostnewsView.php';

class PostnewsController
{
    private PostnewsService $service;

    public function __construct()
    {
        $this->service = new PostnewsService();
    }

    public function show(): void
    {
        $articleId = isset($_GET['id']) ? intval($_GET['id']) : 0;

        $userId = $_SESSION['user_id'] ?? 1;

        $article = null;

        if ($articleId > 0) {
            $article = $this->service->getArticleById($articleId, $userId);
        }

        $view = new PostnewsView();
        $view->render($article);
    }

    public function savePost(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        $userId = $_SESSION['user_id'] ?? 1;

        try {

            $articleId = $this->service->saveArticle($userId, $_POST);

            echo json_encode([
                'success'   => true,
                'article_id'=> $articleId
            ]);

        } catch (Exception $e) {

            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
}
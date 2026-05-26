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
        $articleId = isset($_GET['id'])
            ? intval($_GET['id'])
            : 0;

        $userId = $_SESSION['user_id'] ?? 1;

        $article = null;

        if ($articleId > 0) {

            $article =
                $this->service
                ->getArticleById($articleId, $userId);
        }

        $view = new PostnewsView();

        $view->render($article);
    }

  // Controller/PostnewsController.php

public function savePost(): void
{
    header('Content-Type: application/json; charset=utf-8');

    $userId = $_SESSION['user_id'] ?? 1;

    try {
        // Gộp $_POST (text) và $_FILES (ảnh) lại thành 1 mảng data duy nhất
        $data = $_POST;
        
        // Kiểm tra xem frontend có gửi file ảnh lên không
        if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === UPLOAD_ERR_OK) {
            $data['thumbnail_file'] = $_FILES['thumbnail']; // Nhét file vào mảng data
        }

        // Truyền mảng gộp này xuống Service xử lý
        $articleId = $this->service->saveArticle($userId, $data);

        echo json_encode([
            'success'   => true,
            'article_id'=> $articleId
        ]);

    } catch (Exception $e) {
        //... rest of error handling
    }
}
}
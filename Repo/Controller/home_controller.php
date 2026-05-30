<?php

require_once __DIR__ . '/../Services/home_service.php';

class HomeController {

    private HomeService $homeService;

    public function __construct() {
        $this->homeService = new HomeService();
    }

    public function feed(): void {

        header('Content-Type: application/json; charset=utf-8');

        try {

            $page = isset($_GET['page_num'])
                ? (int) $_GET['page_num']
                : 1;

            $category = isset($_GET['category']) ? trim((string)$_GET['category']) : null;
            if (empty($category)) {
                $category = null;
            }

            $data = $this->homeService
                ->getHomepageFeed($page, $category);

            $response = json_encode([
                'success' => true,
                'data' => $data
            ]);

            
            

            echo $response;

        } catch (Exception $e) {

            http_response_code(500);

            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    public function megaMenu(): void {
        header('Content-Type: application/json; charset=utf-8');
        try {
            $categorySlug = isset($_GET['category']) ? trim((string)$_GET['category']) : 'cong-nghe';
            
            
            $sql = "
                SELECT a.article_id, a.title, a.slug, a.thumbnail_url, a.published_at
                FROM articles a
                INNER JOIN article_categories ac ON a.article_id = ac.article_id
                INNER JOIN categories c ON ac.category_id = c.category_id
                WHERE a.status = 'published' AND c.slug = ?
                ORDER BY a.published_at DESC
                LIMIT 3
            ";
            $articles = pdo_query($sql, $categorySlug);

            foreach ($articles as &$article) {
                if (empty($article['thumbnail_url'])) {
                    $article['thumbnail_url'] = 'https://picsum.photos/400/250';
                }
                $article['published_time_ago'] = $this->timeAgo($article['published_at']);
            }

            echo json_encode([
                'success' => true,
                'items' => $articles
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    private function timeAgo(string $datetime): string
    {
        $time = strtotime($datetime);
        $diff = time() - $time;
        if ($diff < 60) return 'Vừa xong';
        $diff = round($diff / 60);
        if ($diff < 60) return $diff . ' phút trước';
        $diff = round($diff / 60);
        if ($diff < 24) return $diff . ' giờ trước';
        $diff = round($diff / 24);
        if ($diff < 30) return $diff . ' ngày trước';
        return date('d/m/Y', $time);
    }

    public function trendingFeed(): void {
        header('Content-Type: application/json; charset=utf-8');
        try {
            $page = isset($_GET['page_num']) ? (int)$_GET['page_num'] : 1;
            
            
            
            
            
            
            
            

            
            
            
            

            $data = $this->homeService->getTrendingFeed($page);
            $response = json_encode([
                'success' => true,
                'data' => $data
            ]);
            
            echo $response;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    public function forYouFeed(): void {
        header('Content-Type: application/json; charset=utf-8');
        try {
            $page = isset($_GET['page_num']) ? (int)$_GET['page_num'] : 1;
            $topicsStr = isset($_GET['topics']) ? trim((string)$_GET['topics']) : '';
            $topics = !empty($topicsStr) ? explode(',', $topicsStr) : [];

            $data = $this->homeService->getForYouFeed($page, $topics);
            echo json_encode([
                'success' => true,
                'data' => $data
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    public function hotNews(): void {
        header('Content-Type: application/json; charset=utf-8');
        try {
            $data = $this->homeService->getHotNewsOfTheDay(4);
            echo json_encode([
                'success' => true,
                'items' => $data
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    public function videoFeed(): void {
        header('Content-Type: application/json; charset=utf-8');
        try {
            $data = $this->homeService->getVideoFeed();
            echo json_encode([
                'success' => true,
                'items' => $data
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

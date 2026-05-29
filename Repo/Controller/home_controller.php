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

            // Simple File Cache
            $cacheDir = __DIR__ . '/../cache';
            if (!is_dir($cacheDir)) {
                @mkdir($cacheDir, 0777, true);
            }
            $cacheFile = $cacheDir . '/feed_page_' . $page . '.json';
            $cacheTtl = 30; // 30 seconds

            if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
                echo file_get_contents($cacheFile);
                return;
            }

            $data = $this->homeService
                ->getHomepageFeed($page);

            $response = json_encode([
                'success' => true,
                'data' => $data
            ]);

            // Save to cache
            @file_put_contents($cacheFile, $response);

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
            
            // Limit to 3 latest articles in this category
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
}

<?php

require_once __DIR__ . '/../Services/search_service.php';
require_once __DIR__ . '/../View/ViewEngine.php';

class SearchController
{
    private ViewEngine $engine;
    private string $basePath;

    public function __construct()
    {
        $this->engine = new ViewEngine();
        $this->basePath = dirname(__DIR__);
    }

    public function search(string $keyword): void
    {
        $filePath = $this->basePath . '/UI/html/search.html';

        if (!file_exists($filePath)) {
            http_response_code(404);
            echo '<h1>404 - Trang không tìm thấy</h1>';
            return;
        }

        $html = file_get_contents($filePath);
        $keyword = trim($keyword);
        $resultsHtml = '';
        $resultCount = 0;

        if ($keyword !== '') {
            try {
                $searchService = new SearchService();
                $articles = $searchService->searchArticles($keyword);
                $resultCount = count($articles);

                if ($resultCount === 0) {
                    $resultsHtml = '<div class="alert alert-info">Không tìm thấy bài viết nào phù hợp với từ khóa.</div>';
                } else {
                    foreach ($articles as $article) {
                        $title = htmlspecialchars($article['title']);
                        $excerpt = htmlspecialchars($article['excerpt']);
                        $slug = htmlspecialchars($article['slug']);
                        $thumbnail = htmlspecialchars($article['thumbnail_url'] ?: 'https://via.placeholder.com/320x180?text=No+Image');
                        $resultsHtml .= '<div class="col-12"><div class="card mb-3 shadow-sm"><div class="row g-0"><div class="col-md-4"><img src="' . $thumbnail . '" class="img-fluid rounded-start" style="height:180px; object-fit:cover; width:100%;"></div><div class="col-md-8"><div class="card-body"><h5 class="card-title">' . $title . '</h5><p class="card-text text-muted">' . $excerpt . '</p><p class="card-text"><small class="text-secondary">Lượt xem: ' . intval($article['view_count']) . '</small></p><a href="?page=article&slug=' . $slug . '" class="btn btn-primary btn-sm">Xem bài viết</a></div></div></div></div></div>';
                    }
                }
            } catch (PDOException $e) {
                $resultsHtml = '<div class="alert alert-danger">Lỗi tìm kiếm: ' . htmlspecialchars($e->getMessage()) . '</div>';
            }
        } else {
            $resultsHtml = '<div class="alert alert-secondary">Vui lòng nhập từ khóa để tìm kiếm.</div>';
        }

        $html = str_replace('{{keyword}}', htmlspecialchars($keyword), $html);
        $html = str_replace('{{count}}', $resultCount, $html);
        $html = str_replace('{{results}}', $resultsHtml, $html);

        
        $header = $this->loadComponent('header');
        $footer = $this->loadComponent('footer');
        
        $html = str_replace('{{header}}', $header, $html);
        $html = str_replace('{{footer}}', $footer, $html);
        $html = str_replace('<div id="header-placeholder"></div>', $header, $html);
        $html = str_replace('<div id="footer-placeholder"></div>', $footer, $html);

        $html = $this->rewriteViewPaths($html);
        $html .= "\n<!-- RENDERED_BY_ViewEngine -->";

        echo $html;
        exit;
    }

    public function suggestions(string $keyword): void
    {
        header('Content-Type: application/json; charset=utf-8');

        try {
            $searchService = new SearchService();
            $articles = $searchService->searchSuggestions($keyword, 8);
            $payload = array_map(function ($article) {
                return [
                    'id' => isset($article['article_id']) ? intval($article['article_id']) : null,
                    'title' => $article['title'] ?? '',
                    'excerpt' => $article['excerpt'] ?? '',
                    'slug' => $article['slug'] ?? '',
                    'thumbnail' => $article['thumbnail_url'] ?? '',
                ];
            }, $articles);

            echo json_encode(['items' => $payload]);
        } catch (PDOException $e) {
            echo json_encode(['items' => [], 'error' => $e->getMessage()]);
        }
    }

    private function loadComponent(string $name): string
    {
        $componentPath = $this->basePath . '/UI/components/' . $name . '.html';
        return file_exists($componentPath) ? file_get_contents($componentPath) : '';
    }

    private function rewriteViewPaths(string $html): string
    {
        $html = preg_replace('/href\s*=\s*"\.\.\/css\
        $html = preg_replace('/src\s*=\s*"\.\.\/js\
        $html = preg_replace('/href\s*=\s*"\.\.\/html\

        $html = preg_replace_callback('/href\s*=\s*"([^\"]+)\.html"/i', function ($matches) {
            $page = pathinfo($matches[1], PATHINFO_FILENAME);
            $page = str_replace(' ', '_', $page);
            return 'href="?page=' . urlencode($page) . '"';
        }, $html);

        return $html;
    }
}

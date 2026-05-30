<?php

require_once __DIR__ . '/../Services/category_service.php';
require_once __DIR__ . '/../View/CategoryView.php';

class CategoryPageController {

    private CategoryService $categoryService;

    public function __construct() {
        $this->categoryService = new CategoryService();
    }

    public function show(): void {
        $slug = isset($_GET['slug']) ? trim((string)$_GET['slug']) : 'cong-nghe';
        
        $category = $this->categoryService->getCategoryDetails($slug);
        
        if (!$category) {
            header('Location: ?page=home');
            exit;
        }

        $themeMap = [
            'cong-nghe' => 'theme-cong-nghe',
            'kinh-doanh' => 'theme-kinh-doanh',
            'thoi-su' => 'theme-thoi-su',
        ];
        $themeClass = $themeMap[$slug] ?? 'theme-default';

        $breadcrumbHtml = '<li class="breadcrumb-item"><a href="?page=home" class="text-decoration-none text-muted">Trang chủ</a></li>';
        if (isset($category['parent_name']) && $category['parent_name'] !== '') {
            $breadcrumbHtml .= '<li class="breadcrumb-item"><a href="?page=category&slug=' . htmlspecialchars($category['parent_slug'] ?? '') . '" class="text-decoration-none text-muted">' . htmlspecialchars($category['parent_name'] ?? '') . '</a></li>';
        }
        $breadcrumbHtml .= '<li class="breadcrumb-item active text-theme font-weight-bold" aria-current="page">' . htmlspecialchars($category['name'] ?? '') . '</li>';

        $view = new CategoryView();
        $view->render([
            'CATEGORY_NAME' => htmlspecialchars($category['name'] ?? ''),
            'CATEGORY_SLUG' => htmlspecialchars($category['slug'] ?? ''),
            'CATEGORY_DESC' => htmlspecialchars($category['description'] ?? ''),
            'THEME_CLASS' => $themeClass,
            'BREADCRUMBS' => $breadcrumbHtml
        ]);
    }

    public function feed(): void {
        header('Content-Type: application/json; charset=utf-8');
        try {
            $slug = isset($_GET['slug']) ? trim((string)$_GET['slug']) : 'cong-nghe';
            $page = isset($_GET['page_num']) ? (int)$_GET['page_num'] : 1;

            // // Simple File Cache per category page
            // $cacheDir = __DIR__ . '/../cache';
            // if (!is_dir($cacheDir)) {
            //     @mkdir($cacheDir, 0777, true);
            // }
            // $cacheFile = $cacheDir . '/category_' . $slug . '_page_' . $page . '.json';
            // $cacheTtl = 30; // 30 seconds

            // if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
            //     echo file_get_contents($cacheFile);
            //     return;
            // }

            $data = $this->categoryService->getCategoryArticles($slug, $page);
            $response = json_encode([
                'success' => true,
                'data' => $data
            ]);

            // @file_put_contents($cacheFile, $response);
            echo $response;

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
}

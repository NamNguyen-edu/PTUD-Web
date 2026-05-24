<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();

// PHẦN 1: KẾT NỐI DATABASE & SERVICES
require_once __DIR__ . '/Model/pdo.php';
require_once __DIR__ . '/Database/init_db.php';
require_once __DIR__ . '/Services/search_service.php';
require_once __DIR__ . '/Services/profile_service.php';

// PHẦN 2: CÁC HÀM HỖ TRỢ (HELPER FUNCTIONS)
function redirect($url)
{
    header('Location: ' . $url);
    exit;
}

// Hàm này tự động biến các link cũ như href="home.html" thành href="?page=home"
function rewriteViewPaths(string $html): string
{
    $html = preg_replace('/href\s*=\s*"\.\.\/css\//i', 'href="Repo/UI/css/', $html);
    $html = preg_replace('/src\s*=\s*"\.\.\/js\//i', 'src="Repo/UI/js/', $html);

    $html = preg_replace_callback('/href\s*=\s*"([^\"]+)\.html"/i', function ($matches) {
        $page = pathinfo($matches[1], PATHINFO_FILENAME);
        return 'href="?page=' . urlencode($page) . '"';
    }, $html);
    return $html;
}

// Hàm RENDER GIAO DIỆN CHÍNH
function renderView(string $page)
{
    $map = [
        'home'               => 'home',
        'login'              => 'Login',
        'admin_dashboard'    => 'admin_dashboard',
        'admin1'             => 'admin1',
        'AccountManagement'  => 'AccountManagement',
        'CategoryManagement' => 'CategoryManagement',
        'article'            => 'article',
        'post'               => 'post',
        'postnews'           => 'postnews',
        'profile'            => 'profile',
        'search'             => 'search',
        'technology'         => 'technology',
        'version-control'    => 'version-control'
    ];

    // Nếu người dùng nhập bậy bạ một trang không có trong Map, đẩy về home
    if (!array_key_exists($page, $map)) {
        redirect('?page=home');
        return;
    }

    $viewFile = $map[$page];
    $filePath = __DIR__ . '/UI/html/' . $viewFile . '.html'; // Đường dẫn trỏ đúng vào thư mục html của bạn

    if (!file_exists($filePath)) {
        http_response_code(404);
        echo "<h1 style='color:red; text-align:center; margin-top:50px;'>404 - Lỗi File HTML!</h1>";
        echo "<p style='text-align:center;'>Không tìm thấy file: <b>{$filePath}</b></p>";
        return;
    }

    $html = file_get_contents($filePath);
    $html = rewriteViewPaths($html);

    echo $html;
}
// PHẦN 3: XỬ LÝ ACTIONS (POST FORMS, API AJAX) - KHÔNG IN HTML Ở ĐÂY
$action = trim((string)($_GET['action'] ?? ''));

if ($action !== '') {
    switch ($action) {
        case 'login':
            exit;
        case 'category_api':
            require_once __DIR__ . '/Controller/CategoryManagement_controller.php';
            exit;
        case 'account_api':
            require_once __DIR__ . '/Controller/Account_controller.php';
            exit;
        case 'logout':
            session_destroy();
            redirect('?page=login');

            exit;
    }
    exit;
}
// PHẦN 4: ĐỊNH TUYẾN TRANG GIAO DIỆN (GET VIEWS)
$page = trim((string)($_GET['page'] ?? 'home'));
renderView($page);

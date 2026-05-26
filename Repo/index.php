
 <!-- * CHANGE LOG (PHIÊN LÀM VIỆC HIỆN TẠI):
 * - AuthController.php: đã cập nhật để đảm bảo `logout()` và `currentUser()` dùng `session_start()` an toàn.
 * - AuthController.php: `currentUser()` trả về JSON gồm `logged` và `user` để header JS có thể hiển thị profile khi đã đăng nhập.
 * - UI/components/header.html: đã chuyển loader `header_user.js` thành script động để tránh lỗi 404 khi load header từ trang tĩnh.
 * - UI/js/header_user.js: đã sửa đường dẫn và logic để gọi `get_current_user` đúng theo page hiện tại, cả khi chạy root PHP và khi chạy từ `UI/html/`.
 * - UI/js/profile.js` và `UI/js/postnews.js`: đã thêm việc load `header_user.js` sau khi chèn header bằng `innerHTML`, giúp script được thực thi đúng.
  -->

<?php
session_start();

require_once __DIR__ . '/Controller/AuthController.php';
require_once __DIR__ . '/Controller/DashboardController.php';

function redirect(string $url): void
{
    header('Location: ' . $url);
    exit;
}

$page = trim((string)($_GET['page'] ?? 'home'));

// Handle action-based endpoints first
if ($action !== '') {
    switch ($action) {
        // 🔥 ĐOẠN THÊM MỚI 1: Xử lý Lưu Nháp/Đăng bài
case 'save_post':

    require_once __DIR__ . '/Controller/PostnewsController.php';

    $controller = new PostnewsController();

    $controller->savePost();

    exit;
            break;
            
        case 'login':
            handleLogin();
            break;
        case 'signup':
            handleSignUp();
            break;
        case 'logout':
            session_unset();
            session_destroy();
            redirect('?page=home');
            break;
        case 'search_suggestions':
            handleSearchSuggestions();
            break;
        case 'get_dashboard_data':
            header('Content-Type: application/json; charset=utf-8');
            try {
                $service = new DashboardAdminService();
                $data = $service->getDashboardData();
                echo json_encode($data);
            } catch (Throwable $e) {
                http_response_code(500);
                echo json_encode(['error' => true, 'message' => $e->getMessage()]);
            }
            break;
        case 'get_current_user':
            header('Content-Type: application/json; charset=utf-8');
            $logged = isset($_SESSION['user_id']) && $_SESSION['user_id'];
            $user = [
                'id' => $logged ? ($_SESSION['user_id'] ?? null) : null,
                'name' => $logged ? ($_SESSION['user_name'] ?? ($_SESSION['user_fullname'] ?? '')) : null,
                'email' => $logged ? ($_SESSION['user_email'] ?? null) : null,
            ];
            echo json_encode(['logged' => $logged, 'user' => $user]);
            break;
        case 'home_feed':
            require_once __DIR__ . '/Controller/home_controller.php';
            (new HomeController())->feed();
            break;
        case 'article_detail':
            require_once __DIR__ . '/Controller/load_articles_controller.php';
            (new ArticleController())->detail();
            break;
        default:
            redirect('?page=home');
    }
    exit;
}

// Page rendering
switch ($page) {
    case 'save_post':
        require_once __DIR__ . '/Controller/PostnewsController.php';
        (new PostnewsController())->savePost();
        break;

    case 'login':
        require_once __DIR__ . '/Controller/AuthController.php';
        (new AuthController())->login();
        break;

    case 'signup':
        require_once __DIR__ . '/Controller/AuthController.php';
        (new AuthController())->signup();
        break;

    case 'logout':
        require_once __DIR__ . '/Controller/AuthController.php';
        (new AuthController())->logout();
        break;

    case 'search_suggestions':
        require_once __DIR__ . '/Controller/SearchController.php';
        (new SearchController())->suggestions(trim((string)($_GET['keyword'] ?? '')));
        break;

    case 'get_dashboard_data':
        require_once __DIR__ . '/Controller/DashboardController.php';
        (new DashboardController())->getDashboardData();
        break;

    case 'get_current_user':
        require_once __DIR__ . '/Controller/AuthController.php';
        (new AuthController())->currentUser();
        break;

    case 'home_feed':
        require_once __DIR__ . '/Controller/home_controller.php';
        (new HomeController())->feed();
        break;

    case 'article_detail':
        require_once __DIR__ . '/Controller/load_articles_controller.php';
        (new ArticleController())->detail();
        break;

    case 'postnews':
        require_once __DIR__ . '/Controller/PostnewsController.php';
        (new PostnewsController())->show();
        break;

    case 'home':
        require_once __DIR__ . '/Controller/home_page_controller.php';
        (new HomePageController())->render();
        break;

    case 'article':
    case 'post':
    case 'technology':
    case 'admin_dashboard':
    case 'admin_userm':
    
    case 'accountmanagement':
    case 'catalogmanagement':
    case 'version-control':
        require_once __DIR__ . '/Controller/PageController.php';
        (new PageController())->render($page);
        break;

    case 'search':
        require_once __DIR__ . '/Controller/SearchController.php';
        (new SearchController())->search(trim((string)($_GET['keyword'] ?? '')));
        break;

    case 'profile':
        require_once __DIR__ . '/Controller/ProfileController.php';
        (new ProfileController())->show();
        break;

    case 'dbtest':
        require_once __DIR__ . '/Controller/DbTestController.php';
        (new DbTestController())->test();
        break;

    default:
        redirect('?page=home');
}
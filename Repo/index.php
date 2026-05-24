<?php
session_start();

require_once __DIR__ . '/Model/pdo.php';
require_once __DIR__ . '/Services/search_service.php';
require_once __DIR__ . '/Database/init_db.php'; 
require_once __DIR__ . '/Services/profile_service.php';
require_once __DIR__ . '/Services/Dashboard_admin_service.php';
$action = trim((string)($_GET['action'] ?? ''));

function redirect($url)
{
    header('Location: ' . $url);
    exit;
}

function handleSearchSuggestions()
{
    $keyword = trim((string)($_GET['keyword'] ?? ''));
    header('Content-Type: application/json; charset=utf-8');

    if ($keyword === '') {
        echo json_encode(['items' => []]);
        exit;
    }

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

    exit;
}

function showMessage(string $message, string $type = 'info')
{
    $color = $type === 'error' ? 'red' : ($type === 'success' ? 'green' : '#333');
    echo '<div style="padding: 16px; margin: 16px 0; border: 1px solid ' . $color . '; color: ' . $color . '; background: #f9f9f9;">' . htmlspecialchars($message) . '</div>';
}

function safePasswordCheck(array $user, string $password): bool
{
    if (empty($user['password'])) {
        return false;
    }

    if (password_verify($password, $user['password'])) {
        return true;
    }

    if (md5($password) === $user['password']) {
        return true;
    }

    return $password === $user['password'];
}

function handleLogin()
{
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    // Giả lập không cần DB
    if ($username === 'user' && $password === 'admin123') {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_name'] = 'Admin Test';
        redirect('?page=home&login_success=1'); // Chuyển về home và báo login success
        return;
    }

    showMessage('Tài khoản test là user/admin123', 'error');
    require_once __DIR__ . '/Controller/PageController.php';
    (new PageController())->render('login');
}

function handleSignUp()
{
    $fullname = trim($_POST['fullname'] ?? '');
    $emailOrPhone = trim($_POST['email_or_phone'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($fullname === '' || $emailOrPhone === '' || $password === '') {
        showMessage('Vui lòng điền đầy đủ thông tin đăng ký.', 'error');
        require_once __DIR__ . '/Controller/PageController.php';
        (new PageController())->render('signup');
        return;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    try {
        pdo_execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', $fullname, $emailOrPhone, $passwordHash);
        showMessage('Đăng ký thành công. Vui lòng đăng nhập.', 'success');
        require_once __DIR__ . '/Controller/PageController.php';
        (new PageController())->render('login');
    } catch (PDOException $e) {
        showMessage('Lỗi đăng ký: ' . $e->getMessage(), 'error');
        require_once __DIR__ . '/Controller/PageController.php';
        (new PageController())->render('signup');
    }
}

$page = trim((string)($_GET['page'] ?? 'home'));

// Handle action-based endpoints first
if ($action !== '') {
    switch ($action) {
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
        case "AccountManagement":
            require_once __DIR__ . '/Controller/Account_controller.php';
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
    case 'home':
        // Delegate home rendering to a dedicated controller to keep index.php thin
        require_once __DIR__ . '/Controller/home_page_controller.php';
        (new HomePageController())->render();
        break;
    case 'login':
    case 'signup':
    case 'article':
    case 'post':
    case 'postnews':
    case 'technology':
    case 'admin_dashboard':
    case 'admin_userm':
    case 'admin1':
    case 'AccountManagement':
        require_once __DIR__ . '/Controller/Account_controller.php';
        break;
    case 'catalogmanagement':
    case 'version-control':
        require_once __DIR__ . '/Controller/PageController.php';
        (new PageController())->render($page);
        break;
    case 'search':
        require_once __DIR__ . '/Controller/SearchController.php';
        $keyword = trim((string)($_GET['keyword'] ?? ''));
        (new SearchController())->search($keyword);
        break;
    case 'profile':
        // Use new ProfileController to fetch data and render via View layer
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

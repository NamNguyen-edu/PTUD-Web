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
$dbPassword = $user['password_hash'] ?? $user['password'] ?? ''; 

    if (empty($dbPassword)) {
        return false;
    }

    if (password_verify($password, $dbPassword)) {
        return true;
    }

    if (md5($password) === $dbPassword) {
        return true;
    }

    return $password === $dbPassword;
}

function handleLogin()
{
    $username = trim($_POST['username'] ?? ''); // Tên đăng nhập hoặc Email
    $password = trim($_POST['password'] ?? '');

    if (empty($username) || empty($password)) {
        showMessage('Vui lòng nhập đầy đủ tài khoản và mật khẩu.', 'error');
        require_once __DIR__ . '/Controller/PageController.php';
        (new PageController())->render('login');
        return;
    }

    try {
        // Mở kết nối Database
        $db = pdo_get_connection();
        
        // Tìm user theo Email hoặc Name (để người dùng nhập cái nào cũng được)
$stmt = $db->prepare('SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1');
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Kiểm tra xem user có tồn tại và password có khớp không
        if ($user && safePasswordCheck($user, $password)) {
            
            // Đăng nhập thành công -> Lưu thông tin vào Session
            $_SESSION['user_id'] = $user['user_id'] ?? ($user['id'] ?? 1);
            $_SESSION['user_name'] = $user['full_name'] ?? ($user['name'] ?? 'Thành viên');
            $_SESSION['user_email'] = $user['email'] ?? '';
            
            // Đá về trang chủ kèm cờ hiệu thành công
            redirect('?page=home&login_success=1');
            return;
        } else {
            // Thất bại -> Báo lỗi
            showMessage('Tài khoản hoặc mật khẩu không chính xác! Hãy kiểm tra lại.', 'error');
            require_once __DIR__ . '/Controller/PageController.php';
            (new PageController())->render('login');
        }
    } catch (PDOException $e) {
        // Lỗi sập Database thì báo lỗi hệ thống
        showMessage('Hệ thống đang bảo trì hoặc mất kết nối Database.', 'error');
        require_once __DIR__ . '/Controller/PageController.php';
        (new PageController())->render('login');
    }
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
    // 🔥 ĐOẠN THÊM MỚI 2: Đẩy luồng postnews cho Controller xử lý
    case 'postnews':
        require_once __DIR__ . '/Controller/PostnewsController.php';
        (new PostnewsController())->show();
        break;
        
    case 'home':
        // Delegate home rendering to a dedicated controller to keep index.php thin
        require_once __DIR__ . '/Controller/home_page_controller.php';
        (new HomePageController())->render();
        break;
    case 'login':
    case 'signup':
    case 'article':
    case 'post':
    // case 'postnews': (Đã xóa ở đây để nó không gọi hàm cũ)
    case 'technology':
    case 'admin_dashboard':
    case 'admin_userm':
    case 'admin1':
    case 'accountmanagement':
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
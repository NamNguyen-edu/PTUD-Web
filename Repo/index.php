
 <!-- * CHANGE LOG (PHIÊN LÀM VIỆC HIỆN TẠI):
 * - AuthController.php: đã cập nhật để đảm bảo `logout()` và `currentUser()` dùng `session_start()` an toàn.
 * - AuthController.php: `currentUser()` trả về JSON gồm `logged` và `user` để header JS có thể hiển thị profile khi đã đăng nhập.
 * - UI/components/header.html: đã chuyển loader `header_user.js` thành script động để tránh lỗi 404 khi load header từ trang tĩnh.
 * - UI/js/header_user.js: đã sửa đường dẫn và logic để gọi `get_current_user` đúng theo page hiện tại, cả khi chạy root PHP và khi chạy từ `UI/html/`.
 * - UI/js/profile.js` và `UI/js/postnews.js`: đã thêm việc load `header_user.js` sau khi chèn header bằng `innerHTML`, giúp script được thực thi đúng.
  -->

<?php
session_start();

<<<<<<< HEAD
require_once __DIR__ . '/Controller/AuthController.php';
require_once __DIR__ . '/Controller/DashboardController.php';

function redirect(string $url): void
=======
require_once __DIR__ . '/Model/pdo.php';
require_once __DIR__ . '/Services/search_service.php';
require_once __DIR__ . '/Database/init_db.php'; 
require_once __DIR__ . '/Services/profile_service.php';
$action = trim((string)($_GET['action'] ?? ''));
if ($action !== '') {
    switch ($action) {
        case 'home_feed':
            require_once __DIR__ . '/Controller/home_controller.php';
            $controller = new HomeController();
            $controller->feed();
            exit;
        case 'article_detail':
            require_once __DIR__ . '/Controller/load_articles_controller.php';
            $controller = new ArticleController();
            $controller->detail();
            exit;
        case 'search_suggestions':
            handleSearchSuggestions();
            exit;
    }
}
function redirect($url)
>>>>>>> main
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

<<<<<<< HEAD
=======
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo '<h1>404 - Trang không tìm thấy</h1>';
        echo '<p>Không tìm thấy view: ' . htmlentities($viewFile) . '</p>';
        return;
    }

    $html = file_get_contents($filePath);
    $html = rewriteViewPaths($html);

    if ($page === 'login') {
        $html = rewriteFormForLogin($html);
    } elseif ($page === 'signup') {
        $html = rewriteFormForSignUp($html);
    }

    echo $html;
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
        redirect('?page=home'); // Chuyển về home qua PHP
        return;
    }

    showMessage('Tài khoản test là user/admin123', 'error');
    renderView('login');
}
function handleSignUp()
{
    $fullname = trim($_POST['fullname'] ?? '');
    $emailOrPhone = trim($_POST['email_or_phone'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($fullname === '' || $emailOrPhone === '' || $password === '') {
        showMessage('Vui lòng điền đầy đủ thông tin đăng ký.', 'error');
        renderView('signup');
        return;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    try {
        pdo_execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', $fullname, $emailOrPhone, $passwordHash);
        showMessage('Đăng ký thành công. Vui lòng đăng nhập.', 'success');
        renderView('login');
    } catch (PDOException $e) {
        showMessage('Lỗi đăng ký: ' . $e->getMessage(), 'error');
        renderView('signup');
    }
}

// 2. Tìm đến hàm renderProfile() và thay bằng đoạn này:
function renderProfile()
{
    // Nếu chưa có cơ chế Session đăng nhập hoàn chỉnh, tạm thời dùng ID = 1 để test giao diện
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 1;

    try {
        // Khởi tạo lớp Service để bốc dữ liệu trực tuyến từ Cloud Aiven
        $profileService = new ProfileService();
        $userInfo = $profileService->getUserInfo($userId);
        $userArticles = $profileService->getUserArticles($userId);

        // Đọc ruột file template profile.html tĩnh
        $viewFile = slugToViewFile('profile');
        $filePath = __DIR__ . '/UI/html/' . $viewFile . '.html';

        if (!file_exists($filePath)) {
            http_response_code(404);
            echo '<h1>404 - Trang không tìm thấy</h1>';
            return;
        }

        $html = file_get_contents($filePath);

        // Bắt mạch dữ liệu: Nếu DB có data thì lấy, nếu trống thì hiển thị chữ mặc định
        $fullName = (!empty($userInfo) && !empty($userInfo['full_name'])) ? $userInfo['full_name'] : 'Nguyễn Duy Bảo';
        $bio      = (!empty($userInfo) && !empty($userInfo['bio']))       ? $userInfo['bio']       : 'Chưa có tiểu sử.';
        $email    = (!empty($userInfo) && !empty($userInfo['email']))     ? $userInfo['email']     : '';

        // 🔥 THỰC HIỆN ĐÈ DỮ LIỆU VÀO CÁC CẶP DẤU {{...}} TRÊN FILE HTML
        $html = str_replace('{{FULL_NAME}}', htmlspecialchars($fullName), $html);
        $html = str_replace('{{BIO}}', htmlspecialchars($bio), $html);
        $html = str_replace('{{EMAIL}}', htmlspecialchars($email), $html);
        $html = str_replace('{{MAJOR}}', 'Business Information Systems', $html);
        $html = str_replace('{{ORGANIZATION}}', 'UEH', $html);

        // Vòng lặp tự render danh sách bài viết thực tế từ database thành các hàng <tr>
        $articlesHtml = '';
        if (empty($userArticles)) {
            $articlesHtml = '<tr><td colspan="4" class="text-center text-muted py-3">Bạn chưa có bài đăng nào.</td></tr>';
        } else {
            foreach ($userArticles as $article) {
                $statusBadge = '';
                switch ($article['status']) {
                    case 'published':
                        $statusBadge = '<span class="badge bg-success">Đã xuất bản</span>';
                        break;
                    case 'pending':
                        $statusBadge = '<span class="badge bg-info text-dark">Chờ duyệt</span>';
                        break;
                    case 'archived':
                        $statusBadge = '<span class="badge bg-secondary">Lưu trữ</span>';
                        break;
                    default:
                        $statusBadge = '<span class="badge bg-warning text-dark">Bản nháp</span>';
                        break;
                }

                $dateFormatted = date('d/m/Y', strtotime($article['created_at']));
                $categoryName = htmlspecialchars($article['category_name'] ?: 'Chưa phân loại');
                
                $articlesHtml .= '
                <tr>
                    <td>
                        <div class="font-weight-bold text-dark">' . htmlspecialchars($article['title']) . '</div>
                        <small class="text-secondary">Chuyên mục: ' . $categoryName . ' | Ngày tạo: ' . $dateFormatted . '</small>
                    </td>
                    <td class="align-middle text-center">' . $statusBadge . '</td>
                    <td class="align-middle text-center">' . intval($article['view_count']) . '</td>
                    <td class="align-middle text-right">
                        <a href="?page=postnews&id=' . $article['article_id'] . '" class="btn btn-sm btn-outline-primary mr-1"><i class="fas fa-edit"></i> Sửa</a>
                    </td>
                </tr>';
            }
        }

        // Bắn chuỗi HTML danh sách bài viết vào vị trí nhãn chờ trên template
        $html = str_replace('{{LIST_ARTICLES}}', $articlesHtml, $html);

        // 1. 🔥 NẠP COMPONENT GỐC CỦA NAM VÀO ĐÚNG VỊ TRÍ THẺ DIV PLACEHOLDER
        $headerComponent = loadHtmlComponent('header');
        $footerComponent = loadHtmlComponent('footer');

        // 2. 🔥 ÉP ĐỒNG BỘ NÚT ĐĂNG NHẬP TRÊN HEADER COMPONENT VỪA NẠP
        if (!empty($userInfo)) {
            $displayHeaderName = !empty($userInfo['full_name']) ? $userInfo['full_name'] : 'Nguyễn Duy Bảo';
            $loggedInHeader = '
            <div class="d-flex align-items-center ml-auto" style="gap: 8px;">
                <span class="user-avatar-circle" style="background-color: #007bff; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">NB</span>
                <a href="?page=profile" class="font-weight-bold text-primary" style="text-decoration: none;">' . htmlspecialchars($displayHeaderName) . '</a>
            </div>';

            // Quét đổi nút trên Header Component
            $headerComponent = preg_replace('/<div class="d-flex align-items-center gap-2">.*?<\/div>/is', $loggedInHeader, $headerComponent);
            $headerComponent = preg_replace('/<div class="auth-buttons">.*?<\/div>/is', $loggedInHeader, $headerComponent);
            $headerComponent = preg_replace('/<a[^>]*login[^>]*>.*?<\/a>\s*<a[^>]*signup[^>]*>.*?<\/a>/is', $loggedInHeader, $headerComponent);
        }

        // 3. 🔥 THAY THẾ CHÍNH XÁC VÀO THẺ DIV ID CỦA FILE HTML
        $html = str_replace('<div id="header-placeholder"></div>', $headerComponent, $html);
        $html = str_replace('<div id="footer-placeholder" class="mt-auto w-100"></div>', $footerComponent, $html);

        // Thực thi hàm sửa đường dẫn tĩnh CSS/JS gốc của Nam
        $html = rewriteViewPaths($html);
        
        echo $html;

    } catch (PDOException $e) {
        showMessage('Lỗi tải thông tin người dùng: ' . $e->getMessage(), 'error');
        renderView('profile');
    }
}

function renderDbTest()
{
try {
        // Mượn tạm kết nối PDO gốc để bốc tên database, thách thức mọi loại lỗi unknown function
        $conn = pdo_get_connection();
        $stmt = $conn->query('SELECT DATABASE()');
        $database = $stmt->fetchColumn();
        
        showMessage('Kết nối thành công tới database: ' . $database, 'success');
    } catch (PDOException $e) {
        showMessage('Lỗi kết nối PDO: ' . $e->getMessage(), 'error');
    }
}

$page = trim((string)($_GET['page'] ?? 'home'));



switch ($action) {
>>>>>>> main
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
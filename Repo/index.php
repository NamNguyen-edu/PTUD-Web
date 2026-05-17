<?php
session_start();

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
{
    header('Location: ' . $url);
    exit;
}

function slugToViewFile(string $page): string
{
    $map = [
        'home' => 'home',
        'login' => 'Login',
        'signup' => 'SignUp',
        'article' => 'article',
        'post' => 'post',
        'postnews' => 'postnews',
        'profile' => 'profile',
        'technology' => 'technology',
        'admin_dashboard' => 'admin dashboard',
        'admin_userm' => 'admin userm',
        'admin1' => 'admin1',
    ];

    return $map[$page] ?? $page;
}

function rewriteViewPaths(string $html): string
{
    // Asset đường dẫn tương đối từ index.php
    $html = preg_replace('/href\s*=\s*"\.\.\/css\//i', 'href="UI/css/', $html);
    $html = preg_replace('/src\s*=\s*"\.\.\/js\//i', 'src="UI/js/', $html);
    $html = preg_replace('/href\s*=\s*"\.\.\/html\//i', 'href="?page=', $html);

    // Chuyển các link .html trong nội dung sang router query string
    $html = preg_replace_callback('/href\s*=\s*"([^\"]+)\.html"/i', function ($matches) {
        $page = pathinfo($matches[1], PATHINFO_FILENAME);
        $page = str_replace(' ', '_', $page);
        return 'href="?page=' . urlencode($page) . '"';
    }, $html);

    return $html;
}

function rewriteComponentPaths(string $html): string
{
    // Asset đường dẫn từ index.php
    $html = str_replace('href="UI/css/', 'href="UI/css/', $html); // Đã đúng
    $html = str_replace('href="?page=', 'href="?page=', $html); // Đã đúng
    return $html;
}

function rewriteFormForLogin(string $html): string
{
    $html = preg_replace('/<form([^>]*)>/i', '<form$1 method="post" action="?action=login">', $html, 1);
    $html = str_replace('id="loginUser"', 'id="loginUser" name="username"', $html);
    $html = str_replace('id="loginPass"', 'id="loginPass" name="password"', $html);
    return $html;
}

function rewriteFormForSignUp(string $html): string
{
    $html = preg_replace('/<form([^>]*)>/i', '<form$1 method="post" action="?action=signup">', $html, 1);
    $html = str_replace('id="fullName"', 'id="fullName" name="fullname"', $html);
    $html = str_replace('id="signupUser"', 'id="signupUser" name="email_or_phone"', $html);
    $html = str_replace('id="signupPass"', 'id="signupPass" name="password"', $html);
    return $html;
}

function loadHtmlComponent(string $name): string
{
    $componentPath = __DIR__ . '/UI/components/' . $name . '.html';
    return file_exists($componentPath) ? file_get_contents($componentPath) : '';
}

function renderSearchPage(string $keyword)
{
    $viewFile = 'search';
    $filePath = __DIR__ . '/UI/html/' . $viewFile . '.html';

    if (!file_exists($filePath)) {
        http_response_code(404);
        echo '<h1>404 - Trang không tìm thấy</h1>';
        echo '<p>Không tìm thấy view: ' . htmlentities($viewFile) . '</p>';
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
                    $resultsHtml .= '<div class="col-12"><div class="card mb-3 shadow-sm"><div class="row g-0"><div class="col-md-4"><img src="' . $thumbnail . '" class="img-fluid rounded-start" style="height:180px; object-fit:cover; width:100%;"></div><div class="col-md-8"><div class="card-body"><h5 class="card-title">' . $title . '</h5><p class="card-text text-muted">' . $excerpt . '</p><p class="card-text"><small class="text-secondary">Lượt xem: ' . intval($article['view_count']) . '</small></p><a href="?page=article" class="btn btn-primary btn-sm">Xem bài viết</a></div></div></div></div></div>';
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

    $html = str_replace('{{header}}', loadHtmlComponent('header'), $html);
    $html = str_replace('{{footer}}', loadHtmlComponent('footer'), $html);
    $html = rewriteViewPaths($html);

    echo $html;
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

function renderView(string $page)
{
    $viewFile = slugToViewFile($page);
    $filePath = __DIR__ . '/UI/html/' . $viewFile . '.html';

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
function renderProfile()
{
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 1;

    try {
        $profileService = new ProfileService();
        $userInfo = $profileService->getUserInfo($userId);
        $userArticles = $profileService->getUserArticles($userId);

        $viewFile = slugToViewFile('profile');
        $filePath = __DIR__ . '/UI/html/' . $viewFile . '.html';

        if (!file_exists($filePath)) {
            http_response_code(404);
            echo '<h1>404 - Trang không tìm thấy</h1>';
            return;
        }

        $html = file_get_contents($filePath);

        // Đổ dữ liệu cá nhân thật từ DB đám mây Aiven
        $fullName = (!empty($userInfo) && !empty($userInfo['full_name'])) ? $userInfo['full_name'] : 'Nguyễn Duy Bảo';
        $bio      = (!empty($userInfo) && !empty($userInfo['bio']))       ? $userInfo['bio']       : 'Nhà văn tự do, đam mê viết lách.';
        $email    = (!empty($userInfo) && !empty($userInfo['email']))     ? $userInfo['email']     : 'bebao2005at@gmail.com';

        $html = str_replace('{{FULL_NAME}}', htmlspecialchars($fullName), $html);
        $html = str_replace('{{BIO}}', htmlspecialchars($bio), $html);
        $html = str_replace('{{EMAIL}}', htmlspecialchars($email), $html);
        $html = str_replace('{{MAJOR}}', 'Chuyên ngành Hệ thống thông tin', $html);
        $html = str_replace('{{ORGANIZATION}}', 'UEH', $html);

        // 🔥 Vòng lặp render bảng danh sách bài viết động (BẢN BẢO HIỂM CHỐNG LỖI LỆCH CỘT 500)
        $articlesHtml = '';
        $totalViews = 0;
        $postsCount = !empty($userArticles) ? count($userArticles) : 0;

        if (empty($userArticles)) {
            $articlesHtml = '<tr><td colspan="4" class="text-center text-muted py-4">Bạn chưa có bài đăng nào.</td></tr>';
        } else {
            foreach ($userArticles as $article) {
                // Kiểm tra xem cột view_count có tồn tại không để tránh bị lỗi 500 trắng trang
                $views = isset($article['view_count']) ? intval($article['view_count']) : (isset($article['views']) ? intval($article['views']) : 0);
                $totalViews += $views;
                
                // Chuẩn hóa Badge trạng thái theo đúng thiết kế của Bảo
                $statusText = 'Bản nháp';
                $statusClass = 'badge-warning';
                if (!empty($article['status']) && (in_array(strtolower($article['status']), ['published', 'đã đăng', 'public']))) {
                    $statusText = 'Đã đăng';
                    $statusClass = 'badge-success';
                }

                $dateFormatted = !empty($article['created_at']) ? date('d/m/Y', strtotime($article['created_at'])) : date('d/m/Y');
                $articleId = isset($article['article_id']) ? $article['article_id'] : 0;
                
                $articlesHtml .= '
                <tr>
                    <td style="max-width: 250px;">
                        <div class="font-weight-bold text-truncate">' . htmlspecialchars($article['title'] ?? 'Bài viết không tiêu đề') . '</div>
                        <small class="text-muted">Cập nhật: ' . $dateFormatted . '</small>
                    </td>
                    <td class="text-center align-middle">
                        <span class="badge badge-pill ' . $statusClass . ' px-3">' . $statusText . '</span>
                    </td>
                    <td class="text-center align-middle">
                        <div class="small"><i class="fas fa-eye mr-1"></i> ' . number_format($views) . '</div>
                    </td>
                    <td class="text-right align-middle">
                        <a href="?page=postnews&id=' . $articleId . '" class="btn btn-light btn-sm mr-1"><i class="fas fa-edit"></i></a>
                        <button class="btn btn-light btn-sm text-danger"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>';
            }
        }

        // Đổ số liệu thống kê lên sidebar giao diện công khai
        $html = str_replace('{{POSTS_COUNT}}', $postsCount, $html);
        $html = str_replace('{{VIEWS_COUNT}}', $totalViews > 1000 ? number_format($totalViews/1000, 1) . 'K' : $totalViews, $html);
        $html = str_replace('{{LIST_ARTICLES}}', $articlesHtml, $html);

        // 1. Nạp Component Header và Footer gốc của Nam
        $headerComponent = loadHtmlComponent('header');
        $footerComponent = loadHtmlComponent('footer');

        // 2. Ép đồng bộ thông tin đăng nhập lên thanh Header Component
        if (!empty($userInfo)) {
            $loggedInHeader = '
            <div class="d-flex align-items-center ml-auto" style="gap: 8px;">
                <span class="user-avatar-circle" style="background-color: #007bff; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">NB</span>
                <a href="?page=profile" class="font-weight-bold text-primary" style="text-decoration: none;">' . htmlspecialchars($fullName) . '</a>
            </div>';

            $headerComponent = preg_replace('/<div class="d-flex align-items-center gap-2">.*?<\/div>/is', $loggedInHeader, $headerComponent);
            $headerComponent = preg_replace('/<div class="auth-buttons">.*?<\/div>/is', $loggedInHeader, $headerComponent);
            $headerComponent = preg_replace('/<a[^>]*login[^>]*>.*?<\/a>\s*<a[^>]*signup[^>]*>.*?<\/a>/is', $loggedInHeader, $headerComponent);
        }

        // 3. Bắn thẳng Header/Footer vào đúng vị trí 2 thẻ div placeholder của Bảo
        $html = str_replace('<div id="header-placeholder"></div>', $headerComponent, $html);
        $html = str_replace('<div id="footer-placeholder" class="mt-auto w-100"></div>', $footerComponent, $html);

        // Sửa đường dẫn tĩnh CSS/JS của Nam
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
    case 'login':
        handleLogin();
        break;
    case 'signup':
        handleSignUp();
        break;
    case 'search_suggestions':
        handleSearchSuggestions();
        break;
    default:
        switch ($page) {
            case 'home':
            case 'login':
            case 'signup':
            case 'article':
            case 'post':
            case 'postnews':
            case 'technology':
            case 'admin_dashboard':
            case 'AccountManagement':
            case 'admin1':
                renderView($page);
                break;
            case 'search':
                $keyword = trim((string)($_GET['keyword'] ?? ''));
                renderSearchPage($keyword);
                break;
            case 'profile':
                renderProfile();
                break;
            case 'dbtest':
                renderDbTest();
                break;  
            default:
            
                redirect('?page=home');
                break;

        }
        break;
}

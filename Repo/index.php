<?php
session_start();

require_once __DIR__ . '/Model/pdo.php';

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
    if (empty($_SESSION['user_id'])) {
        redirect('?page=login');
        return;
    }

    try {
        $userId = $_SESSION['user_id'];
        $user = pdo_query_one('SELECT * FROM users WHERE id = ? LIMIT 1', $userId);

        if (!$user) {
            showMessage('Không tìm thấy người dùng.', 'error');
            redirect('?page=login');
            return;
        }

        renderView('profile');
    } catch (PDOException $e) {
        showMessage('Lỗi tải thông tin người dùng: ' . $e->getMessage(), 'error');
        renderView('profile');
    }
}

function renderDbTest()
{
    try {
        $database = pdo_query_value('SELECT DATABASE()');
        showMessage('Kết nối thành công tới database: ' . $database, 'success');
    } catch (PDOException $e) {
        showMessage('Lỗi kết nối PDO: ' . $e->getMessage(), 'error');
    }
}

$page = trim((string)($_GET['page'] ?? 'home'));
$action = trim((string)($_GET['action'] ?? ''));

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'signup':
        handleSignUp();
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
            case 'admin_userm':
            case 'admin1':
                renderView($page);
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

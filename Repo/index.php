<?php
if (session_status() === PHP_SESSION_NONE) {
  session_start();
}
require_once __DIR__ . '/Model/pdo.php';
require_once __DIR__ . '/View/ViewEngine.php';
require_once __DIR__ . '/Services/search_service.php';
require_once __DIR__ . '/Services/profile_service.php';
require_once __DIR__ . '/Services/Dashboard_admin_service.php';

$page = trim((string)($_GET['page'] ?? 'home'));

function redirect($url)
{
  header('Location: ' . $url);
  exit;
}

$viewEngine = new ViewEngine(__DIR__);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  // Đọc hành động ẩn được gửi kèm từ FormData
  $formAction = $_POST['action'] ?? '';

  switch ($formAction) {
    case 'login':
    case 'signup':
      require_once __DIR__ . '/Controller/login_controller.php';
      $loginCtrl = new LoginController($viewEngine);
      if ($formAction === 'login')  $loginCtrl->handleLogin();
      if ($formAction === 'signup') $loginCtrl->handleSignup();
      break;
  }
  exit;
}

// Màng lọc bảo mật phân quyền
$ADMIN_PAGES = ['admin_dashboard', 'admin_userm', 'admin1', 'accountmanagement', 'catalogmanagement', 'version-control'];
$userRole = $_SESSION['role'] ?? null;

if (in_array($page, $ADMIN_PAGES) && $userRole !== 'admin' && $userRole !== 'chief editor') {
  redirect('?page=login');
}

// Router hiển thị trang
switch ($page) {
  case 'login':
  case 'signup':
    if ($userRole) redirect('?page=home');
    require_once __DIR__ . '/Controller/login_controller.php';
    (new LoginController($viewEngine))->show();
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
  case 'admin1':
  case 'accountmanagement':
  case 'catalogmanagement':
  case 'version-control':
    require_once __DIR__ . '/Controller/PageController.php';
    (new PageController())->render($page);
    break;

  case 'profile':
    require_once __DIR__ . '/Controller/ProfileController.php';
    (new ProfileController())->show();
    break;

  default:
    redirect('?page=home');
}

  <?php

  /*
  * CHANGE LOG:
  * - Tích hợp hệ thống phân quyền động `authorize()` thay cho `checkAccess()`.
  * - Tách các trang public (article, post, technology) khỏi nhóm admin để user bình thường đọc được.
  * - Gắn các quyền (manage_users, manage_category, manage_version) chuẩn xác cho nhóm admin/editor.
  */

  session_start();

  require_once __DIR__ . '/Services/auth_service.php';
  require_once __DIR__ . '/Controller/auth_controller.php';
  require_once __DIR__ . '/Controller/DashboardController.php';

  function redirect(string $url): void
  {
    header('Location: ' . $url);
    exit;
  }

  function authorize(string $action): void
  {
    $auth = new AuthService();
    $role = $_SESSION['role'] ?? 'guest';

    if (!$auth->checkPermission($role, $action)) {
      http_response_code(403);
      die("<h1>403 Forbidden: Bạn không có quyền truy cập trang này.</h1>");
    }
  }

  $page = trim((string)($_GET['page'] ?? 'home'));

  switch ($page) {

    case 'save_post':
      require_once __DIR__ . '/Controller/PostnewsController.php';
      (new PostnewsController())->savePost();
      break;

    case 'login':
      (new AuthController())->login();
      break;

    case 'signup':
      (new AuthController())->signup();
      break;

    case 'logout':
      (new AuthController())->logout();
      break;

    case 'get_current_user':
      (new AuthController())->currentUser();
      break;

    case 'search_suggestions':
      require_once __DIR__ . '/Controller/SearchController.php';
      (new SearchController())->suggestions(trim((string)($_GET['keyword'] ?? '')));
      break;

    case 'search':
      require_once __DIR__ . '/Controller/SearchController.php';
      (new SearchController())->search(trim((string)($_GET['keyword'] ?? '')));
      break;

    case 'get_dashboard_data':
      (new DashboardController())->getDashboardData();
      break;

    case 'home_feed':
      require_once __DIR__ . '/Controller/home_controller.php';
      (new HomeController())->feed();
      break;

    case 'article_detail':
      require_once __DIR__ . '/Controller/load_articles_controller.php';
      (new ArticleController())->detail();
      break;

    case 'update_profile':
      require_once __DIR__ . '/Controller/ProfileController.php';
      (new ProfileController())->updateProfile();
      break;

    case 'upload_avatar':
      require_once __DIR__ . '/Controller/ProfileController.php';
      (new ProfileController())->uploadAvatar();
      break;

    case 'dbtest':
      require_once __DIR__ . '/Controller/DbTestController.php';
      (new DbTestController())->test();
      break;
    case 'home':
      require_once __DIR__ . '/Controller/home_page_controller.php';
      (new HomePageController())->render();
      break;

    case 'postnews':
      require_once __DIR__ . '/Controller/PostnewsController.php';
      (new PostnewsController())->show();
      break;

    case 'profile':
      require_once __DIR__ . '/Controller/ProfileController.php';
      (new ProfileController())->show();
      break;
    case 'article':
    case 'post':
    case 'technology':
      require_once __DIR__ . '/Controller/PageController.php';
      (new PageController())->render($page);
      break;
    case 'admin_dashboard':
    case 'admin_userm':

    case 'accountmangement':
      authorize('manage_users');
      require_once __DIR__ . '/Controller/account_controller.php';
      (new AccountController())->render();
      break;

    case 'categorymanagement':
      authorize('manage_category');
      require_once __DIR__ . '/Controller/category_controller.php';
      (new CategoryController())->render();
      break;
    case 'api_category':
      authorize('manage_category');
      require_once __DIR__ . '/Controller/category_controller.php';
      (new CategoryController())->handleApi();
      break;

    case 'version-control':
      authorize('manage_version');
      require_once __DIR__ . '/Controller/PageController.php';
      (new PageController())->render($page);
      break;

    default:
      redirect('?page=home');
  }
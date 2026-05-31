<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
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
      die("<h1>403 Forbidden: Bạn không có quyền truy cập trang này. (Vai trò hiện tại: " . htmlspecialchars($role) . ", Quyền yêu cầu: " . htmlspecialchars($action) . ")</h1>");
    }
  }

  $page = trim((string)($_GET['page'] ?? 'home'));

switch ($page) {
    case 'save_post':
        require_once __DIR__ . '/Controller/PostnewsController.php';
        (new PostnewsController())->savePost();
        break;
    case 'postnews_action':
        require_once __DIR__ . '/Controller/PostnewsController.php';
        (new PostnewsController())->handleAction();
        break;

    case 'login':
        require_once __DIR__ . '/Controller/auth_controller.php';
        (new AuthController())->login();
        break;

    case 'signup':
        require_once __DIR__ . '/Controller/auth_controller.php';
        (new AuthController())->signup();
        break;

    case 'logout':
        require_once __DIR__ . '/Controller/auth_controller.php';
        (new AuthController())->logout();
        break;

    case 'update_settings':
        require_once __DIR__ . '/Controller/auth_controller.php';
        (new AuthController())->updateSettings();
        break;

    case 'video_feed':
        require_once __DIR__ . '/Controller/home_controller.php';
        (new HomeController())->videoFeed();
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
        require_once __DIR__ . '/Controller/auth_controller.php';
        (new AuthController())->currentUser();
        break;

    case 'home_feed':
        require_once __DIR__ . '/Controller/home_controller.php';
        (new HomeController())->feed();
        break;
    case 'for_you_feed':
        require_once __DIR__ . '/Controller/home_controller.php';
        (new HomeController())->forYouFeed();
        break;
    case 'trending_feed':
        require_once __DIR__ . '/Controller/home_controller.php';
        (new HomeController())->trendingFeed();
        break;
    case 'hot_news':
        require_once __DIR__ . '/Controller/home_controller.php';
        (new HomeController())->hotNews();
        break;
    case 'mega_menu':
        require_once __DIR__ . '/Controller/home_controller.php';
        (new HomeController())->megaMenu();
        break;
    case 'article':
        require_once __DIR__ . '/Controller/PageController.php';
        (new PageController())->render('article');
        break;
    case 'post':
        require_once __DIR__ . '/Controller/PageController.php';
        (new PageController())->render('post');
        break;
    case 'article_detail':
        require_once __DIR__ . '/Controller/load_articles_controller.php';
        (new ArticleController())->detail();
        break;

    case 'article_comments':
        require_once __DIR__ . '/Controller/CommentController.php';
        (new CommentController())->listComments();
        break;

    case 'add_article_comment':
        require_once __DIR__ . '/Controller/CommentController.php';
        (new CommentController())->add();
        break;

    case 'postnews':
        require_once __DIR__ . '/Controller/PostnewsController.php';
        (new PostnewsController())->show();
        break;

    case 'version-control':
        require_once __DIR__ . '/Controller/Version_control_controller.php';
        (new VersionControlController())->show();
        break;

    case 'version_restore':
        require_once __DIR__ . '/Controller/Version_control_controller.php';
        (new VersionControlController())->restoreVersion();
        break;

    case 'version-list':
        require_once __DIR__ . '/Controller/Version_list_controller.php';
        (new VersionListController())->index();
        break;

    case 'approval':
        require_once __DIR__ . '/Controller/Approval_controller.php';
        (new ApprovalController())->show();
        break;
    case 'approve_publish':
        require_once __DIR__ . '/Controller/Approval_controller.php';
        (new ApprovalController())->approvePublish();
        break;

    case 'request_revision':
        require_once __DIR__ . '/Controller/Approval_controller.php';
        (new ApprovalController())->requestRevision();
        break;

    case 'reject_article':
        require_once __DIR__ . '/Controller/Approval_controller.php';
        (new ApprovalController())->reject();
        break;

    case 'get_comments':
        require_once __DIR__ . '/Controller/Approval_controller.php';
        (new ApprovalController())->getComments();
        break;

    case 'add_comment':
        require_once __DIR__ . '/Controller/Approval_controller.php';
        (new ApprovalController())->addComment();
        break;
    case 'get_reading_history':
        require_once __DIR__ . '/Controller/ProfileController.php';
        (new ProfileController())->getReadingHistory();
        break;
    case 'home':
        require_once __DIR__ . '/Controller/home_page_controller.php';
        (new HomePageController())->render();
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
    case 'update_profile':
        require_once __DIR__ . '/Controller/ProfileController.php';
        (new ProfileController())->updateProfile();
        break;
    case 'upload_avatar':
        require_once __DIR__ . '/Controller/ProfileController.php';
        (new ProfileController())->uploadAvatar();
        break;
    case 'vote_article':
        require_once __DIR__ . '/Controller/VoteController.php';
        (new VoteController())->vote();
        break;
    case 'category':
        require_once __DIR__ . '/Controller/CategoryPageController.php';
        (new CategoryPageController())->show();
        break;
    case 'category_feed':
        require_once __DIR__ . '/Controller/CategoryPageController.php';
        (new CategoryPageController())->feed();
        break;
    case 'technology':
        require_once __DIR__ . '/Controller/CategoryPageController.php';
        $_GET['slug'] = 'cong-nghe';
        (new CategoryPageController())->show();
        break;
    case 'settings':
        require_once __DIR__ . '/Controller/SettingsController.php';
        (new SettingsController())->show();
        break;
    case 'change_password':
        require_once __DIR__ . '/Controller/SettingsController.php';
        (new SettingsController())->changePassword();
        break;

    // --- CÁC CASE CHỨC NĂNG BOOKMARK & NOTIFICATION (RESTORED FROM BAO1 BRANCH) ---
    case 'toggle_bookmark':
        require_once __DIR__ . '/Controller/BookmarkController.php';
        (new BookmarkController())->toggle();
        break;
    case 'get_bookmarks':
        require_once __DIR__ . '/Controller/BookmarkController.php';
        (new BookmarkController())->list();
        break;
    case 'check_new_articles':
        require_once __DIR__ . '/Controller/NotificationController.php';
        (new NotificationController())->checkNewArticles();
        break;
    case 'check_new_comments':
        require_once __DIR__ . '/Controller/NotificationController.php';
        (new NotificationController())->checkNewComments();
        break;

    // --- CÁC CASE QUẢN TRỊ ADMIN (BỊ THIẾU TỪ REPO GỐC ĐƯỢC TÍCH HỢP LẠI) ---
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

    case 'api_account':
        authorize('manage_users');
        require_once __DIR__ . '/Controller/account_controller.php';
        (new AccountController())->handleApi();
        break;

    default:
        redirect('?page=home');
}
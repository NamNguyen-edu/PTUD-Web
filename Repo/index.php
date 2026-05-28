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
    case 'article':
        require_once __DIR__ . '/Controller/PageController.php';
        (new PageController())->render('article');
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
    default:
        redirect('?page=home');
}
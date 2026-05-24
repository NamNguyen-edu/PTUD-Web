<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();

require_once __DIR__ . '/Model/pdo.php';
require_once __DIR__ . '/Database/init_db.php';
require_once __DIR__ . '/ViewEngine.php';

// Helper
function redirect($url)
{
    header('Location: ' . $url);
    exit;
}

$viewEngine = new ViewEngine(__DIR__);

// Xử lý Actions (POST)
$action = trim((string)($_GET['action'] ?? ''));
if ($action !== '') {
    switch ($action) {
        case 'login':
        case 'signup':
            require_once __DIR__ . '/Controller/login_controller.php';
            exit;
        case 'logout':
            session_destroy();
            redirect('?page=login');
            exit;
    }
}

// Định tuyến Giao diện (GET)
$page = trim((string)($_GET['page'] ?? 'home'));
$map = [
    'home' => 'home',
    'login' => 'Login',
    'admin_dashboard' => 'admin_dashboard',
    'AccountManagement' => 'AccountManagement',
    'CategoryManagement' => 'CategoryManagement'
];

if (!array_key_exists($page, $map)) {
    $page = 'home';
}

// RENDER BẰNG VIEW ENGINE
echo $viewEngine->render($map[$page], ['TITLE' => 'NewsPulse - ' . ucfirst($page)]);

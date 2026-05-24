<?php

require_once __DIR__ . '/../View/ViewEngine.php';

class PageController
{
    private ViewEngine $engine;
    private string $basePath;

    public function __construct(?ViewEngine $engine = null)
    {
        $this->engine = $engine ?? new ViewEngine();
        $this->basePath = dirname(__DIR__);
    }

    public function render(string $pageName): void
    {
        // Map page names to view file names
        $viewName = $this->slugToViewFile($pageName);

        // Load the template directly for login/signup to apply form rewrites
        if ($pageName === 'login' || $pageName === 'signup') {
            $this->renderLoginForm($pageName, $viewName);
            return;
        }

        // For all other pages, just render via ViewEngine
        echo $this->engine->render($viewName);
    }

    private function renderLoginForm(string $pageName, string $viewName): void
    {
        $filePath = $this->basePath . '/UI/html/' . $viewName . '.html';

        if (!file_exists($filePath)) {
            http_response_code(404);
            echo '<h1>404 - Trang không tìm thấy</h1>';
            return;
        }

        $html = file_get_contents($filePath);

        if ($pageName === 'login') {
            $html = preg_replace('/<form([^>]*)>/i', '<form$1 method="post" action="?action=login">', $html, 1);
            $html = str_replace('id="loginUser"', 'id="loginUser" name="username"', $html);
            $html = str_replace('id="loginPass"', 'id="loginPass" name="password"', $html);
        } elseif ($pageName === 'signup') {
            $html = preg_replace('/<form([^>]*)>/i', '<form$1 method="post" action="?action=signup">', $html, 1);
            $html = str_replace('id="fullName"', 'id="fullName" name="fullname"', $html);
            $html = str_replace('id="signupUser"', 'id="signupUser" name="email_or_phone"', $html);
            $html = str_replace('id="signupPass"', 'id="signupPass" name="password"', $html);
        }

        // Load components and apply rewrites (mimicking ViewEngine behavior)
        $header = $this->loadComponent('header');
        $footer = $this->loadComponent('footer');

        $html = str_replace('<div id="header-placeholder"></div>', $header, $html);
        $html = str_replace('<div id="footer-placeholder" class="mt-auto w-100"></div>', $footer, $html);
        $html = str_replace('<div id="footer-placeholder"></div>', $footer, $html);

        $html = $this->rewriteViewPaths($html);
        $html .= "\n<!-- RENDERED_BY_ViewEngine -->";

        echo $html;
    }

    private function loadComponent(string $name): string
    {
        $componentPath = $this->basePath . '/UI/components/' . $name . '.html';
        return file_exists($componentPath) ? file_get_contents($componentPath) : '';
    }

    private function rewriteViewPaths(string $html): string
    {
        $html = preg_replace('/href\s*=\s*"\.\.\/css\//i', 'href="UI/css/', $html);
        $html = preg_replace('/src\s*=\s*"\.\.\/js\//i', 'src="UI/js/', $html);
        $html = preg_replace('/href\s*=\s*"\.\.\/html\//i', 'href="?page=', $html);

        $html = preg_replace_callback('/href\s*=\s*"([^\"]+)\.html"/i', function ($matches) {
            $page = pathinfo($matches[1], PATHINFO_FILENAME);
            $page = str_replace(' ', '_', $page);
            return 'href="?page=' . urlencode($page) . '"';
        }, $html);

        return $html;
    }

    private function slugToViewFile(string $page): string
    {
        $map = [
            'home' => 'home',
            'login' => 'Login',
            'signup' => 'Login',
            'article' => 'article',
            'post' => 'post',
            'postnews' => 'postnews',
            'profile' => 'profile',
            'technology' => 'technology',
            'admin_dashboard' => 'admin_dashboard',
            'admin_userm' => 'admin1',
            'admin1' => 'admin1',
            'accountmanagement' => 'AccountManagement',
            'catalogmanagement' => 'CatalogManagement',
            'version-control' => 'version-control',
        ];

        return $map[$page] ?? $page;
    }
}


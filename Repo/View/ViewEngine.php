<?php

class ViewEngine
{
    private string $basePath;

    public function __construct(string $basePath = '')
    {
        $this->basePath = $basePath !== '' ? rtrim($basePath, "\/") : dirname(__DIR__);
    }

    public function render(string $viewName, array $data = []): string
    {
        $filePath = $this->basePath . '/UI/html/' . $viewName . '.html';

        if (!file_exists($filePath)) {
            http_response_code(404);
            return '<h1>404 - Trang không tìm thấy (view)</h1>';
        }

        $html = file_get_contents($filePath);

        // Replace simple placeholders
        foreach ($data as $key => $value) {
            $html = str_replace('{{' . strtoupper($key) . '}}', $value, $html);
        }

        // Load components
        $header = $this->loadComponent('header');
        $footer = $this->loadComponent('footer');

        $html = str_replace('<div id="header-placeholder"></div>', $header, $html);
        $html = str_replace('<div id="footer-placeholder" class="mt-auto w-100"></div>', $footer, $html);
        $html = str_replace('<div id="footer-placeholder"></div>', $footer, $html);

        // Rewrite asset and internal links to work from index.php
        $html = $this->rewriteViewPaths($html);

        // Marker for verification: indicates the ViewEngine produced this HTML
        $html .= "\n<!-- RENDERED_BY_ViewEngine -->";

        return $html;
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
}
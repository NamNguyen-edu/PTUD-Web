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

            // // Simple file cache for heavy pages (short TTL)
            // $cacheDir = $this->basePath . '/tmp_cache';
            // if (!is_dir($cacheDir)) {
            //     @mkdir($cacheDir, 0755, true);
            // }
            // $cacheFile = $cacheDir . '/' . $viewName . '.html';
            // $cacheTtl = 15; // seconds
            // if ($viewName === 'home' && file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
            //     return file_get_contents($cacheFile) . "\n<!-- RENDERED_BY_ViewEngine (cache) -->";
            // }

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

        $html = preg_replace(
    '/<div id="header-placeholder"><\/div>/i',
    $header,
    $html,
    1
    );
        $html = preg_replace(
    '/<div id="footer-placeholder" class="mt-auto w-100"><\/div>/i',
    $footer,
    $html,
    1
    );
        $html = preg_replace(
    '/<div id="footer-placeholder"><\/div>/i',
    $footer,
    $html,
    1
    );

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

        // $html = preg_replace_callback('/href\s*=\s*"([^\"]+)\.html"/i', function ($matches) {
        //     $page = pathinfo($matches[1], PATHINFO_FILENAME);
        //     $page = str_replace(' ', '_', $page);
        //     return 'href="?page=' . urlencode($page) . '"';
        // }, $html);

        return $html;
    }
}

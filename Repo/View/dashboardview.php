<?php
require_once __DIR__ . '/ViewEngine.php';

class DashboardView
{
  private ViewEngine $engine;

  public function __construct()
  {
    $this->engine = new ViewEngine(dirname(__DIR__));
  }

  public function render(array $data = []): void
  {
    $basePath = dirname(__DIR__);

    $sidebarHtml = @file_get_contents($basePath . '/UI/html/sidebar_admin.html') ?: '';
    $headerHtml  = @file_get_contents($basePath . '/UI/html/header_admin.html') ?: '';

    echo $this->engine->render('admin_dashboard', [
      'SIDEBAR_COMPONENT' => $sidebarHtml,
      'HEADER_COMPONENT'  => $headerHtml,
      'TITLE'             => $data['TITLE'] ?? 'NewPulse Dashboard'
    ]);
  }
}

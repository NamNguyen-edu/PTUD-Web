<?php
// =============================================
// FILE: Controller/Version_list_controller.php
// =============================================

require_once __DIR__ . '/../Services/Version_list_service.php';
require_once __DIR__ . '/../View/VersionListView.php';

class VersionListController
{
    private VersionListService $service;

    public function __construct()
    {
        $this->service = new VersionListService();
    }

    public function index(): void
    {
        $articles = $this->service->getPendingArticles();

        $view = new VersionListView();
        $view->render($articles);
    }
}
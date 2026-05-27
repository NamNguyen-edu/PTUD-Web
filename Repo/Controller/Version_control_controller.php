<?php

require_once __DIR__ . '/../Services/Version_control_service.php';
require_once __DIR__ . '/../View/Version_control_View.php';

class VersionControlController
{
    private VersionControlService $service;

    public function __construct()
    {
        $this->service = new VersionControlService();
    }

    public function show(): void
    {
        $articleId = (int)($_GET['article_id'] ?? 0);

        if ($articleId <= 0) {
            die('Thiếu article_id');
        }

        // lấy bài viết
        $article = $this->service->getArticle($articleId);

        if (!$article) {
            die('Không tìm thấy bài viết');
        }

        // lấy version
        $versions = $this->service->getVersions($articleId);

        // tạo diff
        $diff = $this->service->generateDiff($versions);

        // render
        $view = new VersionControlView();

        $view->render(
            $article,
            $versions,
            $diff
        );
    }

    public function restoreVersion(): void
    {
        header('Content-Type: application/json');

        $data = $_POST;
        if (empty($data) && strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
            $payload = json_decode(file_get_contents('php://input'), true);
            if (is_array($payload)) {
                $data = $payload;
            }
        }

        $versionId = (int)($data['version_id'] ?? 0);

        if ($versionId <= 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Version không hợp lệ'
            ]);
            return;
        }

        $success = $this->service->restoreVersion($versionId);

        echo json_encode([
            'success' => $success
        ]);
    }

    public function deleteVersion(): void
    {
        header('Content-Type: application/json');

        $versionId = (int)($_POST['version_id'] ?? 0);

        if ($versionId <= 0) {
            echo json_encode([
                'success' => false
            ]);
            return;
        }

        $success = $this->service->deleteVersion($versionId);

        echo json_encode([
            'success' => $success
        ]);
    }
}